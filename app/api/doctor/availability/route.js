import { NextResponse } from 'next/server';
import { getDoctorAppointmentCountForDate, checkDoctorAvailability } from '@/services/doctor';
import { getUserId } from '@/services/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/doctor/availability?action=count|check&doctor_id=1&date=2026-05-06&time=10:00
 * Get doctor utility functions
 * 
 * Uses:
 * - fn_doctor_appointment_count function
 * - fn_is_doctor_available function
 * 
 * Query params:
 * - action: "count" or "check"
 * - doctor_id: Doctor ID (required)
 * - date: YYYY-MM-DD format (required for both)
 * - time: HH:MM format (required only for "check" action)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const doctorId = searchParams.get('doctor_id');
    const date = searchParams.get('date');
    const time = searchParams.get('time');

    if (!doctorId) {
      return NextResponse.json(
        { error: 'doctor_id is required' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: 'date is required (YYYY-MM-DD format)' },
        { status: 400 }
      );
    }

    if (action === 'count') {
      const count = await getDoctorAppointmentCountForDate(parseInt(doctorId), date);
      return NextResponse.json({
        success: true,
        doctor_id: doctorId,
        date: date,
        appointment_count: count
      });
    }

    if (action === 'check') {
      if (!time) {
        return NextResponse.json(
          { error: 'time is required for availability check (HH:MM format)' },
          { status: 400 }
        );
      }

      const isAvailable = await checkDoctorAvailability(parseInt(doctorId), date, time);
      return NextResponse.json({
        success: true,
        doctor_id: doctorId,
        date: date,
        time: time,
        is_available: isAvailable
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Valid actions: count, check' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Doctor Availability API Error:', error?.message);

    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('access denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      400;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch doctor availability' },
      { status: statusCode }
    );
  }
}
