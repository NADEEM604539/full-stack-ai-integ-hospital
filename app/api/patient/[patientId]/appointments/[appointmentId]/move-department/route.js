import { NextResponse } from 'next/server';
import { movePatientAppointmentDepartment } from '@/services/patient';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/patient/[patientId]/appointments/[appointmentId]/move-department
 * Move patient appointment to their doctor's assigned department
 * 
 * RBAC:
 * ✓ Patient can move only their own appointments
 * ✗ Other users: Access Denied
 */
export async function PUT(request, { params }) {
  try {
    const { patientId, appointmentId } = await params;

    if (!patientId || !appointmentId) {
      return NextResponse.json(
        { error: 'Patient ID and Appointment ID are required' },
        { status: 400 }
      );
    }

    const result = await movePatientAppointmentDepartment(
      parseInt(patientId),
      parseInt(appointmentId)
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Move Appointment Department API Error:', error?.message);

    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to move appointment' },
      { status: statusCode }
    );
  }
}
