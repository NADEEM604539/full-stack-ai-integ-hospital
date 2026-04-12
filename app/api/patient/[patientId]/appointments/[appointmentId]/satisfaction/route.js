import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkPatientAccess } from '@/services/auth';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/patient/[patientId]/appointments/[appointmentId]/satisfaction
 * Patient rates appointment satisfaction (1.0 - 5.0)
 * 
 * RBAC:
 * ✓ Patient can only rate their own appointments
 * ✗ Other users: Access Denied
 */
export async function PUT(request, { params }) {
  let connection;
  try {
    const { patientId, appointmentId } = await params;
    
    if (!patientId || !appointmentId) {
      return NextResponse.json(
        { success: false, error: 'Patient ID and Appointment ID are required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { satisfaction_rating } = body;

    // Validate rating is between 0 and 5
    if (satisfaction_rating !== null && (satisfaction_rating < 0 || satisfaction_rating > 5)) {
      return NextResponse.json(
        { success: false, error: 'Satisfaction rating must be between 0 and 5' },
        { status: 400 }
      );
    }

    // Verify patient access
    const { userId } = await checkPatientAccess();

    connection = await db.getConnection();

    // Verify appointment belongs to this patient
    const [appointmentCheck] = await connection.query(
      `SELECT appointment_id FROM appointments 
       WHERE appointment_id = ? AND patient_id = ?`,
      [parseInt(appointmentId), parseInt(patientId)]
    );

    if (!appointmentCheck.length) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found or does not belong to you' },
        { status: 404 }
      );
    }

    // Update satisfaction rating
    await connection.query(
      `UPDATE appointments 
       SET satisfaction_rating = ? 
       WHERE appointment_id = ?`,
      [satisfaction_rating, parseInt(appointmentId)]
    );

    connection.release();

    return NextResponse.json({
      success: true,
      message: 'Satisfaction rating updated successfully',
      data: { appointment_id: appointmentId, satisfaction_rating },
    });
  } catch (error) {
    console.error('Update Satisfaction API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update satisfaction rating' },
      { status: statusCode }
    );
  } finally {
    if (connection) connection.release();
  }
}

/**
 * GET /api/patient/[patientId]/appointments/[appointmentId]/satisfaction
 * Get satisfaction rating for an appointment
 */
export async function GET(request, { params }) {
  let connection;
  try {
    const { patientId, appointmentId } = await params;
    
    if (!patientId || !appointmentId) {
      return NextResponse.json(
        { success: false, error: 'Patient ID and Appointment ID are required' },
        { status: 400 }
      );
    }

    await checkPatientAccess();
    connection = await db.getConnection();

    const [appointment] = await connection.query(
      `SELECT appointment_id, satisfaction_rating 
       FROM appointments 
       WHERE appointment_id = ? AND patient_id = ?`,
      [parseInt(appointmentId), parseInt(patientId)]
    );

    connection.release();

    if (!appointment.length) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: appointment[0],
    });
  } catch (error) {
    console.error('Get Satisfaction API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch satisfaction rating' },
      { status: statusCode }
    );
  } finally {
    if (connection) connection.release();
  }
}
