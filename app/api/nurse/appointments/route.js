import { NextResponse } from 'next/server';
import { getNurseAppointments } from '@/services/nurse';

export const dynamic = 'force-dynamic';

/**
 * GET /api/nurse/appointments
 * Get all appointments for nurse's department
 */
export async function GET(request) {
  try {
    const appointments = await getNurseAppointments();

    return NextResponse.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error('Nurse Appointments API Error:', error?.message);

    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return NextResponse.json(
      { error: error.message || 'Failed to fetch appointments' },
      { status: statusCode }
    );
  }
}
