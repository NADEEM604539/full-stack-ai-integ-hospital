import { NextResponse } from 'next/server';
import { getDoctorColleagues } from '@/services/doctor';

export const dynamic = 'force-dynamic';

/**
 * GET /api/doctor/colleagues
 * Get colleagues (other doctors in same department) for authenticated doctor
 * 
 * RBAC:
 * ✓ Doctor (role_id = 2) can access colleagues in their own department only
 * ✓ Admin (role_id = 1) can access any doctor's colleagues
 * ✗ Other roles: Access Denied
 * 
 * Department-based Access:
 * - Doctors can ONLY view colleagues in their assigned department
 * - Cannot view doctors from other departments
 */
export async function GET(request) {
  try {
    const colleagues = await getDoctorColleagues();

    return NextResponse.json({
      success: true,
      data: colleagues,
    });
  } catch (error) {
    console.error('Doctor Colleagues API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch colleagues' },
      { status: statusCode }
    );
  }
}
