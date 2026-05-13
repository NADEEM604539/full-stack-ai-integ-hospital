import { NextResponse } from 'next/server';
import { getAllUsers, updateUser } from '@/services/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users
 * Get all users
 * RBAC: Only admins can access
 */
export async function GET(request) {
  try {
    const users = await getAllUsers();
    return NextResponse.json({ success: true, data: users }, { status: 200 });
  } catch (error) {
    console.error('Get users API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch users' },
      { status: statusCode }
    );
  }
}

/**
 * POST /api/admin/users
 * Create new user - delegates to staff creation
 * RBAC: Only admins can access
 */
export async function POST(request) {
  try {
    const { email, username, role_id } = await request.json();

    if (!email || !role_id) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    // For now, return error - use /api/admin/staff to create full user+staff
    return NextResponse.json(
      { error: 'Use /api/admin/staff endpoint to create authenticated users' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Create user API Error:', error?.message);
    
    return NextResponse.json(
      { error: error?.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
