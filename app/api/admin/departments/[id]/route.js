import { NextResponse } from 'next/server';
import { getDepartmentById, updateDepartment, deleteDepartment } from '@/services/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/departments/[id]
 * Get specific department
 * RBAC: Only admins can access
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const department = await getDepartmentById(id);
    return NextResponse.json({ success: true, data: department }, { status: 200 });
  } catch (error) {
    console.error('Get department API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch department' },
      { status: statusCode }
    );
  }
}

/**
 * PUT /api/admin/departments/[id]
 * Update department
 * RBAC: Only admins can access
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const updates = await request.json();
    
    const result = await updateDepartment(id, updates);
    return NextResponse.json({ success: true, message: result.message }, { status: 200 });
  } catch (error) {
    console.error('Update department API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      error?.message?.includes('No valid fields') ? 400 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to update department' },
      { status: statusCode }
    );
  }
}

/**
 * DELETE /api/admin/departments/[id]
 * Delete department
 * RBAC: Only admins can access
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const result = await deleteDepartment(id);
    return NextResponse.json({ success: true, message: result.message }, { status: 200 });
  } catch (error) {
    console.error('Delete department API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      error?.message?.includes('Cannot delete department') ? 400 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to delete department' },
      { status: statusCode }
    );
  }
}
