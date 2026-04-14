import { NextRequest, NextResponse } from 'next/server';
import financeService from '@/services/finance';
import db from '@/lib/db';
import { getUserId } from '@/services/auth';

export async function GET(req, { params }) {
  let connection;
  try {
    const { appointmentId } = await params;
    
    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    connection = await db.getConnection();

    // Get current user ID and role
    let userId;
    try {
      userId = await getUserId();
    } catch (authError) {
      connection.release();
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Get user role
    const [userRows] = await connection.query(
      `SELECT role_id FROM users WHERE user_id = ?`,
      [userId]
    );

    if (!userRows.length) {
      connection.release();
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const roleId = userRows[0].role_id;

    // Allow FINANCE (role_id = 6) and ADMIN (role_id = 1)
    if (roleId !== 6 && roleId !== 1) {
      connection.release();
      return NextResponse.json(
        { success: false, error: 'Access Denied: You must be Finance staff' },
        { status: 403 }
      );
    }

    // Get department if finance
    let departmentId = null;
    if (roleId === 6) {
      const [staffRows] = await connection.query(
        `SELECT department_id FROM staff WHERE user_id = ? AND status = 'Active'`,
        [userId]
      );

      if (staffRows.length === 0) {
        connection.release();
        return NextResponse.json(
          { success: false, error: 'Finance profile not found' },
          { status: 404 }
        );
      }

      departmentId = staffRows[0].department_id;
    }

    // Get appointment & invoice details
    let appointmentQuery = `
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
        p.date_of_birth,
        p.gender,
        p.phone_number,
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
      WHERE a.appointment_id = ? AND a.status = 'Completed'
    `;

    const appointmentParams = [parseInt(appointmentId)];

    if (departmentId) {
      appointmentQuery += ` AND a.department_id = ?`;
      appointmentParams.push(departmentId);
    }

    const [appointments] = await connection.query(appointmentQuery, appointmentParams);

    if (!appointments.length) {
      connection.release();
      return NextResponse.json(
        { success: false, error: 'Completed appointment not found or access denied' },
        { status: 404 }
      );
    }

    const appointment = appointments[0];

    // Get medicines
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
      [parseInt(appointmentId)]
    );

    connection.release();

    return NextResponse.json({
      success: true,
      data: {
        ...appointment,
        medicines: medicines || []
      }
    });
  } catch (err) {
    if (connection) connection.release();
    console.error('Error fetching appointment invoice details:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
