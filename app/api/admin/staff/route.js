import { NextResponse } from 'next/server';
import { getAllStaff, createStaff, getStaffById, recreateStaffWithRoleChange } from '@/services/admin';

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
 * Create new staff member or update with role/department change
 * RBAC: Only admins can access
 * 
 * Body params:
 * - staff_id: If provided and role/department changed, triggers recreation
 * - confirmRoleChange: Boolean to confirm deletion of old record
 */
export async function POST(request) {
  try {
    const { 
      email, 
      first_name, 
      last_name, 
      employee_id, 
      designation, 
      department_id, 
      hire_date, 
      phone_number, 
      role_id,
      staff_id,
      confirmRoleChange
    } = await request.json();

    // If staff_id provided, check if role or department changed
    if (staff_id) {
      try {
        const oldStaff = await getStaffById(staff_id);
        const newRoleId = parseInt(role_id) || 3;
        const newDeptId = parseInt(department_id) || null;
        const oldRoleId = parseInt(oldStaff.role_id);
        const oldDeptId = parseInt(oldStaff.department_id);

        console.log(`Staff edit - ID: ${staff_id}`);
        console.log(`Role: ${oldRoleId} (${oldStaff.role}) → ${newRoleId}`);
        console.log(`Dept: ${oldDeptId} (${oldStaff.department_name}) → ${newDeptId}`);

        const roleChanged = oldRoleId !== newRoleId;
        const deptChanged = oldDeptId !== newDeptId;

        console.log(`Changes detected - Role: ${roleChanged}, Dept: ${deptChanged}`);

        if (roleChanged || deptChanged) {
          // Role or department changed, use recreation function
          if (!confirmRoleChange) {
            // Return warning without confirming
            return NextResponse.json(
              {
                requiresConfirmation: true,
                warning: 'Changing staff role or department will delete the old staff record and create a new one. All related appointments, encounters, and medical records will be orphaned (set to no assigned doctor). Continue?',
                changes: {
                  roleChanged,
                  deptChanged,
                  oldRole: oldStaff.role,
                  newRole: newRoleId === 2 ? 'Doctor' : newRoleId === 3 ? 'Nurse' : newRoleId === 4 ? 'Receptionist' : newRoleId === 5 ? 'Pharmacist' : 'Finance',
                  oldDept: oldStaff.department_name,
                  newDept: department_id
                }
              },
              { status: 202 }
            );
          }

          // User confirmed, proceed with recreation
          const result = await recreateStaffWithRoleChange(
            staff_id,
            email,
            first_name,
            last_name,
            employee_id,
            designation,
            department_id,
            hire_date,
            phone_number,
            role_id,
            true // confirmDeletion
          );

          return NextResponse.json(
            { success: true, message: result.message, data: result },
            { status: 201 }
          );
        }
      } catch (error) {
        if (error?.message?.includes('CONFIRMATION_REQUIRED')) {
          return NextResponse.json(
            { 
              requiresConfirmation: true,
              warning: error.message.replace('CONFIRMATION_REQUIRED::', '')
            },
            { status: 202 }
          );
        }
        throw error;
      }
    }

    // Normal creation (no role/department change)
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
