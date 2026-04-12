import { NextResponse } from 'next/server';
import { registerPatient } from '@/services/patient';

export const dynamic = 'force-dynamic';

/**
 * POST /api/patient/register
 * Register a new patient (self or family member)
 * 
 * RBAC:
 * ✓ Patient (role_id = 7) can register new patients
 * ✗ Other roles: Access Denied
 * 
 * Request Body:
 * {
 *   firstName (required),
 *   lastName (required),
 *   dateOfBirth (required),
 *   gender (required),
 *   email (required, NOT unique - multiple patients can share),
 *   phoneNumber (required, NOT unique - multiple patients can share),
 *   mrn, bloodType, address, city, state, postalCode, country,
 *   emergencyContactName, emergencyContactPhone,
 *   medicalHistory, allergies, currentMedications, departmentId
 * }
 * 
 * Features:
 * ✓ Allows multiple patients with same email/phone (family members, shared contacts)
 * ✓ Input validation
 * ✓ Automatic user_id assignment
 * ✓ MRN auto-generation if not provided
 */
export async function POST(request) {
  try {
    const body = await request.json();

    const patient = await registerPatient(body);

    return NextResponse.json(
      {
        success: true,
        message: 'Patient registered successfully',
        data: patient,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register Patient API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('Missing required') ? 400 :
      error?.message?.includes('already exists') ? 409 :
      500;

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to register patient' },
      { status: statusCode }
    );
  }
}
