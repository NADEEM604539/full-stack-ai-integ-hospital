import db from '@/lib/db';
import { getUserId } from './auth';

/**
 * PHARMACIST SERVICE - Department & Role-based data access
 * Pharmacist (role_id = 5) can ONLY:
 * - View medicine requests from their assigned pharmacy department
 * - Approve/reject requests for medicines
 * - Manage inventory for their department
 * - View dispensed medicines
 * - Cannot access other departments' data
 * - Cannot modify patient records or appointments
 */

/**
 * Check pharmacist role (role_id = 5) and get pharmacist_id (staff_id)
 * Returns: { userId, roleId, pharmacistId, departmentId }
 */
async function checkPharmacistAccess(connection) {
  try {
    let userId;
    try {
      userId = await getUserId();
    } catch (authError) {
      console.error('Auth error in checkPharmacistAccess:', authError);
      throw new Error(`Authentication failed: ${authError?.message || String(authError)}`);
    }

    if (!userId) {
      throw new Error('No user ID obtained from authentication');
    }

    // Query user role from database
    const [userRows] = await connection.query(
      `SELECT role_id FROM users WHERE user_id = ?`,
      [userId]
    );

    if (!userRows.length) {
      throw new Error(`User ${userId} not found in database`);
    }

    const roleId = userRows[0].role_id;

    // Allow PHARMACIST (role_id = 5) and ADMIN (role_id = 1)
    if (roleId !== 5 && roleId !== 1) {
      throw new Error(`Access Denied: Required role PHARMACIST (5) or ADMIN (1), got ${roleId}`);
    }

    // Get pharmacist info: staff -> department
    const [pharmacistRows] = await connection.query(
      `SELECT staff_id, department_id 
       FROM staff
       WHERE user_id = ? AND status = 'Active'`,
      [userId]
    );

    if (!pharmacistRows.length) {
      throw new Error(`Pharmacist profile not found for user ${userId}. Admin must create pharmacist profile.`);
    }

    const pharmacistId = pharmacistRows[0].staff_id;
    const departmentId = pharmacistRows[0].department_id;

    return { userId, roleId, pharmacistId, departmentId };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error in RBAC check';
    console.error('RBAC Check error:', errorMsg);
    throw new Error(`RBAC Check Failed: ${errorMsg}`);
  }
}

/**
 * Get all pending medicine requests for pharmacist's department
 * Approach: Get all appointments in pharmacist's department, then get pending medicine orders for those appointments
 * RBAC: Pharmacist can only see requests for appointments in their department
 */
