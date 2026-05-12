import { NextResponse } from 'next/server';
import { updateUser } from '@/services/admin';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/admin/users/[id]
 * Update user role and status
 * RBAC: Only admins can access
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const updates = await request.json();
    
    const result = await updateUser(id, updates);
    return NextResponse.json({ success: true, message: result.message }, { status: 200 });
  } catch (error) {
    console.error('Update user API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      error?.message?.includes('No valid fields') ? 400 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to update user' },
      { status: statusCode }
    );
  }
}
