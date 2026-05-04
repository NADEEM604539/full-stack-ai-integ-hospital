import { NextResponse } from 'next/server';
import { getFinanceProfile, updateFinancePhone } from '@/services/finance';

export const dynamic = 'force-dynamic';

/**
 * GET /api/finance/profile
 * Get profile for authenticated finance staff
 * 
 * RBAC:
 * ✓ Finance (role_id = 6) can access only their own profile
 * ✓ Admin (role_id = 1) can access any finance staff's profile
 * ✗ Other roles: Access Denied
 */
export async function GET(request) {
  try {
    const profile = await getFinanceProfile();

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('Finance Profile GET API Error:', error?.message);
    
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
 * PUT /api/finance/profile
 * Update authenticated finance staff's profile (phone_number only)
 * 
 * RBAC:
 * ✓ Finance (role_id = 6) can update only their own phone_number
 * ✓ Admin (role_id = 1) can update any finance staff's phone_number
 * ✗ Other roles: Access Denied
 * 
 * Editable Fields: phone_number only
 * Read-only Fields: name, designation, hire_date, employee_id, status
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

    await updateFinancePhone(phone_number);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Finance Profile PUT API Error:', error?.message);
    
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
