import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getDoctorEncounters } from '@/services/doctor';
import { getUserId } from '@/services/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/doctor/encounters?appointmentId=X or GET /api/doctor/encounters
 * Get encounters for authenticated doctor
 * 
 * Query Parameters:
 * - appointmentId: Get encounter linked to specific appointment + SOAP status
 * - (none): Get all encounters for doctor's patients
 * 
 * RBAC:
 * ✓ Doctor (role_id = 2) can access only encounters for their own patients
 * ✓ Admin (role_id = 1) can access any doctor's encounters
 * ✗ Other roles: Access Denied
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('appointmentId');

    // If appointmentId provided, fetch specific encounter with SOAP status
    if (appointmentId) {
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

      // Get user role and doctor_id if applicable
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

      // Fetch encounter linked to this appointment
      let query = `
        SELECT 
          e.encounter_id,
          e.patient_id,
          e.doctor_id,
          e.appointment_id,
          e.encounter_type,
          e.admission_date,
          e.discharge_date,
          e.chief_complaint,
          e.status,
          e.created_at,
          e.updated_at
        FROM encounters e
        WHERE e.appointment_id = ?
      `;

      if (roleId === 2) {
        query += ` AND e.doctor_id = ?`;
      }

      const params_array = roleId === 2 ? [appointmentId, doctorId] : [appointmentId];
      const [encounters] = await connection.query(query, params_array);

      if (!encounters.length) {
        connection.release();
        return NextResponse.json({
          encounter: null,
          soapStatus: null,
        });
      }

      const encounter = encounters[0];
      const encounterId = encounter.encounter_id;

      // Check if each SOAP note section exists
      const soapStatus = {};

      const tables = [
        { key: 'subjective', table: 'subjective_notes' },
        { key: 'objective', table: 'objective_notes' },
        { key: 'assessment', table: 'assessment_notes' },
        { key: 'plan', table: 'plan_notes' },
      ];

      for (const { key, table } of tables) {
        const [rows] = await connection.query(
          `SELECT 1 FROM ${table} WHERE encounter_id = ? LIMIT 1`,
          [encounterId]
        );
        soapStatus[key] = rows.length > 0;
      }

      connection.release();

      return NextResponse.json({
        encounter,
        soapStatus,
      });
    }

    // Otherwise, fetch all encounters for doctor
    const encounters = await getDoctorEncounters();

    return NextResponse.json({
      success: true,
      data: encounters,
    });
  } catch (error) {
    console.error('Doctor Encounters API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch encounters' },
      { status: statusCode }
    );
  }
}

/**
 * POST /api/doctor/encounters
 * Create a new encounter for an appointment
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { appointmentId, encounterType = 'Outpatient' } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'appointmentId is required' },
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

    // Get user role and doctor_id
    const [userRows] = await connection.query(
      `SELECT role_id FROM users WHERE user_id = ?`,
      [userId]
    );

    if (!userRows.length) {
      throw new Error(`User ${userId} not found in database`);
    }

    const roleId = userRows[0].role_id;

    if (roleId !== 2 && roleId !== 1) {
      throw new Error(`Access Denied: Required role DOCTOR (2) or ADMIN (1), got ${roleId}`);
    }

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

    // Fetch appointment to get patient_id and verify access
    let aptQuery = `
      SELECT a.patient_id, a.doctor_id, a.reason_for_visit
      FROM appointments a
      WHERE a.appointment_id = ?
    `;

    if (roleId === 2) {
      aptQuery += ` AND a.doctor_id = ?`;
    }

    const apt_params = roleId === 2 ? [appointmentId, doctorId] : [appointmentId];
    const [appointments] = await connection.query(aptQuery, apt_params);

    if (!appointments.length) {
      throw new Error('Appointment not found or access denied');
    }

    const { patient_id, doctor_id: apt_doctor_id, reason_for_visit } = appointments[0];

    // Create encounter
    const [result] = await connection.query(
      `INSERT INTO encounters 
       (patient_id, doctor_id, appointment_id, encounter_type, admission_date, chief_complaint, status, created_by)
       VALUES (?, ?, ?, ?, NOW(), ?, 'Active', ?)`,
      [patient_id, apt_doctor_id, appointmentId, encounterType, reason_for_visit || null, userId]
    );

    connection.release();

    return NextResponse.json(
      {
        success: true,
        encounter_id: result.insertId,
        message: 'Encounter created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create Encounter API Error:', error?.message);

    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to create encounter' },
      { status: statusCode }
    );
  }
}
