import { NextResponse } from 'next/server';
import { getAllStaff, createStaff } from '@/services/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/staff
 * Get all staff members
 * RBAC: Only admins can access
 */
export async function GET(request) {
  try {
    const staff = await getAllStaff();
    return NextResponse.json({ success: true, data: staff }, { status: 200 });
  } catch (error) {
    console.error('Get staff API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch staff' },
      { status: statusCode }
    );
  }
}

/**
 * POST /api/admin/staff
 * Create new staff member
 * RBAC: Only admins can access
 */
export async function POST(request) {
  try {
    const { email, first_name, last_name, employee_id, designation, department_id, hire_date, phone_number, role_id } = await request.json();

    const staff = await createStaff(
      email,
      first_name,
      last_name,
      employee_id,
      designation,
      department_id,
      hire_date,
      phone_number,
      role_id
    );
    
    return NextResponse.json(
      { success: true, message: 'Staff member created successfully', data: staff },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create staff API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('Missing required') || error?.message?.includes('required') ? 400 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to create staff member' },
      { status: statusCode }
    );
  }
}
