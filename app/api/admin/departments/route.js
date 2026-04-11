import { NextResponse } from 'next/server';
import { getAllDepartments, createDepartment } from '@/services/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/departments
 * Get all departments
 * RBAC: Only admins can access
 */
export async function GET(request) {
  try {
    const departments = await getAllDepartments();
    return NextResponse.json({ success: true, data: departments }, { status: 200 });
  } catch (error) {
    console.error('Get departments API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch departments' },
      { status: statusCode }
    );
  }
}

/**
 * POST /api/admin/departments
 * Create new department
 * RBAC: Only admins can access
 */
export async function POST(request) {
  try {
    const { department_name, description, head_id } = await request.json();

    const department = await createDepartment(department_name, description, head_id);
    return NextResponse.json(
      { success: true, message: 'Department created successfully', data: department },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create department API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('required') ? 400 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to create department' },
      { status: statusCode }
    );
  }
}
