import { NextResponse } from 'next/server';
import { getAdminProfile, updateAdminProfile } from '@/services/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/profile
 * Retrieve current admin's profile
 * RBAC: Only logged-in admins can access their own profile
 */
export async function GET() {
  try {
    const profile = await getAdminProfile();
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Get profile API Error:', error?.message);
    
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
 * PUT /api/admin/profile
 * Update current admin's email and username
 * RBAC: Only logged-in admins can update their own profile
 */
export async function PUT(request) {
  try {
    const { email, username } = await request.json();
    
    const result = await updateAdminProfile(email, username);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Update profile API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('required') ? 400 :
      error?.message?.includes('already in use') ? 400 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to update profile' },
      { status: statusCode }
    );
  }
}
