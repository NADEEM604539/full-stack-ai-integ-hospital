import { NextResponse } from 'next/server';
import { recordEncounterVitals } from '@/services/nurse';

export const dynamic = 'force-dynamic';

/**
 * POST /api/nurse/encounters/[id]/vitals
 * Record or update vital signs for an encounter
 * One encounter = one vital (creates or updates)
 */
export async function POST(request, { params }) {
  try {
    const { id: encounterId } = await params;
    const {
      temperature_c,
      blood_pressure_systolic,
      blood_pressure_diastolic,
      heart_rate,
      oxygen_saturation,
      weight_kg,
      height_cm,
      ai_risk_score = 0,
      ai_risk_category = null,
    } = await request.json();

    if (!encounterId) {
      return NextResponse.json(
        { error: 'Encounter ID is required' },
        { status: 400 }
      );
    }

    const vital = await recordEncounterVitals(
      parseInt(encounterId),
      temperature_c,
      blood_pressure_systolic,
      blood_pressure_diastolic,
      heart_rate,
      oxygen_saturation,
      weight_kg,
      height_cm,
      ai_risk_score,
      ai_risk_category
    );

    return NextResponse.json({
      success: true,
      message: 'Vital signs recorded successfully',
      data: vital,
    });
  } catch (error) {
    console.error('Error recording vitals:', error?.message);

    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to record vital signs' },
      { status: statusCode }
    );
  }
}
