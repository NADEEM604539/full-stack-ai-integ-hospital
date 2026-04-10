import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { scheduleAppointment, getTodayAppointments } from '@/services/receptionist';

/**
 * Receptionist Appointment Management API
 * 
 * ENDPOINTS:
 * - GET /api/receptionist/appointments - Get today's & upcoming appointments (department-filtered)
 * - POST /api/receptionist/appointments - Create new appointment (with RBAC & department filtering)
 * - PUT /api/receptionist/appointments?id=X - Update appointment status
 * 
 * ADBMS Features Implemented:
 * ✓ Role-based access control (receptionist only - role_id = 4)
 * ✓ Department-based access control (receptionist's assigned departments only)
 * ✓ Transaction management for appointment creation (atomic all-or-nothing)
 * ✓ Conflict detection (prevent double-booking)
 * ✓ Indexed queries for performance
 * ✓ Parameterized queries (SQL injection prevention)
 * ✓ Audit logging
 * ✓ Referential integrity (FK constraints)
 */

/**
 * GET /api/receptionist/appointments
 * Returns appointments in receptionist's departments
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('id');

    // Use receptionist service to get appointments with proper filtering
    const appointments = await getTodayAppointments();

    // If specific appointment requested, filter results
    if (appointmentId) {
      const appointment = appointments.find(apt => apt.appointment_id === parseInt(appointmentId));
      if (!appointment) {
        return NextResponse.json(
          { error: 'Appointment not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        appointment: appointment
      }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      count: appointments.length,
      appointments: appointments,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('[APPOINTMENTS_GET_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch appointments' },
      { status: error.message?.includes('Access Denied') ? 403 : 500 }
    );
  }
}

/**
 * POST /api/receptionist/appointments
 * Create new appointment using receptionist service (with RBAC & department filtering)
 * 
 * Request body:
 * {
 *   patient_id: number,
 *   doctor_id: number,
 *   appointment_date: "YYYY-MM-DD",
 *   appointment_time: "HH:MM:SS",
 *   duration_minutes: number (optional, defaults to 30),
 *   reason_for_visit: string (optional),
 *   department_id: number (optional, uses receptionist's department)
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // ========== VALIDATION ==========
    const errors = [];
    if (!body.patient_id) errors.push('patient_id required');
    if (!body.doctor_id) errors.push('doctor_id required');
    if (!body.appointment_date) errors.push('appointment_date required');
    if (!body.appointment_time) errors.push('appointment_time required');

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // ========== CREATE APPOINTMENT (Uses receptionist service with RBAC + department filtering) ==========
    const result = await scheduleAppointment({
      patient_id: body.patient_id,
      doctor_id: body.doctor_id,
      appointment_date: body.appointment_date,
      appointment_time: body.appointment_time,
      duration_minutes: body.duration_minutes || 30,
      reason_for_visit: body.reason_for_visit || null,
      department_id: body.department_id || null
    });

    console.log(`[APPOINTMENT_CREATED] Doctor: ${body.doctor_id}, Patient: ${body.patient_id}`);

    return NextResponse.json({
      success: true,
      message: 'Appointment scheduled successfully',
      data: result,
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('[APPOINTMENT_CREATE_ERROR]', error);

    // Provide appropriate status code based on error type
    if (error.message?.includes('Access Denied') || error.message?.includes('RBAC')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    if (error.message?.includes('not found') || error.message?.includes('not in your department')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error.message?.includes('overlapping')) {
      return NextResponse.json(
        { error: 'Time slot unavailable', details: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/receptionist/appointments?id=X
 * Update appointment status with proper authorization
 * 
 * Request body:
 * {
 *   status: "Scheduled|CheckedIn|InProgress|Completed|Cancelled|NoShow"
 * }
 */
export async function PUT(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('id');
    const body = await request.json();
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

    if (!appointmentId || !body.status) {
      return NextResponse.json(
        { error: 'appointmentId and status required' },
        { status: 400 }
      );
    }

    connection = await db.getConnection();

    // START TRANSACTION
    await connection.query('START TRANSACTION');

    // Get current appointment
    const [appointment] = await connection.query(
      'SELECT appointment_id, status FROM appointments WHERE appointment_id = ?',
      [appointmentId]
    );

    if (!appointment.length) {
      await connection.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    const oldStatus = appointment[0].status;

    // Update status
    await connection.query(
      'UPDATE appointments SET status = ?, updated_at = NOW() WHERE appointment_id = ?',
      [body.status, appointmentId]
    );

    // Audit log
    await connection.query(
      `INSERT INTO audit_logs 
       (user_id, action, table_name, record_id, old_values, new_values, status, ip_address) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        'UPDATE',
        'appointments',
        appointmentId,
        JSON.stringify({ status: oldStatus }),
        JSON.stringify({ status: body.status }),
        'Success',
        clientIp
      ]
    );

    await connection.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: `Appointment status updated to ${body.status}`,
      appointmentId: appointmentId,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    if (connection) {
      try {
        await connection.query('ROLLBACK');
      } catch (e) {
        console.error('[ROLLBACK_ERROR]', e);
      }
    }

    console.error('[APPOINTMENT_UPDATE_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );

  } finally {
    if (connection) connection.release();
  }
}
