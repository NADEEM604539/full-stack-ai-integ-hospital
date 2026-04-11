import { NextResponse } from 'next/server';
import { getAllEncounters } from '@/services/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/encounters
 * Retrieve all encounters with patient and doctor info
 * RBAC: Only admins can access
 */
export async function GET() {
  try {
    const encounters = await getAllEncounters();
    return NextResponse.json({ data: encounters });
  } catch (error) {
    console.error('Get encounters API Error:', error?.message);
    
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
