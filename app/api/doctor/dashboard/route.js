import { NextResponse } from 'next/server';
import { getDoctorDashboardStats } from '@/services/doctor';

export const dynamic = 'force-dynamic';

/**
 * GET /api/doctor/dashboard
 * Get dashboard statistics for authenticated doctor
 * 
 * RBAC:
 * ✓ Doctor (role_id = 2) can access only their own dashboard
 * ✓ Admin (role_id = 1) can access any doctor's dashboard
 * ✗ Other roles: Access Denied
 */
export async function GET(request) {
  try {
    // getDoctorDashboardStats gets authenticated user's doctor_id via RBAC
    const stats = await getDoctorDashboardStats();
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Dashboard API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch dashboard stats' },
      { status: statusCode }
    );
  }
}
