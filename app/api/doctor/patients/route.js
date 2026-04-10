import { NextResponse } from 'next/server';
import { getDoctorPatients } from '@/services/doctor';

export const dynamic = 'force-dynamic';

/**
 * GET /api/doctor/patients
 * Get list of patients for authenticated doctor
 * 
 * RBAC:
 * ✓ Doctor (role_id = 2) can access only their own patients (from appointments history)
 * ✓ Admin (role_id = 1) can access any doctor's patients
 * ✗ Other roles: Access Denied
 */
export async function GET(request) {
  try {
    const patients = await getDoctorPatients();

    return NextResponse.json({
      success: true,
      data: patients,
    });
  } catch (error) {
    console.error('Doctor Patients API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch patients' },
      { status: statusCode }
    );
  }
}
