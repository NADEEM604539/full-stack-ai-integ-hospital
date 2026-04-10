import { NextResponse } from 'next/server';
import { getDoctorSchedule, updateDoctorSchedule } from '@/services/doctor';

export const dynamic = 'force-dynamic';

/**
 * GET /api/doctor/schedule
 * Get working schedule for authenticated doctor
 */
export async function GET(request) {
  try {
    const schedule = await getDoctorSchedule();

    return NextResponse.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error('Doctor Schedule API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch schedule' },
      { status: statusCode }
    );
  }
}

/**
 * PUT /api/doctor/schedule
 * Update doctor's schedule
 * 
 * Request body:
 * {
 *   schedule: [
 *     {
 *       availability_id: int,
 *       day_of_week: string,
 *       shift_start_time: "HH:MM",
 *       shift_end_time: "HH:MM",
 *       is_working: boolean
 *     }
 *   ]
 * }
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const { schedule } = body;

    if (!schedule || !Array.isArray(schedule)) {
      return NextResponse.json(
        { error: 'Invalid schedule data' },
        { status: 400 }
      );
    }

    const result = await updateDoctorSchedule(schedule);

    return NextResponse.json({
      success: true,
      message: 'Schedule updated successfully',
      data: result,
    });
  } catch (error) {
    console.error('Doctor Schedule Update Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to update schedule' },
      { status: statusCode }
    );
  }
}
