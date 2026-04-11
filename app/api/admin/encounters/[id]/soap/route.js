import { NextResponse } from 'next/server';
import { getEncounterSOAP } from '@/services/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/encounters/[id]/soap
 * Retrieve SOAP notes for a specific encounter
 * RBAC: Only admins can access
 */
export async function GET(request, { params }) {
  try {
    // In Next.js 16.2.3, params is async
    const { id } = await params;
    const encounterId = parseInt(id);
    
    if (!encounterId || isNaN(encounterId)) {
      return NextResponse.json(
        { error: 'Invalid encounter ID' },
        { status: 400 }
      );
    }

    const soapNote = await getEncounterSOAP(encounterId);
    
    return NextResponse.json(
      soapNote || {
        encounter_id: encounterId,
        subjective: null,
        objective: null,
        assessment: null,
        plan: null
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get SOAP note API Error:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return NextResponse.json(
      { 
        error: error?.message || 'Failed to fetch SOAP notes',
        details: error?.toString()
      },
      { status: statusCode }
    );
  }
}
