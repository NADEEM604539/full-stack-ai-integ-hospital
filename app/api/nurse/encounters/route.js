import { NextResponse } from 'next/server';
import { getNurseEncounters, createEncounter } from '@/services/nurse';

export const dynamic = 'force-dynamic';

/**
 * GET /api/nurse/encounters
 * Get all encounters for nurse's department
 * 
 * RBAC:
 * ✓ Nurse can see encounters from their department only
 * ✗ Other departments: Access Denied
 */
export async function GET(request) {
  try {
    const encounters = await getNurseEncounters();

    return NextResponse.json({
      success: true,
      data: encounters,
    });
  } catch (error) {
    console.error('Nurse Encounters API Error:', error?.message);

    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch encounters' },
      { status: statusCode }
    );
  }
}

/**
 * POST /api/nurse/encounters
 * Start a new encounter for a patient
 * 
 * Request body:
 * {
 *   patient_id: number,
 *   encounter_type: 'Outpatient' | 'Inpatient' | 'Emergency',
 *   chief_complaint: string (optional)
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { patient_id, encounter_type, chief_complaint } = body;

    // Validate required fields
    if (!patient_id || !encounter_type) {
      return NextResponse.json(
        { error: 'patient_id and encounter_type are required' },
        { status: 400 }
      );
    }

    const encounterId = await createEncounter(patient_id, encounter_type, chief_complaint);

    return NextResponse.json({
      success: true,
      message: 'Encounter started successfully',
      data: { encounter_id: encounterId },
    }, { status: 201 });

  } catch (error) {
    console.error('Start Encounter API Error:', error?.message);

    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to start encounter' },
      { status: statusCode }
    );
  }
}
