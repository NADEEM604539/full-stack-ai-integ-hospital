import { NextResponse } from 'next/server';
import { getPatientAge, getDaysSinceLastEncounter, getComprehensivePatientSummary } from '@/services/patient';
import { getUserId } from '@/services/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/patient/[patientId]/summary?action=age|days-since-visit|comprehensive
 * Get patient utility functions
 * 
 * Uses:
 * - fn_calculate_age function
 * - fn_days_since_last_encounter function
 * - Comprehensive view with all functions
 * 
 * RBAC:
 * ✓ Patient can access only their own data
 * ✗ Other users: Access Denied
 */
export async function GET(request, { params }) {
  try {
    const { patientId } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    if (action === 'age') {
      const age = await getPatientAge(parseInt(patientId));
      return NextResponse.json({
        success: true,
        patient_id: patientId,
        age: age
      });
    }

    if (action === 'days-since-visit') {
      const days = await getDaysSinceLastEncounter(parseInt(patientId));
      return NextResponse.json({
        success: true,
        patient_id: patientId,
        days_since_last_encounter: days
      });
    }

    if (action === 'comprehensive') {
      const summary = await getComprehensivePatientSummary(parseInt(patientId));
      return NextResponse.json({
        success: true,
        data: summary
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Valid actions: age, days-since-visit, comprehensive' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Patient Summary API Error:', error?.message);

    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('access denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      400;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch patient data' },
      { status: statusCode }
    );
  }
}
