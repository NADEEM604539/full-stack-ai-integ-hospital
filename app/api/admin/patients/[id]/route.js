import { NextResponse } from 'next/server';
import { updatePatient, deletePatient } from '@/services/admin';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/admin/patients/[id]
 * Update patient details
 * RBAC: Only admins can update patients
 * 
 * Body: Any patient fields to update
 * {
 *   first_name?: string,
 *   last_name?: string,
 *   phone_number?: string,
 *   email?: string,
 *   address?: string,
 *   city?: string,
 *   emergency_contact?: string,
 *   emergency_phone?: string,
 *   department_id?: number,
 *   is_active?: boolean
 * }
 */
export async function PUT(request, { params }) {
  try {
    const patientId = parseInt(params.id);
    if (isNaN(patientId)) {
      return NextResponse.json(
        { error: 'Invalid patient ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const result = await updatePatient(patientId, body);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Update patient API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      error?.message?.includes('No valid fields') ? 400 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to update patient' },
      { status: statusCode }
    );
  }
}

/**
 * DELETE /api/admin/patients/[id]
 * Soft delete patient (marks as deleted)
 * RBAC: Only admins can delete patients
 */
export async function DELETE(request, { params }) {
  try {
    const patientId = parseInt(params.id);
    if (isNaN(patientId)) {
      return NextResponse.json(
        { error: 'Invalid patient ID' },
        { status: 400 }
      );
    }

    const result = await deletePatient(patientId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Delete patient API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to delete patient' },
      { status: statusCode }
    );
  }
}
