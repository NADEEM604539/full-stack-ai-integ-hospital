import db from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * PUT /api/receptionist/appointments/[id]
 * Update appointment details with full validation and conflict detection
 * 
 * Request body:
 * {
 *   doctor_id: number,
 *   appointment_date: "YYYY-MM-DD",
 *   appointment_time: "HH:MM:SS",
 *   reason_for_visit: string,
 *   status: "Scheduled|Completed|Cancelled|No Show"
 * }
 * 
 * ADBMS Features:
 * ✓ Transaction management (atomic updates)
 * ✓ Conflict detection (prevent double-booking)
 * ✓ Referential integrity (validate doctor exists)
 * ✓ Audit logging (track updates)
 * ✓ Parameterized queries (SQL injection prevention)
 */
export async function PUT(request, { params }) {
  let connection;
  try {
    const { id } = await params;
    const appointmentId = parseInt(id);
    const body = await request.json();
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

    // ========== VALIDATION ==========
    if (!appointmentId || isNaN(appointmentId)) {
      return NextResponse.json(
        { error: 'Invalid appointment ID' },
        { status: 400 }
      );
    }

    const errors = [];
    // doctor_id can be null (unassigned appointment)
    if (!body.appointment_date) {
      errors.push('appointment_date is required');
    }
    if (!body.appointment_time) {
      errors.push('appointment_time is required');
    }
    if (!body.status) {
      errors.push('status is required');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Validate status enum
    const validStatuses = ['Scheduled', 'Completed', 'Cancelled', 'No Show'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    connection = await db.getConnection();

    // ========== START TRANSACTION ==========
    await connection.query('START TRANSACTION');

    // Step 1: Get current appointment
    const [appointments] = await connection.query(
      'SELECT appointment_id, doctor_id, patient_id, appointment_date, appointment_time, status FROM appointments WHERE appointment_id = ? AND is_deleted = FALSE',
      [appointmentId]
    );

    if (!appointments.length) {
      await connection.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    const currentAppointment = appointments[0];
    const appointmentChanged = 
      body.doctor_id !== currentAppointment.doctor_id ||
      body.appointment_date !== currentAppointment.appointment_date ||
      body.appointment_time !== currentAppointment.appointment_time;

    // Step 2: Validate doctor exists (only if doctor_id is provided)
    let newDepartmentId = currentAppointment.department_id;
    if (body.doctor_id !== null && body.doctor_id !== undefined) {
      const [doctors] = await connection.query(
        `SELECT d.doctor_id, d.specialization, d.consultation_fee, s.department_id, s.first_name, s.last_name
         FROM doctors d
         JOIN staff s ON d.staff_id = s.staff_id
         WHERE d.doctor_id = ? AND s.status = 'Active'`,
        [body.doctor_id]
      );

      if (!doctors.length) {
        await connection.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Doctor not found or not active' },
          { status: 404 }
        );
      }

      const doctor = doctors[0];
      newDepartmentId = doctor.department_id;
    }

    // Step 3: Check for time slot conflicts (only if appointment details changed AND doctor_id is provided)
    if (appointmentChanged && body.doctor_id !== null && body.doctor_id !== undefined) {
      const [conflicts] = await connection.query(
        `SELECT appointment_id FROM appointments 
         WHERE doctor_id = ? 
         AND appointment_date = ? 
         AND appointment_time = ? 
         AND appointment_id != ?
         AND status != 'Cancelled'
         AND is_deleted = FALSE`,
        [body.doctor_id, body.appointment_date, body.appointment_time, appointmentId]
      );

      if (conflicts.length > 0) {
        await connection.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Time slot is already booked for this doctor', details: 'Another appointment exists at this date and time' },
          { status: 409 }
        );
      }
    }

    // Step 4: Update appointment
    await connection.query(
      `UPDATE appointments 
       SET doctor_id = ?, 
           appointment_date = ?, 
           appointment_time = ?, 
           reason_for_visit = ?, 
           status = ?,
           department_id = ?,
           updated_by = 1,
           updated_at = NOW()
       WHERE appointment_id = ?`,
      [
        body.doctor_id,
        body.appointment_date,
        body.appointment_time,
        body.reason_for_visit || null,
        body.status,
        newDepartmentId,
        appointmentId
      ]
    );

    // Step 5: Audit log
    await connection.query(
      `INSERT INTO audit_logs (user_id, action_type, table_name, record_id, old_data, new_data, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        1, // Updated by receptionist user
        'UPDATE',
        'appointments',
        appointmentId,
        JSON.stringify({
          doctor_id: currentAppointment.doctor_id,
          appointment_date: currentAppointment.appointment_date,
          appointment_time: currentAppointment.appointment_time,
          status: currentAppointment.status
        }),
        JSON.stringify({
          doctor_id: body.doctor_id,
          appointment_date: body.appointment_date,
          appointment_time: body.appointment_time,
          status: body.status,
          reason_for_visit: body.reason_for_visit
        }),
        clientIp
      ]
    );

    // ========== COMMIT TRANSACTION ==========
    await connection.query('COMMIT');

    // Fetch updated appointment with all details
    const [updatedAppts] = await connection.query(
      `SELECT 
        a.appointment_id,
        a.patient_id,
        a.doctor_id,
        a.department_id,
        a.appointment_date,
        a.appointment_time,
        a.duration_minutes,
        a.status,
        a.reason_for_visit,
        a.notes,
        a.created_at,
        a.updated_at,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.phone_number as patient_phone,
        p.mrn,
        d.doctor_id as doc_id,
        s.first_name as doctor_first_name,
        s.last_name as doctor_last_name,
        d.specialization,
        d.consultation_fee,
        dept.department_name
       FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.patient_id
       LEFT JOIN doctors d ON a.doctor_id = d.doctor_id
       LEFT JOIN staff s ON d.staff_id = s.staff_id
       LEFT JOIN departments dept ON a.department_id = dept.department_id
       WHERE a.appointment_id = ?`,
      [appointmentId]
    );

    if (!updatedAppts.length) {
      return NextResponse.json(
        { error: 'Failed to retrieve updated appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment updated successfully',
      appointment: updatedAppts[0],
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    if (connection) {
      try {
        await connection.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('[ROLLBACK_ERROR]', rollbackError);
      }
    }

    console.error('[APPOINTMENT_UPDATE_ERROR]', error);

    // Determine appropriate error response
    if (error.message?.includes('Duplicate')) {
      return NextResponse.json(
        { error: 'Time slot is already booked', details: error.message },
        { status: 409 }
      );
    }

    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Appointment or related resource not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update appointment', details: error.message },
      { status: 500 }
    );

  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/**
 * GET /api/receptionist/appointments/[id]
 * Fetch a single appointment with all details
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const appointmentId = parseInt(id);

    console.log('[GET /api/receptionist/appointments/[id]]', {
      id,
      appointmentId,
      isNaN: isNaN(appointmentId),
    });

    if (!appointmentId || isNaN(appointmentId)) {
      console.error('[INVALID_ID]', { id, appointmentId });
      return NextResponse.json(
        { error: 'Invalid appointment ID' },
        { status: 400 }
      );
    }

    const connection = await db.getConnection();

    try {
      const [appointments] = await connection.query(
        `SELECT 
          a.appointment_id,
          a.patient_id,
          a.doctor_id,
          a.department_id,
          a.appointment_date,
          a.appointment_time,
          a.duration_minutes,
          a.status,
          a.reason_for_visit,
          a.notes,
          a.created_at,
          a.updated_at,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.phone_number as patient_phone,
          p.mrn,
          s.first_name as doctor_first_name,
          s.last_name as doctor_last_name,
          d.specialization,
          d.consultation_fee,
          dept.department_name
         FROM appointments a
         LEFT JOIN patients p ON a.patient_id = p.patient_id
         LEFT JOIN doctors d ON a.doctor_id = d.doctor_id
         LEFT JOIN staff s ON d.staff_id = s.staff_id
         LEFT JOIN departments dept ON a.department_id = dept.department_id
         WHERE a.appointment_id = ?`,
        [appointmentId]
      );

      console.log('[GET_RESULT]', { appointmentId, foundCount: appointments.length, appointments });

      if (!appointments.length) {
        console.error('[APPOINTMENT_NOT_FOUND]', { appointmentId });
        return NextResponse.json(
          { error: 'Appointment not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        appointment: appointments[0],
        timestamp: new Date().toISOString()
      }, { status: 200 });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('[APPOINTMENT_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment', details: error.message },
      { status: 500 }
    );
  }
}
