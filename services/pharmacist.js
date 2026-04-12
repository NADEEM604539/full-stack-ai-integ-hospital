import pool from '../lib/db.js';

/**
 * Get all pending medicine requests with details
 * @param {number} departmentId - Optional department filter for stock management
 */
export async function getPendingMedicineRequests(departmentId = null) {
  const connection = await pool.getConnection();

  try {
    let query = `
      SELECT 
        om.order_id,
        om.encounter_id,
        om.appointment_id,
        om.patient_id,
        om.status,
        om.total_amount,
        om.requested_by,
        om.created_at,
        p.mrn,
        p.first_name,
        p.last_name,
        e.encounter_type,
        e.chief_complaint,
        enc_staff.first_name as nurse_first_name,
        enc_staff.last_name as nurse_last_name,
        COUNT(omi.item_id) as item_count
      FROM order_medicine om
      LEFT JOIN patients p ON om.patient_id = p.patient_id
      LEFT JOIN encounters e ON om.encounter_id = e.encounter_id
      LEFT JOIN staff enc_staff ON om.requested_by = enc_staff.staff_id
      LEFT JOIN order_medicine_items omi ON om.order_id = omi.order_id
      WHERE om.status = 'Pending'
      GROUP BY om.order_id
      ORDER BY om.created_at DESC
    `;

    const [requests] = await connection.query(query);
    return requests;
  } finally {
    connection.release();
  }
}

/**
 * Get a specific medicine order with all items
 * @param {number} orderId - Order ID
 */
export async function getMedicineOrderDetail(orderId) {
  const connection = await pool.getConnection();

  try {
    // Get order header
    const [orders] = await connection.query(`
      SELECT 
        om.order_id,
        om.encounter_id,
        om.appointment_id,
        om.patient_id,
        om.status,
        om.total_amount,
        om.rejection_reason,
        om.requested_by,
        om.approved_by,
        om.created_at,
        om.updated_at,
        p.mrn,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        e.encounter_type,
        e.chief_complaint,
        e.admission_date,
        nurse_staff.first_name as nurse_first_name,
        nurse_staff.last_name as nurse_last_name,
        pharma_staff.first_name as approval_first_name,
        pharma_staff.last_name as approval_last_name
      FROM order_medicine om
      LEFT JOIN patients p ON om.patient_id = p.patient_id
      LEFT JOIN encounters e ON om.encounter_id = e.encounter_id
      LEFT JOIN staff nurse_staff ON om.requested_by = nurse_staff.staff_id
      LEFT JOIN staff pharma_staff ON om.approved_by = pharma_staff.staff_id
      WHERE om.order_id = ?
    `, [orderId]);

    if (orders.length === 0) {
      return null;
    }

    const order = orders[0];

    // Get order items
    const [items] = await connection.query(`
      SELECT 
        omi.item_id,
        omi.order_id,
        omi.medicine_id,
        omi.medicine_name,
        omi.quantity,
        omi.unit_price,
        omi.total_price,
        omi.notes,
        ii.sku,
        ii.manufacturer,
        ii.quantity_in_stock
      FROM order_medicine_items omi
      LEFT JOIN inventory_items ii ON omi.medicine_id = ii.item_id
      WHERE omi.order_id = ?
      ORDER BY omi.item_id ASC
    `, [orderId]);

    return {
      ...order,
      items: items || []
    };
  } finally {
    connection.release();
  }
}

/**
 * Approve a medicine order and create invoice line items
 * @param {number} orderId - Order ID to approve
 * @param {number} pharmacistId - Staff ID of approving pharmacist
 */
