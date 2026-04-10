import { NextResponse } from 'next/server';
import { getDoctorSchedule } from '@/services/doctor';

export const dynamic = 'force-dynamic';

/**
 * GET /api/doctor/schedule
 * Get working schedule for authenticated doctor
 * 
 * RBAC:
 * ✓ Doctor (role_id = 2) can access only their own schedule
 * ✓ Admin (role_id = 1) can access any doctor's schedule
 * ✗ Other roles: Access Denied
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
