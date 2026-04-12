import { NextResponse } from 'next/server';
import { getEncounterSOAP } from '@/services/patient';

export const dynamic = 'force-dynamic';

/**
 * GET /api/patient/[patientId]/encounters/[encounterId]
 * Fetch complete SOAP note for an encounter
 * 
 * RBAC:
 * ✓ User can access SOAP only for their own patient's encounters
 * ✗ Other users: Access Denied
 * 
 * Returns:
 * {
 *   encounter: { encounter details },
 *   subjective: { S component or null },
 *   objective: { O component or null },
 *   assessment: { A component or null },
 *   plan: { P component or null },
 *   soapComplete: boolean
 * }
 * 
 * Features:
 * ✓ User isolation verification
 * ✓ Full SOAP documentation
 * ✓ Status indicator for missing components
 * ✓ HIPAA-compliant access control
 */
export async function GET(request, { params }) {
  try {
    const { patientId, encounterId } = await params;

    if (!patientId || !encounterId) {
      return NextResponse.json(
        { success: false, error: 'Patient ID and Encounter ID are required' },
        { status: 400 }
      );
    }

    const soapData = await getEncounterSOAP(parseInt(patientId), parseInt(encounterId));

    return NextResponse.json({
      success: true,
      data: soapData,
    });
  } catch (error) {
    console.error('Get Encounter SOAP API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch SOAP details' },
      { status: statusCode }
    );
  }
}
