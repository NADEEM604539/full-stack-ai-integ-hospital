const db = require('../lib/db');
const { text } = require('sqlalchemy');

// ==========================================
// FINANCE SERVICES
// ==========================================

// Get all completed appointments (for invoice generation)
const getCompletedAppointments = async (filters = {}) => {
  try {
    const { departmentId, status = 'Completed', limit = 100, offset = 0 } = filters;

    let query = `
      SELECT 
        a.appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.reason_for_visit,
        p.patient_id,
        p.mrn,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        p.email AS patient_email,
        d.doctor_id,
        s.first_name AS doctor_first_name,
        s.last_name AS doctor_last_name,
        dept.department_id,
        dept.department_name,
        doc.consultation_fee,
        COALESCE(
          (SELECT SUM(omi.total_price) FROM order_medicine_items omi
           JOIN order_medicine om ON omi.order_id = om.order_id
           WHERE om.appointment_id = a.appointment_id AND om.status = 'Accepted'),
          0
        ) AS medicines_total,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM invoices 
            WHERE appointment_id = a.appointment_id AND is_deleted = FALSE
          ) THEN 'Generated'
          ELSE 'Not Generated'
        END AS invoice_status
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN doctors d ON a.doctor_id = d.doctor_id
      JOIN staff s ON d.staff_id = s.staff_id
      JOIN departments dept ON a.department_id = dept.department_id
      JOIN doctors doc ON a.doctor_id = doc.doctor_id
      WHERE a.status = ? 
        AND a.is_deleted = FALSE
        AND p.is_deleted = FALSE
    `;

    const params = [status];

    if (departmentId) {
      query += ` AND a.department_id = ?`;
      params.push(departmentId);
    }

    query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC
               LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await db.execute(query, params);
    return result;
  } catch (err) {
    console.error('Error fetching completed appointments:', err);
    throw err;
  }
};

// Get invoice details for a completed appointment
const getAppointmentInvoiceDetails = async (appointmentId) => {
  try {
    const query = `
      SELECT 
        a.appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.reason_for_visit,
        p.patient_id,
        p.mrn,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        p.email,
        p.phone_number,
        d.doctor_id,
        CONCAT(s.first_name, ' ', s.last_name) AS doctor_name,
        dept.department_name,
        doc.consultation_fee,
        GROUP_CONCAT(
          JSON_OBJECT(
            'medicine_id', omi.medicine_id,
            'medicine_name', omi.medicine_name,
            'quantity', omi.quantity,
            'unit_price', omi.unit_price,
            'total_price', omi.total_price
          )
          SEPARATOR ','
        ) AS medicines
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN doctors d ON a.doctor_id = d.doctor_id
      JOIN staff s ON d.staff_id = s.staff_id
      JOIN departments dept ON a.department_id = dept.department_id
      JOIN doctors doc ON a.doctor_id = doc.doctor_id
      LEFT JOIN order_medicine om ON a.appointment_id = om.appointment_id AND om.status = 'Accepted'
      LEFT JOIN order_medicine_items omi ON om.order_id = omi.order_id
      WHERE a.appointment_id = ? AND a.status = 'Completed'
      GROUP BY a.appointment_id
    `;

    const result = await db.execute(query, [appointmentId]);
    
    if (result.length === 0) {
      return null;
    }

    const appointment = result[0];
    
    // Parse medicines JSON
    let medicines = [];
    if (appointment.medicines) {
      const medicineArray = appointment.medicines.split(',');
      medicines = medicineArray.map(m => JSON.parse(m));
    }

    return {
      ...appointment,
      medicines
    };
  } catch (err) {
    console.error('Error fetching appointment invoice details:', err);
    throw err;
  }
};

