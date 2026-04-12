import { NextResponse } from 'next/server';
import { getAvailableDoctors } from '@/services/patient';

export const dynamic = 'force-dynamic';

/**
 * GET /api/patient/[patientId]/doctors
 * Get available doctors for patient's department
 * 
 * RBAC:
 * ✓ Patient can only view doctors from their own department
 * ✗ Other users: Access Denied
 */
export async function GET(request, { params }) {
  try {
    const { patientId } = await params;

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    const doctors = await getAvailableDoctors(parseInt(patientId));

    return NextResponse.json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    console.error('Get Doctors API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') || error?.message?.includes('access denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch doctors' },
      { status: statusCode }
    );
  }
}
