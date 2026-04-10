import db from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * GET /api/receptionist/staff
 * Fetch staff members in the same department as the receptionist
 */
export async function GET(request) {
  try {
    const connection = await db.getConnection();

    try {
      // Get current user's staff info (receptionist)
      const [currentStaff] = await connection.query(
        `SELECT s.department_id, s.staff_id
         FROM staff s
         JOIN users u ON s.user_id = u.user_id
         WHERE u.role_id = 4
         LIMIT 1`
      );

      if (!currentStaff.length) {
        return NextResponse.json(
          { error: 'Receptionist not found' },
          { status: 404 }
        );
      }

      const departmentId = currentStaff[0].department_id;
      const currentStaffId = currentStaff[0].staff_id;

      // Get all staff in same department
      const [staff] = await connection.query(
        `SELECT 
          s.staff_id,
          s.first_name,
          s.last_name,
          s.employee_id,
          s.designation,
          s.hire_date,
          s.phone_number,
          s.status,
          u.email
         FROM staff s
         JOIN users u ON s.user_id = u.user_id
         WHERE s.department_id = ? AND s.staff_id != ?
         ORDER BY s.first_name, s.last_name ASC`,
        [departmentId, currentStaffId]
      );

      return NextResponse.json({
        success: true,
        count: staff.length,
        data: staff,
        timestamp: new Date().toISOString()
      }, { status: 200 });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('[STAFF_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff', details: error.message },
      { status: 500 }
    );
  }
}
