import { NextResponse } from 'next/server';
import { deleteAdmin, updateAdmin } from '@/services/admin';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/admin/admins/[id]
 * Update an admin's email and username
 * RBAC: Only admins can update admins
 */
export async function PUT(request, { params }) {
  try {
    const adminId = parseInt(params.id);
    if (isNaN(adminId)) {
      return NextResponse.json(
        { error: 'Invalid admin ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, username } = body;

    if (!email || !username) {
      return NextResponse.json(
        { error: 'Email and username are required' },
        { status: 400 }
      );
    }

    const result = await updateAdmin(adminId, email, username);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Update admin API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      error?.message?.includes('already in use') ? 400 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to update admin' },
      { status: statusCode }
    );
  }
}

/**
 * DELETE /api/admin/admins/[id]
 * Delete an admin user
 * RBAC: Only admins can delete admins
 * Cannot delete self
 */
export async function DELETE(request, { params }) {
  try {
    const adminId = parseInt(params.id);
    if (isNaN(adminId)) {
      return NextResponse.json(
        { error: 'Invalid admin ID' },
        { status: 400 }
      );
    }

    const result = await deleteAdmin(adminId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Delete admin API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('Cannot delete yourself') ? 400 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to delete admin' },
      { status: statusCode }
    );
  }
}
