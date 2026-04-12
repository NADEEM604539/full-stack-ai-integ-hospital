import { NextResponse } from 'next/server';
import {
  updatePatientMedicalHistoryForDoctor,
  deletePatientMedicalHistoryForDoctor
} from '@/services/doctor';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/doctor/patients/[patientId]/medical-history/[historyId]
 * Update patient's medical history (Doctor view)
 * 
 * RBAC:
 * ✓ Doctor can update medical history for their own patients
 * ✗ Other users: Access Denied
 * 
 * Request body:
 * {
 *   condition_type: "Allergy" | "Chronic Condition" | "Previous Surgery" | "Family History",
 *   description: string,
 *   severity: "Mild" | "Moderate" | "Severe" | "Life-Threatening",
 *   status: "Active" | "Resolved" | "Archived"
 * }
 */
export async function PUT(request, { params }) {
  try {
    const { patientId, historyId } = await params;

    if (!patientId || !historyId) {
      return NextResponse.json(
        { success: false, error: 'Patient ID and History ID are required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const updated = await updatePatientMedicalHistoryForDoctor(
      parseInt(patientId),
      parseInt(historyId),
      body
    );

    return NextResponse.json({
      success: true,
      message: 'Medical history updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Update Medical History API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') || error?.message?.includes('access denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update medical history' },
      { status: statusCode }
    );
  }
}

/**
 * DELETE /api/doctor/patients/[patientId]/medical-history/[historyId]
 * Delete patient's medical history (Doctor view)
 * 
 * RBAC:
 * ✓ Doctor can delete medical history for their own patients
 * ✗ Other users: Access Denied
 */
export async function DELETE(request, { params }) {
  try {
    const { patientId, historyId } = await params;

    if (!patientId || !historyId) {
      return NextResponse.json(
        { success: false, error: 'Patient ID and History ID are required' },
        { status: 400 }
      );
    }

    const result = await deletePatientMedicalHistoryForDoctor(
      parseInt(patientId),
      parseInt(historyId)
    );

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Delete Medical History API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') || error?.message?.includes('access denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete medical history' },
      { status: statusCode }
    );
  }
}
