import { NextResponse } from 'next/server';
import { getDoctorClinicalInsights } from '@/services/doctor';

export const dynamic = 'force-dynamic';

/**
 * GET /api/doctor/insights
 * Get clinical insights for authenticated doctor
 * 
 * RBAC:
 * ✓ Doctor (role_id = 2) can access only their own insights
 * ✗ Other roles: Access Denied
 */
export async function GET(request) {
  try {
    const insights = await getDoctorClinicalInsights();

    return NextResponse.json({
      insights,
    });
  } catch (error) {
    console.error('Doctor Insights API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch insights' },
      { status: statusCode }
    );
  }
}
