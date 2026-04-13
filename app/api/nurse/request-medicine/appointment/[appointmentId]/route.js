import { NextResponse } from 'next/server';
import { requestMedicines, getAppointmentDetail } from '@/services/nurse';

export const dynamic = 'force-dynamic';

/**
 * GET /api/nurse/request-medicine/appointment/[appointmentId]
 * Get appointment details for medicine request form
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

/**
 * POST /api/nurse/request-medicine/appointment/[appointmentId]
 * Create medicine request for an appointment
 */
export async function POST(request, { params }) {
  try {
    const { appointmentId } = await params;
    const { encounterId, medicines } = await request.json();

    if (!appointmentId || !encounterId || !medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return NextResponse.json(
        { error: 'Appointment ID, encounter ID, and medicines array required' },
        { status: 400 }
      );
    }

    const result = await requestMedicines(parseInt(encounterId), parseInt(appointmentId), medicines);

    return NextResponse.json({
      success: true,
      message: 'Medicine request created successfully',
      data: result,
    });
  } catch (error) {
    console.error('Medicine Request API Error:', error?.message);

    const statusCode =
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error.message || 'Failed to create medicine request' },
      { status: statusCode }
    );
  }
}