// Generate invoice for a completed appointment
const generateInvoiceForAppointment = async (appointmentId, createdBy) => {
  try {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get appointment details
      const [appointments] = await connection.query(
        `SELECT appointment_id, patient_id, doctor_id FROM appointments WHERE appointment_id = ? AND status = 'Completed'`,
        [appointmentId]
      );

      if (appointments.length === 0) {
        throw new Error('Completed appointment not found');
      }

      const { patient_id: patientId, doctor_id: doctorId } = appointments[0];

      // Check if invoice already exists
      const [existingInvoices] = await connection.query(
        `SELECT invoice_id FROM invoices WHERE appointment_id = ? AND is_deleted = FALSE`,
        [appointmentId]
      );

      if (existingInvoices.length > 0) {
        throw new Error('Invoice already exists for this appointment');
      }

      // Get or create encounter
      const [encounters] = await connection.query(
        `SELECT encounter_id FROM encounters WHERE appointment_id = ? AND is_deleted = FALSE`,
        [appointmentId]
      );

      let encounterId;
      if (encounters.length > 0) {
        encounterId = encounters[0].encounter_id;
      } else {
        const [result] = await connection.query(
          `INSERT INTO encounters (patient_id, doctor_id, appointment_id, encounter_type, admission_date, chief_complaint, status, created_by)
           SELECT a.patient_id, a.doctor_id, a.appointment_id, 'Outpatient', NOW(), a.reason_for_visit, 'Active', ?
           FROM appointments a WHERE a.appointment_id = ?`,
          [createdBy, appointmentId]
        );
        encounterId = result.insertId;
      }

      // Calculate invoice totals
      const [doctors] = await connection.query(
        `SELECT consultation_fee FROM doctors WHERE doctor_id = ?`,
        [doctorId]
      );

      let consultationFee = doctors.length > 0 ? doctors[0].consultation_fee : 500;
      
      const [medicineOrders] = await connection.query(
        `SELECT COALESCE(SUM(omi.total_price), 0) AS total_medicines
         FROM order_medicine om
         JOIN order_medicine_items omi ON om.order_id = omi.order_id
         WHERE om.appointment_id = ? AND om.status = 'Accepted'`,
        [appointmentId]
      );

      const medicinesTotal = medicineOrders[0]?.total_medicines || 0;
      const subtotal = consultationFee + medicinesTotal;
      const taxAmount = subtotal * 0.10;
      const totalAmount = subtotal + taxAmount;

      // Create invoice
      const [invoiceResult] = await connection.query(
        `INSERT INTO invoices 
         (appointment_id, encounter_id, patient_id, invoice_date, due_date, subtotal, tax_amount, discount_amount, total_amount, status, created_by)
         VALUES (?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), ?, ?, 0, ?, 'Unpaid', ?)`,
        [appointmentId, encounterId, patientId, subtotal, taxAmount, totalAmount, createdBy]
      );

      const invoiceId = invoiceResult.insertId;

      // Add consultation fee line item
      const [doctorName] = await connection.query(
        `SELECT CONCAT(s.first_name, ' ', s.last_name) AS name FROM doctors d
         JOIN staff s ON d.staff_id = s.staff_id WHERE d.doctor_id = ?`,
        [doctorId]
      );

      await connection.query(
        `INSERT INTO invoice_line_items (invoice_id, description, item_type, quantity, unit_price)
         VALUES (?, ?, 'Consultation', 1, ?)`,
        [invoiceId, `Doctor Consultation - Dr. ${doctorName[0]?.name || 'Unknown'}`, consultationFee]
      );

      // Add medicine line items
      if (medicinesTotal > 0) {
        const [medicines] = await connection.query(
          `SELECT omi.medicine_name, omi.quantity, omi.unit_price
           FROM order_medicine om
           JOIN order_medicine_items omi ON om.order_id = omi.order_id
           WHERE om.appointment_id = ? AND om.status = 'Accepted'`,
          [appointmentId]
        );

        for (const medicine of medicines) {
          await connection.query(
            `INSERT INTO invoice_line_items (invoice_id, description, item_type, quantity, unit_price)
             VALUES (?, ?, 'Medication', ?, ?)`,
            [invoiceId, medicine.medicine_name, medicine.quantity, medicine.unit_price]
          );
        }
      }

      await connection.commit();
      connection.release();

      return {
        invoice_id: invoiceId,
        appointment_id: appointmentId,
        patient_id: patientId,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: 'Unpaid',
        due_date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0]
      };
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error('Error generating invoice:', err);
    throw err;
  }
};