export async function getPendingMedicineRequests() {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkPharmacistAccess(connection);
    const { departmentId } = access;

    // Step 1: Get all appointments in the pharmacist's department
    const [appointments] = await connection.query(`
      SELECT a.appointment_id
      FROM appointments a
      WHERE a.department_id = ? AND a.is_deleted = FALSE
      ORDER BY a.appointment_date DESC
    `, [departmentId]);

    if (appointments.length === 0) {
      return []; // No appointments in this department
    }

    const appointmentIds = appointments.map(apt => apt.appointment_id);

    // Step 2: Get all pending medicine orders for these appointments
    const [requests] = await connection.query(`
      SELECT 
        om.order_id,
        om.appointment_id,
        om.patient_id,
        om.status,
        om.total_amount,
        om.requested_by,
        om.created_at,
        p.mrn,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.first_name,
        p.last_name,
        a.appointment_date,
        a.appointment_time,
        CONCAT(nurse_staff.first_name, ' ', nurse_staff.last_name) as nurse_name,
        COUNT(omi.item_id) as item_count
      FROM order_medicine om
      LEFT JOIN patients p ON om.patient_id = p.patient_id
      LEFT JOIN appointments a ON om.appointment_id = a.appointment_id
      LEFT JOIN staff nurse_staff ON om.requested_by = nurse_staff.staff_id
      LEFT JOIN order_medicine_items omi ON om.order_id = omi.order_id
      WHERE om.status = 'Pending' AND om.appointment_id IN (${appointmentIds.map(() => '?').join(',')})
      GROUP BY om.order_id
      ORDER BY om.created_at DESC
    `, appointmentIds);

    return requests;
  } catch (error) {
    console.error('Error fetching pending medicine requests:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get a specific medicine order with all items
 * RBAC: Pharmacist can only view orders from their department (via appointment)
 * Approach: Verify order's appointment belongs to pharmacist's department
 * @param {number} orderId - Order ID
 */
export async function getMedicineOrderDetail(orderId) {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkPharmacistAccess(connection);
    const { departmentId } = access;

    // Get order header with department check via appointment
    const [orders] = await connection.query(`
      SELECT 
        om.order_id,
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
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        a.appointment_date,
        a.appointment_time,
        a.department_id as appointment_department_id,
        CONCAT(nurse_staff.first_name, ' ', nurse_staff.last_name) as nurse_name,
        CONCAT(pharma_staff.first_name, ' ', pharma_staff.last_name) as approval_name
      FROM order_medicine om
      LEFT JOIN patients p ON om.patient_id = p.patient_id
      LEFT JOIN appointments a ON om.appointment_id = a.appointment_id
      LEFT JOIN staff nurse_staff ON om.requested_by = nurse_staff.staff_id
      LEFT JOIN staff pharma_staff ON om.approved_by = pharma_staff.staff_id
      WHERE om.order_id = ?
    `, [orderId]);

    if (orders.length === 0) {
      throw new Error('Order not found');
    }

    const order = orders[0];

    // Verify appointment belongs to pharmacist's department
    if (order.appointment_department_id !== departmentId) {
      throw new Error('Access Denied: Order belongs to a different department');
    }

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
  } catch (error) {
    console.error('Error fetching medicine order detail:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Approve a medicine order and add to invoice
 * RBAC: Pharmacist can only approve orders from their department
 * @param {number} orderId - Order ID to approve
 */
export async function approveMedicineOrder(orderId) {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkPharmacistAccess(connection);
    const { pharmacistId, departmentId } = access;

    await connection.beginTransaction();

    // Verify order belongs to this pharmacist's department (via appointment)
    const [orderCheck] = await connection.query(`
      SELECT om.order_id, om.patient_id, om.appointment_id, om.total_amount, a.department_id
      FROM order_medicine om
      LEFT JOIN appointments a ON om.appointment_id = a.appointment_id
      WHERE om.order_id = ?
    `, [orderId]);

    if (!orderCheck.length) {
      throw new Error('Order not found');
    }

    if (orderCheck[0].department_id !== departmentId) {
      throw new Error('Access Denied: Order belongs to a different department');
    }

    // Update order status to Accepted
    await connection.query(
      `UPDATE order_medicine 
       SET status = 'Accepted', approved_by = ?, updated_at = NOW() 
       WHERE order_id = ?`,
      [pharmacistId, orderId]
    );

    const { patient_id: patientId, appointment_id: appointmentId, total_amount: orderAmount } = orderCheck[0];

    // Find or create encounter for this appointment
    let encounterId;
    const [encounters] = await connection.query(
      `SELECT encounter_id FROM encounters WHERE appointment_id = ? LIMIT 1`,
      [appointmentId]
    );

    if (encounters.length > 0) {
      encounterId = encounters[0].encounter_id;
    } else {
      // Create a new encounter for this appointment
      const [apptData] = await connection.query(
        `SELECT patient_id, doctor_id, department_id FROM appointments WHERE appointment_id = ?`,
        [appointmentId]
      );
      
      if (apptData.length === 0) {
        throw new Error('Appointment not found');
      }

      const [result] = await connection.query(
        `INSERT INTO encounters (patient_id, doctor_id, appointment_id, encounter_type, admission_date, chief_complaint, status, created_by)
         VALUES (?, ?, ?, 'Outpatient', NOW(), 'Medicine Order Approval', 'Active', ?)`,
        [apptData[0].patient_id, apptData[0].doctor_id, appointmentId, pharmacistId]
      );
      encounterId = result.insertId;
    }

    // Check if invoice exists for this encounter
    const [invoices] = await connection.query(
      `SELECT invoice_id FROM invoices WHERE encounter_id = ? LIMIT 1`,
      [encounterId]
    );

    let invoiceId;

    if (invoices.length > 0) {
      invoiceId = invoices[0].invoice_id;
    } else {
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

    // Get existing discount_amount to include in calculation
    const [invoiceData] = await connection.query(
      `SELECT discount_amount FROM invoices WHERE invoice_id = ?`,
      [invoiceId]
    );

    const subtotal = lineTotals[0].subtotal || 0;
    const discountAmount = invoiceData[0]?.discount_amount || 0;
    const tax = subtotal * 0.10;
    const total = subtotal + tax - discountAmount;

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
    if (connection) await connection.rollback();
    console.error('Error approving medicine order:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Reject a medicine order with reason
 * RBAC: Pharmacist can only reject orders from their department
 * @param {number} orderId - Order ID to reject
 * @param {string} reason - Rejection reason
 */
export async function rejectMedicineOrder(orderId, reason) {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkPharmacistAccess(connection);
    const { pharmacistId, departmentId } = access;

    // Verify order belongs to this pharmacist's department (via appointment)
    const [orderCheck] = await connection.query(`
      SELECT om.order_id, a.department_id
      FROM order_medicine om
      LEFT JOIN appointments a ON om.appointment_id = a.appointment_id
      WHERE om.order_id = ?
    `, [orderId]);

    if (!orderCheck.length) {
      throw new Error('Order not found');
    }

    if (orderCheck[0].department_id !== departmentId) {
      throw new Error('Access Denied: Order belongs to a different department');
    }

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
  } catch (error) {
    console.error('Error rejecting medicine order:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get medicines/inventory for pharmacist's department
 * RBAC: Pharmacist can only view inventory for their department
 */
export async function getInventory() {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkPharmacistAccess(connection);

    const [medicines] = await connection.query(`
      SELECT 
        ii.item_id,
        ii.item_name,
        ii.item_type,
        ii.sku,
        ii.manufacturer,
        ii.unit_price,
        ii.quantity_in_stock,
        ii.reorder_level,
        ii.expiration_date,
        CASE 
          WHEN ii.quantity_in_stock < ii.reorder_level THEN 'LOW_STOCK'
          WHEN ii.expiration_date IS NOT NULL AND ii.expiration_date < DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'EXPIRING_SOON'
          WHEN ii.expiration_date IS NOT NULL AND ii.expiration_date < CURDATE() THEN 'EXPIRED'
          ELSE 'OK'
        END as stock_status,
        (SELECT SUM(quantity) FROM order_medicine_items WHERE medicine_id = ii.item_id) as total_ordered,
        (SELECT SUM(quantity) FROM order_medicine_items 
         WHERE medicine_id = ii.item_id 
         AND order_id IN (SELECT order_id FROM order_medicine WHERE status = 'Pending')) as pending_orders
      FROM inventory_items ii
      WHERE ii.item_type = 'Medication'
      ORDER BY ii.item_name ASC
    `);

    return medicines;
  } catch (error) {
    console.error('Error fetching inventory:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get low stock medicines alert
 * RBAC: Pharmacist can only see low stock medicines
 */
export async function getLowStockMedicines() {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkPharmacistAccess(connection);

    const [lowStock] = await connection.query(`
      SELECT 
        ii.item_id,
        ii.item_name,
        ii.sku,
        ii.quantity_in_stock,
        ii.reorder_level,
        (ii.reorder_level - ii.quantity_in_stock) as shortage,
        ii.unit_price,
        (ii.reorder_level - ii.quantity_in_stock) * ii.unit_price as estimated_cost
      FROM inventory_items ii
      WHERE ii.item_type = 'Medication' AND ii.quantity_in_stock < ii.reorder_level
      ORDER BY (ii.reorder_level - ii.quantity_in_stock) DESC
      LIMIT 10
    `);

    return lowStock;
  } catch (error) {
    console.error('Error fetching low stock medicines:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get expiring medicines alert
 * RBAC: Pharmacist can only see expiring medicines
 */
export async function getExpiringMedicines() {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkPharmacistAccess(connection);

    const [expiring] = await connection.query(`
      SELECT 
        ii.item_id,
        ii.item_name,
        ii.sku,
        ii.expiration_date,
        ii.quantity_in_stock,
        DATEDIFF(ii.expiration_date, CURDATE()) as days_until_expiry,
        ii.unit_price,
        (ii.quantity_in_stock * ii.unit_price) as total_value
      FROM inventory_items ii
      WHERE ii.item_type = 'Medication' 
      AND ii.expiration_date IS NOT NULL 
      AND ii.expiration_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      ORDER BY ii.expiration_date ASC
      LIMIT 10
    `);

    return expiring;
  } catch (error) {
    console.error('Error fetching expiring medicines:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get pharmacist dashboard statistics
 * RBAC: Pharmacist sees only their department's data
 */
export async function getPharmacistDashboard() {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkPharmacistAccess(connection);
    const { departmentId } = access;

    const [stats] = await connection.query(`
      SELECT 
        (SELECT COUNT(*) FROM order_medicine om 
         LEFT JOIN patients p ON om.patient_id = p.patient_id
         WHERE om.status = 'Pending' AND p.department_id = ?) as pending_count,
        (SELECT COUNT(*) FROM order_medicine om 
         LEFT JOIN patients p ON om.patient_id = p.patient_id
         WHERE om.status = 'Accepted' AND p.department_id = ?) as accepted_count,
        (SELECT COUNT(*) FROM order_medicine om 
         LEFT JOIN patients p ON om.patient_id = p.patient_id
         WHERE om.status = 'Rejected' AND p.department_id = ?) as rejected_count,
        (SELECT SUM(total_amount) FROM order_medicine om 
         LEFT JOIN patients p ON om.patient_id = p.patient_id
         WHERE om.status = 'Accepted' AND DATE(om.created_at) = CURDATE() AND p.department_id = ?) as today_approved_total,
        (SELECT SUM(total_amount) FROM order_medicine om 
         LEFT JOIN patients p ON om.patient_id = p.patient_id
         WHERE om.status = 'Pending' AND p.department_id = ?) as pending_total,
        (SELECT COUNT(*) FROM inventory_items WHERE item_type = 'Medication' AND quantity_in_stock < reorder_level) as low_stock_count,
        (SELECT COUNT(*) FROM inventory_items WHERE item_type = 'Medication' AND expiration_date IS NOT NULL AND expiration_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)) as expiring_count,
        (SELECT SUM(quantity_in_stock * unit_price) FROM inventory_items WHERE item_type = 'Medication') as total_inventory_value
    `, [departmentId, departmentId, departmentId, departmentId, departmentId]);

    return stats[0];
  } catch (error) {
    console.error('Error fetching pharmacist dashboard:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}
