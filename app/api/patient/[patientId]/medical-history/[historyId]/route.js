import { NextResponse } from 'next/server';
import {
  updatePatientMedicalHistory,
  deletePatientMedicalHistory
} from '@/services/patient';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/patient/[patientId]/medical-history/[historyId]
 * Update a specific medical history record
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

    const updated = await updatePatientMedicalHistory(
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
 * DELETE /api/patient/[patientId]/medical-history/[historyId]
 * Delete a specific medical history record
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

    const result = await deletePatientMedicalHistory(
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