// Get financial summary (all invoices, payments, etc.)
const getFinancialSummary = async (filters = {}) => {
  try {
    const { startDate, endDate, departmentId, status } = filters;

    let whereClause = 'i.is_deleted = FALSE AND p.is_deleted = FALSE';
    const params = [];

    if (startDate) {
      whereClause += ` AND i.invoice_date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ` AND i.invoice_date <= ?`;
      params.push(endDate);
    }
    if (departmentId) {
      whereClause += ` AND a.department_id = ?`;
      params.push(departmentId);
    }
    if (status) {
      whereClause += ` AND i.status = ?`;
      params.push(status);
    }

    const query = `
      SELECT 
        COUNT(DISTINCT i.invoice_id) AS total_invoices,
        COUNT(DISTINCT CASE WHEN i.status = 'Paid' THEN i.invoice_id END) AS paid_invoices,
        COUNT(DISTINCT CASE WHEN i.status = 'Unpaid' THEN i.invoice_id END) AS unpaid_invoices,
        COUNT(DISTINCT CASE WHEN i.status = 'Partial' THEN i.invoice_id END) AS partial_invoices,
        COALESCE(SUM(i.total_amount), 0) AS total_revenue,
        COALESCE(SUM(i.amount_paid), 0) AS total_paid,
        COALESCE(SUM(i.total_amount - i.amount_paid), 0) AS total_outstanding,
        COUNT(DISTINCT CASE WHEN i.status = 'Overdue' THEN i.invoice_id END) AS overdue_count,
        COALESCE(SUM(CASE WHEN i.status = 'Overdue' THEN i.total_amount - i.amount_paid ELSE 0 END), 0) AS overdue_amount
      FROM invoices i
      LEFT JOIN appointments a ON i.appointment_id = a.appointment_id
      LEFT JOIN patients p ON i.patient_id = p.patient_id
      WHERE ${whereClause}
    `;

    const result = await db.execute(query, params);
    return result[0] || {};
  } catch (err) {
    console.error('Error fetching financial summary:', err);
    throw err;
  }
};

// Get invoices with details
const getInvoicesWithDetails = async (filters = {}) => {
  try {
    const { 
      status, 
      patientId, 
      departmentId, 
      limit = 50, 
      offset = 0 
    } = filters;

    let query = `
      SELECT 
        i.invoice_id,
        i.appointment_id,
        i.invoice_date,
        i.due_date,
        i.subtotal,
        i.tax_amount,
        i.discount_amount,
        i.total_amount,
        i.amount_paid,
        i.status,
        DATEDIFF(NOW(), i.due_date) AS days_overdue,
        p.patient_id,
        p.mrn,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        a.appointment_date,
        a.appointment_time,
        CONCAT(s.first_name, ' ', s.last_name) AS doctor_name,
        dept.department_name
      FROM invoices i
      LEFT JOIN appointments a ON i.appointment_id = a.appointment_id
      LEFT JOIN patients p ON i.patient_id = p.patient_id
      LEFT JOIN doctors d ON a.doctor_id = d.doctor_id
      LEFT JOIN staff s ON d.staff_id = s.staff_id
      LEFT JOIN departments dept ON a.department_id = dept.department_id
      WHERE i.is_deleted = FALSE
    `;

    const params = [];

    if (status) {
      query += ` AND i.status = ?`;
      params.push(status);
    }
    if (patientId) {
      query += ` AND p.patient_id = ?`;
      params.push(patientId);
    }
    if (departmentId) {
      query += ` AND a.department_id = ?`;
      params.push(departmentId);
    }

    query += ` ORDER BY i.invoice_date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await db.execute(query, params);
    return result;
  } catch (err) {
    console.error('Error fetching invoices with details:', err);
    throw err;
  }
};

module.exports = {
  getCompletedAppointments,
  getAppointmentInvoiceDetails,
  generateInvoiceForAppointment,
  getFinancialSummary,
  getInvoicesWithDetails
};
