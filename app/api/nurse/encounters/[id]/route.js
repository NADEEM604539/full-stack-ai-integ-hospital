import { NextResponse } from 'next/server';
import { getEncounterDetail, getEncounterVitals, getEncounterSOAP } from '@/services/nurse';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const encounterId = id;

    if (!encounterId) {
      return NextResponse.json(
        { error: 'Encounter ID is required' },
        { status: 400 }
      );
    }

    const encounter = await getEncounterDetail(parseInt(encounterId));
    const soapNotes = await getEncounterSOAP(parseInt(encounterId));
    const vitals = await getEncounterVitals(parseInt(encounterId));

    return NextResponse.json({
      success: true,
      data: {
        encounter,
        soapNotes,
        vitals,
      },
    });
  } catch (error) {
    console.error('Error fetching encounter details:', error?.message);

    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch encounter details' },
      { status: statusCode }
    );
  }
}
