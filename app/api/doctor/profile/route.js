import { NextResponse } from 'next/server';
import { getDoctorProfile, updateDoctorPhone } from '@/services/doctor';

export const dynamic = 'force-dynamic';

/**
 * GET /api/doctor/profile
 * Get profile for authenticated doctor
 * 
 * RBAC:
 * ✓ Doctor (role_id = 2) can access only their own profile
 * ✓ Admin (role_id = 1) can access any doctor's profile
 * ✗ Other roles: Access Denied
 */
export async function GET(request) {
  try {
    const profile = await getDoctorProfile();

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('Doctor Profile GET API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch profile' },
      { status: statusCode }
    );
  }
}

/**
 * PUT /api/doctor/profile
 * Update authenticated doctor's profile (phone_number only)
 * 
 * RBAC:
 * ✓ Doctor (role_id = 2) can update only their own phone_number
 * ✓ Admin (role_id = 1) can update any doctor's phone_number
 * ✗ Other roles: Access Denied
 * 
 * Editable Fields: phone_number only
 * Read-only Fields: name, specialization, consultation_fee, license, status
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const { phone_number } = body;

    if (!phone_number) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    await updateDoctorPhone(phone_number);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Doctor Profile PUT API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to update profile' },
      { status: statusCode }
    );
  }
}
