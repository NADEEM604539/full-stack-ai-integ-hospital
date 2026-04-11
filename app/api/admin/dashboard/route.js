import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/services/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics
 * RBAC: Only admins can access
 */
export async function GET(request) {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json({ success: true, stats }, { status: 200 });
  } catch (error) {
    console.error('Dashboard API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch dashboard stats' },
      { status: statusCode }
    );
  }
}
