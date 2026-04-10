import { NextResponse } from 'next/server';
import { getDoctorEncounters } from '@/services/doctor';

export const dynamic = 'force-dynamic';

/**
 * GET /api/doctor/encounters
 * Get encounters for authenticated doctor's patients
 * 
 * RBAC:
 * ✓ Doctor (role_id = 2) can access only encounters for their own patients
 * ✓ Admin (role_id = 1) can access any doctor's encounters
 * ✗ Other roles: Access Denied
 */
export async function GET(request) {
  try {
    const encounters = await getDoctorEncounters();

    return NextResponse.json({
      success: true,
      data: encounters,
    });
  } catch (error) {
    console.error('Doctor Encounters API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch encounters' },
      { status: statusCode }
    );
  }
}
