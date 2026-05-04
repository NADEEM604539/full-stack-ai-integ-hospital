import db from '@/lib/db';
import { getUserId } from './auth';

/**
 * FINANCE SERVICE - Department-based data access
 * Finance (role_id = 6) can ONLY:
 * - View invoices for their own department
 * - Generate invoices for completed appointments in their department
 * - View/manage payments for their department
 * - View financial summaries for their department
 * - Cannot access other departments' financial data
 */

/**
 * Check finance role (role_id = 6) and get finance_id
 * Returns: { userId, roleId, financeId, departmentId }
 */
async function checkFinanceAccess(connection) {
  try {
    let userId;
    try {
      userId = await getUserId();
    } catch (authError) {
      console.error('Auth error in checkFinanceAccess:', authError);
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

    // Allow FINANCE (role_id = 6) and ADMIN (role_id = 1)
    if (roleId !== 6 && roleId !== 1) {
      throw new Error(`Access Denied: Required role FINANCE (6) or ADMIN (1), got ${roleId}`);
    }

    // Get finance staff info: staff -> department
    const [financeRows] = await connection.query(
      `SELECT staff_id, department_id 
       FROM staff
       WHERE user_id = ? AND status = 'Active'`,
      [userId]
    );

    if (!financeRows.length) {
      throw new Error(`Finance profile not found for user ${userId}. Admin must create finance profile.`);
    }

    const financeId = financeRows[0].staff_id;
    const departmentId = financeRows[0].department_id;

    return { userId, roleId, financeId, departmentId };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error in RBAC check';
    console.error('RBAC Check error:', errorMsg);
    throw new Error(`RBAC Check Failed: ${errorMsg}`);
  }
}

/**
 * Get all completed appointments for invoice generation
 * RBAC: Finance staff can only see appointments from their department
 */
export async function getCompletedAppointments(filters = {}) {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkFinanceAccess(connection);
    const { departmentId } = access;

    const { limit = 100, offset = 0 } = filters;

    const [appointments] = await connection.query(
      `SELECT 
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
      WHERE a.status = 'Completed'
        AND a.department_id = ?
        AND a.is_deleted = FALSE
        AND p.is_deleted = FALSE
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT ? OFFSET ?`,
      [departmentId, limit, offset]
    );

    return appointments || [];
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error fetching completed appointments:', errorMsg);
    throw new Error(`Failed to fetch appointments: ${errorMsg}`);
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get invoice details for a completed appointment
 * RBAC: Finance staff can only view invoices from their department
 */
export async function getAppointmentInvoiceDetails(appointmentId) {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkFinanceAccess(connection);
    const { departmentId } = access;

    const [appointments] = await connection.query(
      `SELECT 
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
        doc.consultation_fee
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN doctors d ON a.doctor_id = d.doctor_id
      JOIN staff s ON d.staff_id = s.staff_id
      JOIN departments dept ON a.department_id = dept.department_id
      JOIN doctors doc ON a.doctor_id = doc.doctor_id
      WHERE a.appointment_id = ? 
        AND a.department_id = ?
        AND a.status = 'Completed'`,
      [appointmentId, departmentId]
    );

    if (!appointments.length) {
      throw new Error('Appointment not found or access denied');
    }

    const appointment = appointments[0];

    // Get medicines for this appointment
    const [medicines] = await connection.query(
      `SELECT 
        omi.medicine_id,
        omi.medicine_name,
        omi.quantity,
        omi.unit_price,
        omi.total_price
       FROM order_medicine om
       JOIN order_medicine_items omi ON om.order_id = omi.order_id
       WHERE om.appointment_id = ? AND om.status = 'Accepted'`,
      [appointmentId]
    );

    return {
      ...appointment,
      medicines: medicines || []
    };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error fetching appointment invoice details:', errorMsg);
    throw new Error(`Failed to fetch invoice details: ${errorMsg}`);
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Generate invoice for a completed appointment
 * RBAC: Finance staff can only generate invoices for appointments in their department
 */
export async function generateInvoiceForAppointment(appointmentId, createdByUserId) {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkFinanceAccess(connection);
    const { departmentId, financeId } = access;

    await connection.beginTransaction();

    try {
      // Verify appointment exists and belongs to finance staff's department
      const [appointments] = await connection.query(
        `SELECT a.appointment_id, a.patient_id, a.doctor_id 
         FROM appointments a
         WHERE a.appointment_id = ? AND a.status = 'Completed' AND a.department_id = ?`,
        [appointmentId, departmentId]
      );

      if (!appointments.length) {
        throw new Error('Completed appointment not found or access denied');
      }

      const { patient_id: patientId, doctor_id: doctorId } = appointments[0];

      // Check if invoice already exists (may be created by T10 trigger)
      const [existingInvoices] = await connection.query(
        `SELECT invoice_id FROM invoices_active
         WHERE appointment_id = ?`,
        [appointmentId]
      );

      if (existingInvoices.length > 0) {
        // Invoice already created by T10 trigger - return it
        const [existingInvoiceData] = await connection.query(
          `SELECT * FROM invoices_active WHERE invoice_id = ?`,
          [existingInvoices[0].invoice_id]
        );
        await connection.commit();
        return existingInvoiceData[0];
      }

      // Get or create encounter
      const [encounters] = await connection.query(
        `SELECT encounter_id FROM encounters_active 
         WHERE appointment_id = ?`,
        [appointmentId]
      );

      let encounterId;
      if (encounters.length > 0) {
        encounterId = encounters[0].encounter_id;
      } else {
        const [result] = await connection.query(
          `INSERT INTO encounters 
           (patient_id, doctor_id, appointment_id, encounter_type, admission_date, status, created_by)
           VALUES (?, ?, ?, 'Outpatient', NOW(), 'Active', ?)`,
          [patientId, doctorId, appointmentId, createdByUserId]
        );
        encounterId = result.insertId;
      }

      // Get consultation fee
      const [doctors] = await connection.query(
        `SELECT consultation_fee FROM doctors WHERE doctor_id = ?`,
        [doctorId]
      );

      const consultationFee = Number(doctors.length > 0 ? doctors[0].consultation_fee : 500) || 500;

      // Get medicines total
      const [medicineOrders] = await connection.query(
        `SELECT COALESCE(SUM(omi.total_price), 0) AS total_medicines
         FROM order_medicine om
         JOIN order_medicine_items omi ON om.order_id = omi.order_id
         WHERE om.appointment_id = ? AND om.status = 'Accepted'`,
        [appointmentId]
      );

      const medicinesTotal = Number(medicineOrders[0]?.total_medicines || 0) || 0;
      const subtotal = Number(consultationFee) + Number(medicinesTotal);
      const taxAmount = subtotal * 0.10;
      const totalAmount = subtotal + taxAmount;

      // Create invoice
      const [invoiceResult] = await connection.query(
        `INSERT INTO invoices 
         (appointment_id, encounter_id, patient_id, invoice_date, due_date, subtotal, tax_amount, discount_amount, total_amount, status, created_by)
         VALUES (?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), ?, ?, 0, ?, 'Unpaid', ?)`,
        [appointmentId, encounterId, patientId, subtotal, taxAmount, totalAmount, createdByUserId]
      );

      const invoiceId = invoiceResult.insertId;

      // Get doctor name
      const [doctorName] = await connection.query(
        `SELECT CONCAT(s.first_name, ' ', s.last_name) AS name 
         FROM doctors d
         JOIN staff s ON d.staff_id = s.staff_id 
         WHERE d.doctor_id = ?`,
        [doctorId]
      );

      // Add consultation fee line item
      await connection.query(
        `INSERT INTO invoice_line_items 
         (invoice_id, description, item_type, quantity, unit_price)
         VALUES (?, ?, 'Consultation', 1, ?)`,
        [invoiceId, `Doctor Consultation - Dr. ${doctorName[0]?.name || 'Unknown'}`, Number(consultationFee) || 500]
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
            `INSERT INTO invoice_line_items 
             (invoice_id, description, item_type, quantity, unit_price)
             VALUES (?, ?, 'Medication', ?, ?)`,
            [invoiceId, medicine.medicine_name, Number(medicine.quantity) || 0, Number(medicine.unit_price) || 0]
          );
        }
      }

      await connection.commit();

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
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error generating invoice:', errorMsg);
    throw new Error(`Failed to generate invoice: ${errorMsg}`);
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get financial summary for finance staff's department
 * RBAC: Finance staff can only see summaries for their own department
 */
export async function getFinancialSummary(filters = {}) {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkFinanceAccess(connection);
    const { departmentId } = access;

    const { startDate, endDate, status } = filters;

    let whereClause = 'i.is_deleted = FALSE AND p.is_deleted = FALSE AND a.department_id = ?';
    const params = [departmentId];

    if (startDate) {
      whereClause += ` AND i.invoice_date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ` AND i.invoice_date <= ?`;
      params.push(endDate);
    }
    if (status) {
      whereClause += ` AND i.status = ?`;
      params.push(status);
    }

    const [result] = await connection.query(
      `SELECT 
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
      WHERE ${whereClause}`,
      params
    );

    return result[0] || {};
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error fetching financial summary:', errorMsg);
    throw new Error(`Failed to fetch financial summary: ${errorMsg}`);
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get invoices with details for finance staff's department
 * RBAC: Finance staff can only view invoices from their own department
 */
export async function getInvoicesWithDetails(filters = {}) {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkFinanceAccess(connection);
    const { departmentId } = access;

    const { status, patientId, limit = 50, offset = 0 } = filters;

    let whereClause = `i.is_deleted = FALSE AND a.department_id = ?`;
    const params = [departmentId];

    if (status) {
      whereClause += ` AND i.status = ?`;
      params.push(status);
    }
    if (patientId) {
      whereClause += ` AND p.patient_id = ?`;
      params.push(patientId);
    }

    params.push(limit, offset);

    const [invoices] = await connection.query(
      `SELECT 
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
      WHERE ${whereClause}
      ORDER BY i.invoice_date DESC 
      LIMIT ? OFFSET ?`,
      params
    );

    return invoices || [];
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error fetching invoices with details:', errorMsg);
    throw new Error(`Failed to fetch invoices: ${errorMsg}`);
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get finance staff's own profile
 * Finance can ONLY view their own profile
 */
export async function getFinanceProfile() {
  try {
    let connection;
    try {
      connection = await db.getConnection();
    } catch (dbError) {
      throw new Error(`Database connection failed: ${dbError?.message || String(dbError)}`);
    }

    const access = await checkFinanceAccess(connection);

    const [result] = await connection.query(
      `SELECT 
        s.staff_id,
        s.first_name,
        s.last_name,
        u.email,
        s.phone_number,
        s.designation,
        s.employee_id,
        s.status,
        s.hire_date,
        dept.department_name,
        dept.department_id
      FROM staff s
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN departments dept ON s.department_id = dept.department_id
      WHERE s.staff_id = ? AND s.user_id = ?`,
      [access.financeId, access.userId]
    );

    connection.release();

    if (!result || result.length === 0) {
      throw new Error('Finance profile not found');
    }

    return result[0];
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error(`Failed to fetch finance profile:`, errorMsg);
    throw new Error(`Profile retrieval failed: ${errorMsg}`);
  }
}

/**
 * Update finance staff's phone number only
 * Finance can ONLY update their own phone number
 */
export async function updateFinancePhone(phoneNumber) {
  try {
    let connection;
    try {
      connection = await db.getConnection();
    } catch (dbError) {
      throw new Error(`Database connection failed: ${dbError?.message || String(dbError)}`);
    }

    const access = await checkFinanceAccess(connection);

    const [result] = await connection.query(
      `UPDATE staff 
       SET phone_number = ? 
       WHERE staff_id = ? AND user_id = ?`,
      [phoneNumber, access.financeId, access.userId]
    );

    connection.release();
    return { success: true };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error(`Failed to update finance profile:`, errorMsg);
    throw new Error(`Profile update failed: ${errorMsg}`);
  }
}

export default {
  getCompletedAppointments,
  getAppointmentInvoiceDetails,
  generateInvoiceForAppointment,
  getFinancialSummary,
  getInvoicesWithDetails,
  getFinanceProfile,
  updateFinancePhone
};
