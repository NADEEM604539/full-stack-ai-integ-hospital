import { NextResponse } from 'next/server';
import {
  getPatientMedicalHistoryForDoctor,
  addPatientMedicalHistoryForDoctor
} from '@/services/doctor';

export const dynamic = 'force-dynamic';

/**
 * GET /api/doctor/patients/[patientId]/medical-history
 * Fetch patient's medical history (Doctor view)
 * 
 * RBAC:
 * ✓ Doctor can access medical history for their own patients
 * ✗ Other users: Access Denied
 */
export async function GET(request, { params }) {
  try {
    const { patientId } = await params;

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    const history = await getPatientMedicalHistoryForDoctor(parseInt(patientId));

    return NextResponse.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error('Get Patient Medical History API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') || error?.message?.includes('access denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch medical history' },
      { status: statusCode }
    );
  }
}

/**
 * POST /api/doctor/patients/[patientId]/medical-history
 * Add medical history for patient (Doctor view)
 * 
 * Request body:
 * {
 *   condition_type: "Allergy" | "Chronic Condition" | "Previous Surgery" | "Family History",
 *   description: string,
 *   severity: "Mild" | "Moderate" | "Severe" | "Life-Threatening" (optional, defaults to "Mild"),
 *   status: "Active" | "Resolved" | "Archived" (optional, defaults to "Active")
 * }
 */
export async function POST(request, { params }) {
  try {
    const { patientId } = await params;

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (!body.condition_type || !body.description) {
      return NextResponse.json(
        { success: false, error: 'condition_type and description are required' },
        { status: 400 }
      );
    }

    const newHistory = await addPatientMedicalHistoryForDoctor(parseInt(patientId), body);

    return NextResponse.json({
      success: true,
      message: 'Medical history added successfully',
      data: newHistory,
    }, { status: 201 });
  } catch (error) {
    console.error('Add Medical History API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') || error?.message?.includes('access denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to add medical history' },
      { status: statusCode }
    );
  }
}
