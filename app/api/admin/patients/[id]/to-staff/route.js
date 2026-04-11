import { NextResponse } from 'next/server';
import { patientToStaff } from '@/services/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/patients/[id]/to-staff
 * Convert patient to staff member
 * Changes role from PATIENT (7) to specified role and adds to staff table
 * RBAC: Only admins can perform this action
 * 
 * Body:
 * {
 *   userId: number,
 *   firstName: string,
 *   lastName: string,
 *   departmentId: number,
 *   roleId: number (e.g., 2 for DOCTOR, 3 for NURSE, etc)
 * }
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const patientId = parseInt(id);
    if (isNaN(patientId)) {
      return NextResponse.json(
        { error: 'Invalid patient ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { userId, firstName, lastName, departmentId, roleId } = body;

    if (!userId || !firstName || !lastName || !departmentId || !roleId) {
      return NextResponse.json(
        { error: 'userId, firstName, lastName, departmentId, and roleId are required' },
        { status: 400 }
      );
    }

    const result = await patientToStaff(
      parseInt(userId),
      patientId,
      firstName,
      lastName,
      parseInt(departmentId),
      parseInt(roleId)
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Patient to staff API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      error?.message?.includes('not a patient') ? 400 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to convert patient to staff' },
      { status: statusCode }
    );
  }
}
