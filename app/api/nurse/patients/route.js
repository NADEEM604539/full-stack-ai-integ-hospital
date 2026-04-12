import { NextResponse } from 'next/server';
import { getNursePatients } from '@/services/nurse';

export const dynamic = 'force-dynamic';

/**
 * GET /api/nurse/patients
 * Get all patients assigned to nurse's department
 * 
 * RBAC:
 * ✓ Nurse can see patients from their department only
 * ✗ Other departments: Access Denied
 */
export async function GET(request) {
  try {
    const patients = await getNursePatients();

    return NextResponse.json({
      success: true,
      data: patients,
    });
  } catch (error) {
    console.error('Nurse Patients API Error:', error?.message);

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
