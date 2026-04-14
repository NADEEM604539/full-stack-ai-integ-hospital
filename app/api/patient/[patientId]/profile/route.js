import { NextResponse } from 'next/server';
import { getPatientProfile, updatePatientProfile } from '@/services/patient';

export const dynamic = 'force-dynamic';

/**
 * GET /api/patient/[patientId]/profile
 * Fetch patient profile details
 * 
 * RBAC:
 * ✓ User can access only their own patients
 * ✗ Other users: Access Denied
 * 
 * Features:
 * ✓ User isolation (deep access control verification)
 * ✓ Full patient details
 * ✓ Parameterized queries
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

    const patient = await getPatientProfile(parseInt(patientId));

    return NextResponse.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error(`Get Patient Profile API Error [${params.patientId}]:`, {
      message: error?.message,
      stack: error?.stack?.split('\n').slice(0, 3).join('\n'),
    });
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch patient profile' },
      { status: statusCode }
    );
  }
}

/**
 * PUT /api/patient/[patientId]/profile
 * Update patient profile
 * 
 * RBAC:
 * ✓ User can update only their own patients
 * ✗ Other users: Access Denied
 * 
 * Request Body (optional fields):
 * {
 *   firstName, lastName, phone, email, address, city, state, 
 *   postalCode, country, bloodType, emergencyContactName,
 *   emergencyContactPhone, medicalHistory, allergies, currentMedications
 * }
 * 
 * Features:
 * ✓ Selective field updates
 * ✓ User isolation verification
 * ✓ Automatic timestamp update
 */
export async function PUT(request, { params }) {
  try {
    const { patientId } = await params;

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const result = await updatePatientProfile(parseInt(patientId), body);

    return NextResponse.json({
      success: true,
      message: 'Patient profile updated successfully',
      data: result,
    });
  } catch (error) {
    console.error('Update Patient Profile API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      error?.message?.includes('No valid fields') ? 400 :
      500;

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update patient profile' },
      { status: statusCode }
    );
  }
}
