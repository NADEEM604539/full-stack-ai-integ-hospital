import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkDoctorAccess } from '@/services/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/doctor/appointments/[appointmentId]/satisfaction
 * Doctor views satisfaction rating for their appointment
 * 
 * RBAC:
 * ✓ Doctor can only view satisfaction for their own appointments
 * ✗ Other users: Access Denied
 */
export async function GET(request, { params }) {
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
    const { doctorId } = await checkDoctorAccess(connection);

    // Verify appointment belongs to this doctor
    const [appointment] = await connection.query(
      `SELECT a.appointment_id, a.satisfaction_rating, p.first_name, p.last_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       WHERE a.appointment_id = ? AND a.doctor_id = ?`,
      [parseInt(appointmentId), doctorId]
    );

    connection.release();

    if (!appointment.length) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found or does not belong to you' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: appointment[0],
    });
  } catch (error) {
    console.error('Get Appointment Satisfaction API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch satisfaction rating' },
      { status: statusCode }
    );
  }
}
