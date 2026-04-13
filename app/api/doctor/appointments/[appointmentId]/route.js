import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserId } from '@/services/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/doctor/appointments/[appointmentId]
 * Get specific appointment details for authenticated doctor
 * 
 * RBAC:
 * ✓ Doctor (role_id = 2) can view only their own appointments
 * ✓ Admin (role_id = 1) can view any doctor's appointments
 * ✗ Other roles: Access Denied
 */
export async function GET(request, { params }) {
  try {
    const { appointmentId } = await params;

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    let connection;
    try {
      connection = await db.getConnection();
    } catch (dbError) {
      throw new Error(`Database connection failed: ${dbError?.message || String(dbError)}`);
    }

    // Get current user
    let userId;
    try {
      userId = await getUserId();
    } catch (authError) {
      throw new Error(`Authentication failed: ${authError?.message || String(authError)}`);
    }

    // Get user role
    const [userRows] = await connection.query(
      `SELECT role_id FROM users WHERE user_id = ?`,
      [userId]
    );

    if (!userRows.length) {
      throw new Error(`User ${userId} not found in database`);
    }

    const roleId = userRows[0].role_id;

    // Allow DOCTOR (role_id = 2) and ADMIN (role_id = 1)
    if (roleId !== 2 && roleId !== 1) {
      throw new Error(`Access Denied: Required role DOCTOR (2) or ADMIN (1), got ${roleId}`);
    }

    // Get doctor info if doctor role
    let doctorId = null;
    if (roleId === 2) {
      const [doctorRows] = await connection.query(
        `SELECT d.doctor_id 
         FROM doctors d
         JOIN staff s ON d.staff_id = s.staff_id
         WHERE s.user_id = ?`,
        [userId]
      );

      if (!doctorRows.length) {
        throw new Error(`Doctor profile not found for user ${userId}`);
      }
      doctorId = doctorRows[0].doctor_id;
    }

    // Fetch appointment details
    let query = `
      SELECT 
        a.appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.duration_minutes,
        a.status,
        a.reason_for_visit,
        a.notes,
        a.patient_id,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.mrn,
        d.doctor_id,
        s.first_name as doctor_first_name,
        s.last_name as doctor_last_name,
        s.department_id as doctor_department_id,
        dept.department_name as doctor_department_name,
        a.department_id as appointment_department_id,
        apt_dept.department_name as appointment_department_name
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.doctor_id
      JOIN staff s ON d.staff_id = s.staff_id
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN departments dept ON s.department_id = dept.department_id
      LEFT JOIN departments apt_dept ON a.department_id = apt_dept.department_id
      WHERE a.appointment_id = ?
    `;

    // Add doctor filter if doctor role
    if (roleId === 2) {
      query += ` AND a.doctor_id = ?`;
    }

    const params_array = roleId === 2 ? [appointmentId, doctorId] : [appointmentId];
    const [appointments] = await connection.query(query, params_array);

    connection.release();

    if (!appointments.length) {
      return NextResponse.json(
        { error: 'Appointment not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      appointment: appointments[0],
    });
  } catch (error) {
    console.error('Appointment Details API Error:', error?.message);

    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch appointment details' },
      { status: statusCode }
    );
  }
}

/**
 * PUT /api/doctor/appointments/[appointmentId]
 * Update appointment status (Scheduled, Completed, Cancelled, No Show)
 * 
 * RBAC:
 * ✓ Doctor (role_id = 2) can update only their own appointments
 * ✓ Admin (role_id = 1) can update any appointment
 * ✗ Other roles: Access Denied
 */
export async function PUT(request, { params }) {
  try {
    const { appointmentId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['Scheduled', 'Completed', 'Cancelled', 'No Show'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    let connection;
    try {
      connection = await db.getConnection();
    } catch (dbError) {
      throw new Error(`Database connection failed: ${dbError?.message}`);
    }

    // Get current user
    let userId;
    try {
      userId = await getUserId();
    } catch (authError) {
      throw new Error(`Authentication failed: ${authError?.message}`);
    }

    try {
      // Get user role
      const [userRows] = await connection.query(
        `SELECT role_id FROM users WHERE user_id = ?`,
        [userId]
      );

      if (!userRows.length) {
        throw new Error(`User ${userId} not found in database`);
      }

      const roleId = userRows[0].role_id;

      // Only DOCTOR (2) and ADMIN (1) can update
      if (roleId !== 2 && roleId !== 1) {
        throw new Error(`Access Denied: Required role DOCTOR (2) or ADMIN (1), got ${roleId}`);
      }

      // Get doctor ID if doctor role
      let doctorId = null;
      if (roleId === 2) {
        const [doctorRows] = await connection.query(
          `SELECT doctor_id FROM doctors d
           JOIN staff s ON d.staff_id = s.staff_id
           WHERE s.user_id = ?`,
          [userId]
        );

        if (!doctorRows.length) {
          throw new Error(`Doctor profile not found for user ${userId}`);
        }

        doctorId = doctorRows[0].doctor_id;
      }

      // Get current appointment
      let query = `SELECT * FROM appointments WHERE appointment_id = ?`;
      if (roleId === 2) {
        query += ` AND doctor_id = ?`;
      }

      const params_array = roleId === 2 ? [appointmentId, doctorId] : [appointmentId];
      const [appointments] = await connection.query(query, params_array);

      if (!appointments.length) {
        throw new Error('Appointment not found or access denied');
      }

      // Update appointment status
      await connection.query(
        `UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE appointment_id = ?`,
        [status, appointmentId]
      );

      // Log to audit_logs
      await connection.query(
        `INSERT INTO audit_logs (user_id, action_type, table_name, record_id, new_data, timestamp)
         VALUES (?, 'UPDATE', 'appointments', ?, 
         JSON_OBJECT('status', ?), CURRENT_TIMESTAMP)`,
        [userId, appointmentId, status]
      );

      // Fetch and return updated appointment
      const [updatedAppointments] = await connection.query(
        `SELECT * FROM appointments WHERE appointment_id = ?`,
        [appointmentId]
      );

      return NextResponse.json({
        success: true,
        data: updatedAppointments[0],
        message: 'Appointment status updated successfully',
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error('Update Appointment API Error:', error?.message);

    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      400;

    return NextResponse.json(
      { error: error?.message || 'Failed to update appointment' },
      { status: statusCode }
    );
  }
}
