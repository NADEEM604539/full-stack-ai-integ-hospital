import { NextResponse } from 'next/server';
import { getNurseDashboardStats } from '@/services/nurse';

export const dynamic = 'force-dynamic';

/**
 * GET /api/nurse/dashboard
 * Get nurse dashboard statistics
 * 
 * RBAC:
 * ✓ Nurse can see their own department's data
 * ✗ Other users: Access Denied
 */
export async function GET(request) {
  try {
    const dashboardData = await getNurseDashboardStats();

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('Nurse Dashboard API Error:', error?.message);

    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard data' },
      { status: statusCode }
    );
  }
}
