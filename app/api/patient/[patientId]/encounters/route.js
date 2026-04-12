import { NextResponse } from 'next/server';
import { getPatientEncounters } from '@/services/patient';

export const dynamic = 'force-dynamic';

/**
 * GET /api/patient/[patientId]/encounters
 * Fetch all encounters (visits) for a patient
 * 
 * RBAC:
 * ✓ User can access encounters only for their owned patients
 * ✗ Other users: Access Denied
 * 
 * Features:
 * ✓ User isolation (deep access control verification)
 * ✓ Complete clinical details (diagnosis, vitals, treatment plan)
 * ✓ Doctor information included
 * ✓ Sorted by date (newest first)
 * ✓ Parameterized queries
 * ✓ HIPAA-compliant access control
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

    const encounters = await getPatientEncounters(parseInt(patientId));

    return NextResponse.json({
      success: true,
      count: encounters.length,
      data: encounters,
    });
  } catch (error) {
    console.error('Patient Encounters API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch encounters' },
      { status: statusCode }
    );
  }
}
