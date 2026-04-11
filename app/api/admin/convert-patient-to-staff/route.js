import { NextResponse } from 'next/server';
import { convertPatientToStaff } from '@/services/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/convert-patient-to-staff
 * Convert a patient user to staff member
 * Changes role_id from 7 (PATIENT) to specified role (2-6)
 * Adds to staff table with department assignment
 * RBAC: Only admins can convert
 */
export async function POST(request) {
  try {
    const { user_id, email, first_name, last_name, department_id, role_id } = await request.json();
    
    const result = await convertPatientToStaff(
      user_id,
      email,
      first_name,
      last_name,
      department_id,
      role_id
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Convert patient API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      error?.message?.includes('not a patient') ? 400 :
      error?.message?.includes('required') ? 400 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to convert patient' },
      { status: statusCode }
    );
  }
}
