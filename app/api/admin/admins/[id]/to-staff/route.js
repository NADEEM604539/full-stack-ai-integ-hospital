import { NextResponse } from 'next/server';
import { adminToStaff } from '@/services/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/admins/[id]/to-staff
 * Convert admin user to staff with department assignment
 * RBAC: Only admins can perform this action
 * 
 * Body:
 * {
 *   firstName: string,
 *   lastName: string,
 *   departmentId: number,
 *   roleId: number (e.g., 2 for DOCTOR, 3 for NURSE, etc)
 * }
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const adminId = parseInt(id);
    if (isNaN(adminId)) {
      return NextResponse.json(
        { error: 'Invalid admin ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, departmentId, roleId } = body;

    if (!firstName || !lastName || !departmentId || !roleId) {
      return NextResponse.json(
        { error: 'firstName, lastName, departmentId, and roleId are required' },
        { status: 400 }
      );
    }

    const result = await adminToStaff(adminId, firstName, lastName, parseInt(departmentId), parseInt(roleId));
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Admin to staff API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      error?.message?.includes('not an admin') ? 400 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to convert admin to staff' },
      { status: statusCode }
    );
  }
}
