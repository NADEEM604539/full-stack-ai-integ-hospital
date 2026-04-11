import { NextResponse } from 'next/server';
import { getAllAdmins, createAdmin } from '@/services/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/admins
 * Get all admin users (role_id = 1)
 * RBAC: Only admins can access
 */
export async function GET() {
  try {
    const admins = await getAllAdmins();
    return NextResponse.json({ data: admins });
  } catch (error) {
    console.error('Get admins API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch admins' },
      { status: statusCode }
    );
  }
}

/**
 * POST /api/admin/admins
 * Create new admin user
 * RBAC: Only admins can create admins
 */
export async function POST(request) {
  try {
    const { email, username } = await request.json();
    
    const result = await createAdmin(email, username);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Create admin API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('already exists') ? 400 :
      error?.message?.includes('required') ? 400 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to create admin' },
      { status: statusCode }
    );
  }
}
