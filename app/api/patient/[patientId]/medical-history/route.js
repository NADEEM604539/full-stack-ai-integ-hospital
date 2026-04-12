import { NextResponse } from 'next/server';
import {
  getPatientMedicalHistory,
  addPatientMedicalHistory
} from '@/services/patient';

export const dynamic = 'force-dynamic';

/**
 * GET /api/patient/[patientId]/medical-history
 * Fetch medical history for a patient
 * 
 * RBAC:
 * ✓ Patient can access their own medical history
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

    const history = await getPatientMedicalHistory(parseInt(patientId));

    return NextResponse.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error('Get Medical History API Error:', error?.message);
    
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
 * POST /api/patient/[patientId]/medical-history
 * Add new medical history record
 * 
 * Request body:
 * {
 *   condition_type: "Allergy" | "Chronic Condition" | "Previous Surgery" | "Family History",
 *   description: string,
 *   severity: "Mild" | "Moderate" | "Severe" | "Life-Threatening" (optional, defaults to "Mild")
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

    const newHistory = await addPatientMedicalHistory(parseInt(patientId), body);

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

