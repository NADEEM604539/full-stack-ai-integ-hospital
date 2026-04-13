import { NextResponse } from 'next/server';
import { getAppointmentDetail } from '@/services/nurse';

export const dynamic = 'force-dynamic';

/**
 * GET /api/nurse/appointments/[appointmentId]
 * Get appointment detail with encounters and medicine orders
 */
export async function GET(request, { params }) {
  try {
    const { appointmentId } = await params;

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID required' },
        { status: 400 }
      );
    }

    const appointmentData = await getAppointmentDetail(parseInt(appointmentId));

    return NextResponse.json({
      success: true,
      data: appointmentData,
    });
  } catch (error) {
    console.error('Appointment Detail API Error:', error?.message);

    const statusCode =
      error?.message?.includes('not found') ? 404 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return NextResponse.json(
      { error: error.message || 'Failed to fetch appointment' },
      { status: statusCode }
    );
  }
}
