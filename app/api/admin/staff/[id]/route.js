import { NextResponse } from 'next/server';
import { getStaffById, updateStaff, deleteStaff } from '@/services/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/staff/[id]
 * Get specific staff member
 * RBAC: Only admins can access
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const staff = await getStaffById(id);
    return NextResponse.json({ success: true, data: staff }, { status: 200 });
  } catch (error) {
    console.error('Get staff API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch staff' },
      { status: statusCode }
    );
  }
}

/**
 * PUT /api/admin/staff/[id]
 * Update staff member
 * RBAC: Only admins can access
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const updates = await request.json();
    
    const result = await updateStaff(id, updates);
    return NextResponse.json({ success: true, message: result.message }, { status: 200 });
  } catch (error) {
    console.error('Update staff API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      error?.message?.includes('No valid fields') ? 400 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to update staff member' },
      { status: statusCode }
    );
  }
}

/**
 * DELETE /api/admin/staff/[id]
 * Delete staff member
 * RBAC: Only admins can access
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const result = await deleteStaff(id);
    return NextResponse.json({ success: true, message: result.message }, { status: 200 });
  } catch (error) {
    console.error('Delete staff API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to delete staff member' },
      { status: statusCode }
    );
  }
}
