import { NextResponse } from 'next/server';
import { getUserId } from '@/services/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  let connection;

  try {
    const { id: encounterId } = await params;
    const encId = parseInt(encounterId);

    if (!encId) {
      return NextResponse.json(
        { error: 'Invalid encounter ID' },
        { status: 400 }
      );
    }

    // Get current user
    let userId;
    try {
      userId = await getUserId();
    } catch (authError) {
      throw new Error(`Authentication failed: ${authError?.message}`);
    }

    connection = await db.getConnection();

    // Get user's doctor_id
    const [userRows] = await connection.query(
      `SELECT role_id FROM users WHERE user_id = ?`,
      [userId]
    );

    if (!userRows.length) {
      throw new Error('User not found');
    }

    const roleId = userRows[0].role_id;
    let doctor_id = null;

    if (roleId === 2) { // Doctor role
      const [doctorRows] = await connection.query(
        `SELECT d.doctor_id FROM doctors d
         JOIN staff s ON d.staff_id = s.staff_id
         WHERE s.user_id = ?`,
        [userId]
      );

      if (!doctorRows.length) {
        throw new Error('Doctor profile not found');
      }

      doctor_id = doctorRows[0].doctor_id;
    } else if (roleId !== 1) { // Not admin
      throw new Error('Access Denied: Only doctors and admins can complete encounters');
    }

    // Verify encounter exists and doctor has access
    let encQuery = `
      SELECT e.encounter_id, e.appointment_id, e.doctor_id, e.status
      FROM encounters e
      WHERE e.encounter_id = ?
    `;

    if (roleId === 2) {
      encQuery += ` AND e.doctor_id = ?`;
    }

    const params_array = roleId === 2 ? [encId, doctor_id] : [encId];
    const [encounters] = await connection.query(encQuery, params_array);

    if (!encounters.length) {
      connection.release();
      return NextResponse.json(
        { error: 'Encounter not found or access denied' },
        { status: 404 }
      );
    }

    const encounter = encounters[0];

    // Start transaction
    await connection.beginTransaction();

    try {
      // Update encounter status to Discharged
      await connection.query(
        `UPDATE encounters 
         SET status = 'Discharged', 
             updated_by = ?,
             updated_at = NOW()
         WHERE encounter_id = ?`,
        [userId, encId]
      );

      // Update linked appointment status to Completed (if appointment exists)
      if (encounter.appointment_id) {
        await connection.query(
          `UPDATE appointments 
           SET status = 'Completed',
               updated_by = ?,
               updated_at = NOW()
           WHERE appointment_id = ?`,
          [userId, encounter.appointment_id]
        );
      }

      // Commit transaction
      await connection.commit();
      connection.release();

      return NextResponse.json({
        success: true,
        message: 'Encounter completed successfully',
        encounterId: encId,
        appointmentId: encounter.appointment_id,
      });
    } catch (txErr) {
      await connection.rollback();
      throw txErr;
    }
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (e) {
        // Ignore rollback errors
      }
      connection.release();
    }

    console.error('Error completing encounter:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to complete encounter' },
      { status: 500 }
    );
  }
}
