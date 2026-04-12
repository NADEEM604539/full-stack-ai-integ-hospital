import { NextResponse } from 'next/server';
import { getPatientVitals } from '@/services/patient';

export const dynamic = 'force-dynamic';

/**
 * GET /api/patient/[patientId]/vitals
 * Fetch vital signs for a patient
 * 
 * RBAC:
 * ✓ User can access vitals only for their owned patients
 * ✗ Other users: Access Denied
 * 
 * Returns vital signs data including:
 * - Blood pressure
 * - Heart rate
 * - Body temperature
 * - Respiratory rate
 * - Oxygen saturation
 * 
 * Features:
 * ✓ User isolation (deep access control verification)
 * ✓ Latest vitals first
 * ✓ Historical vitals data
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

    // Fetch vitals using service function (includes RBAC verification)
    const vitals = await getPatientVitals(parseInt(patientId));

    return NextResponse.json({
      success: true,
      count: vitals.length,
      data: vitals,
    });
  } catch (error) {
    console.error('Get Patient Vitals API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('access denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch vitals' },
      { status: statusCode }
    );
  }
}
