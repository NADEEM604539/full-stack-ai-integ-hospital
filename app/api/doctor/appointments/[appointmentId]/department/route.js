import { NextResponse } from 'next/server';
import { updateAppointmentDepartment } from '@/services/doctor';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/doctor/appointments/[appointmentId]/department
 * Update appointment department to match doctor's department
 */
export async function PUT(request, { params }) {
  try {
    const { appointmentId } = await params;

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID required' },
        { status: 400 }
      );
    }

    const result = await updateAppointmentDepartment(parseInt(appointmentId));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Update Appointment Department API Error:', error?.message);

    const statusCode =
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error.message || 'Failed to update appointment department' },
      { status: statusCode }
    );
  }
}
