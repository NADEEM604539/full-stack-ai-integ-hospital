import { NextResponse } from 'next/server';
import { checkPatientAccess } from '@/services/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/patient/dashboard/stats
 * Fetch dashboard statistics for the authenticated patient
 * 
 * Returns:
 * - totalPatients: Number of patient profiles managed by user
 * - totalAppointments: Total appointments across all patients
 * - upcomingAppointments: Appointments with future dates
 * - totalEncounters: Total encounters/visits
 * - profileCompletion: Percentage of profile fields filled
 */
export async function GET(request) {
  let connection;
  try {
    const { userId } = await checkPatientAccess();
    connection = await db.getConnection();

    // Get total patients managed by user
    const [patientCounts] = await connection.query(
      `SELECT COUNT(*) as count FROM patients 
       WHERE user_id = ? AND is_deleted = FALSE`,
      [userId]
    );
    const totalPatients = patientCounts[0]?.count || 0;

    // Get all patient IDs for this user
    const [patients] = await connection.query(
      `SELECT patient_id FROM patients 
       WHERE user_id = ? AND is_deleted = FALSE`,
      [userId]
    );
    const patientIds = patients.map(p => p.patient_id);

    let totalAppointments = 0;
    let upcomingAppointments = 0;
    let totalEncounters = 0;

    if (patientIds.length > 0) {
      // Get total appointments for all patient's patients
      const placeholders = patientIds.map(() => '?').join(',');
      const [appointmentCounts] = await connection.query(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN appointment_date >= CURDATE() THEN 1 ELSE 0 END) as upcoming
         FROM appointments
         WHERE patient_id IN (${placeholders})`,
        patientIds
      );
      totalAppointments = appointmentCounts[0]?.total || 0;
      upcomingAppointments = appointmentCounts[0]?.upcoming || 0;

      // Get total encounters
      const [encounterCounts] = await connection.query(
        `SELECT COUNT(*) as count FROM encounters
         WHERE patient_id IN (${placeholders})`,
        patientIds
      );
      totalEncounters = encounterCounts[0]?.count || 0;
    }

    // Calculate profile completion for first patient (or overall)
    let profileCompletion = 0;
    if (patientIds.length > 0) {
      const [profileData] = await connection.query(
        `SELECT 
          patient_id,
          first_name,
          last_name,
          date_of_birth,
          gender,
          blood_type,
          phone_number,
          email,
          address,
          emergency_contact,
          department_id
         FROM patients
         WHERE patient_id = ? AND user_id = ? AND is_deleted = FALSE`,
        [patientIds[0], userId]
      );

      if (profileData.length > 0) {
        const patient = profileData[0];
        const fields = [
          'first_name', 'last_name', 'date_of_birth', 'gender',
          'blood_type', 'phone_number', 'email', 'address',
          'emergency_contact', 'department_id'
        ];
        const filledFields = fields.filter(field => patient[field] != null && patient[field] !== '').length;
        profileCompletion = Math.round((filledFields / fields.length) * 100);
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalPatients,
        totalAppointments,
        upcomingAppointments,
        totalEncounters,
        profileCompletion
      }
    });
  } catch (error) {
    console.error('Patient Dashboard Stats Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch dashboard stats' },
      { status: statusCode }
    );
  } finally {
    if (connection) connection.release();
  }
}