export async function approveMedicineOrder(orderId, pharmacistId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Update order status to Accepted
    await connection.query(
      `UPDATE order_medicine 
       SET status = 'Accepted', approved_by = ?, updated_at = NOW() 
       WHERE order_id = ?`,
      [pharmacistId, orderId]
    );

    // Get the order details to link with invoice
    const [orders] = await connection.query(
      `SELECT encounter_id, patient_id, total_amount FROM order_medicine WHERE order_id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      throw new Error('Order not found');
    }

    const { encounter_id: encounterId, patient_id: patientId, total_amount: orderAmount } = orders[0];

    // Check if invoice exists for this encounter
    const [invoices] = await connection.query(
      `SELECT invoice_id FROM invoices WHERE encounter_id = ? LIMIT 1`,
      [encounterId]
    );

    let invoiceId;

    if (invoices.length > 0) {
      // Invoice exists - add line item to existing invoice
      invoiceId = invoices[0].invoice_id;
    } else {
      // Create new invoice for this encounter
      const [result] = await connection.query(
        `INSERT INTO invoices (encounter_id, patient_id, invoice_date, due_date, subtotal, tax_amount, total_amount, status, created_by)
         VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), ?, ?, ?, 'Unpaid', ?)`,
        [encounterId, patientId, orderAmount, orderAmount * 0.10, orderAmount * 1.10, pharmacistId]
      );
      invoiceId = result.insertId;
    }

    // Add line item for approved medicines
    await connection.query(
      `INSERT INTO invoice_line_items (invoice_id, description, item_type, quantity, unit_price)
       VALUES (?, ?, 'Medication', 1, ?)`,
      [invoiceId, `Approved Medicine Order #${orderId}`, orderAmount]
    );

    // Update invoice totals
    const [lineTotals] = await connection.query(
      `SELECT SUM(quantity * unit_price) as subtotal FROM invoice_line_items WHERE invoice_id = ?`,
      [invoiceId]
    );

    const subtotal = lineTotals[0].subtotal || 0;
    const tax = subtotal * 0.10;
    const total = subtotal + tax;

    await connection.query(
      `UPDATE invoices SET subtotal = ?, tax_amount = ?, total_amount = ?, updated_at = NOW() WHERE invoice_id = ?`,
      [subtotal, tax, total, invoiceId]
    );

    await connection.commit();

    return {
      orderId: orderId,
      status: 'Accepted',
      invoiceId: invoiceId,
      message: 'Medicine order approved and added to invoice'
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Reject a medicine order with reason
 * @param {number} orderId - Order ID to reject
 * @param {string} reason - Rejection reason
 * @param {number} pharmacistId - Staff ID of pharmacist rejecting
 */
export async function rejectMedicineOrder(orderId, reason, pharmacistId) {
  const connection = await pool.getConnection();

  try {
    await connection.query(
      `UPDATE order_medicine 
       SET status = 'Rejected', rejection_reason = ?, approved_by = ?, updated_at = NOW() 
       WHERE order_id = ?`,
      [reason, pharmacistId, orderId]
    );

    return {
      orderId: orderId,
      status: 'Rejected',
      reason: reason,
      message: 'Medicine order rejected'
    };
  } finally {
    connection.release();
  }
}

/**
 * Get all medicine orders (all statuses) for reporting
 * @param {string} status - Filter by status (Optional: 'Pending', 'Accepted', 'Rejected')
 * @param {number} limit - Pagination limit
 * @param {number} offset - Pagination offset
 */
export async function getAllMedicineOrders(status = null, limit = 50, offset = 0) {
  const connection = await pool.getConnection();

  try {
    let query = `
      SELECT 
        om.order_id,
        om.encounter_id,
        om.patient_id,
        om.status,
        om.total_amount,
        om.requested_by,
        om.approved_by,
        om.created_at,
        om.updated_at,
        p.mrn,
        p.first_name,
        p.last_name,
        e.encounter_type,
        nurse_staff.first_name as nurse_first_name,
        nurse_staff.last_name as nurse_last_name,
        pharma_staff.first_name as approval_first_name,
        pharma_staff.last_name as approval_last_name,
        COUNT(omi.item_id) as item_count
      FROM order_medicine om
      LEFT JOIN patients p ON om.patient_id = p.patient_id
      LEFT JOIN encounters e ON om.encounter_id = e.encounter_id
      LEFT JOIN staff nurse_staff ON om.requested_by = nurse_staff.staff_id
      LEFT JOIN staff pharma_staff ON om.approved_by = pharma_staff.staff_id
      LEFT JOIN order_medicine_items omi ON om.order_id = omi.order_id
    `;

    const params = [];

    if (status) {
      query += ` WHERE om.status = ?`;
      params.push(status);
    }

    query += ` GROUP BY om.order_id ORDER BY om.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [orders] = await connection.query(query, params);
    return orders;
  } finally {
    connection.release();
  }
}

/**
 * Get dashboard statistics for pharmacist
 */
export async function getPharmacistDashboard() {
  const connection = await pool.getConnection();

  try {
    const [stats] = await connection.query(`
      SELECT 
        (SELECT COUNT(*) FROM order_medicine WHERE status = 'Pending') as pending_count,
        (SELECT COUNT(*) FROM order_medicine WHERE status = 'Accepted') as accepted_count,
        (SELECT COUNT(*) FROM order_medicine WHERE status = 'Rejected') as rejected_count,
        (SELECT SUM(total_amount) FROM order_medicine WHERE status = 'Accepted' AND DATE(created_at) = CURDATE()) as today_approved_total,
        (SELECT SUM(total_amount) FROM order_medicine WHERE status = 'Pending') as pending_total
    `);

    return stats[0];
  } finally {
    connection.release();
  }
}
