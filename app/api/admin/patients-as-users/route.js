import { NextResponse } from 'next/server';
import { getPatientsAsUsers } from '@/services/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/patients-as-users
 * Get all patients who are not yet staff (role_id = 7)
 * For conversion to staff
 * RBAC: Only admins can access
 */
export async function GET() {
  try {
    const patients = await getPatientsAsUsers();
    return NextResponse.json({ data: patients });
  } catch (error) {
    console.error('Get patients as users API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch patients' },
      { status: statusCode }
    );
  }
}
