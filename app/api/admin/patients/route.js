import { NextResponse } from 'next/server';
import { getAllPatients } from '@/services/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/patients
 * Retrieve all patients with full details
 * RBAC: Only admins can access
 */
export async function GET() {
  try {
    const patients = await getAllPatients();
    return NextResponse.json({ data: patients });
  } catch (error) {
    console.error('Get patients API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch patients' },
      { status: statusCode }
    );
  }
}
