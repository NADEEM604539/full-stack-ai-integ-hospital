import db from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * GET /api/receptionist/profile
 * Fetch receptionist's profile information
 */
export async function GET(request) {
  try {
    const connection = await db.getConnection();

    try {
      // Get receptionist staff info with department name
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
          s.department_id,
          d.department_name,
          u.email
         FROM staff s
         JOIN users u ON s.user_id = u.user_id
         JOIN departments d ON s.department_id = d.department_id
         WHERE u.role_id = 4
         LIMIT 1`
      );

      if (!staff.length) {
        return NextResponse.json(
          { error: 'Receptionist profile not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        profile: staff[0],
        timestamp: new Date().toISOString()
      }, { status: 200 });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('[PROFILE_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/receptionist/profile
 * Update receptionist's profile (only editable fields like phone number)
 *
 * Request body:
 * {
 *   phone_number: string
 * }
 */
export async function PUT(request) {
  let connection;
  try {
    const body = await request.json();
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

    // Validation
    if (body.phone_number && body.phone_number.trim() === '') {
      return NextResponse.json(
        { error: 'Phone number cannot be empty' },
        { status: 400 }
      );
    }

    connection = await db.getConnection();

    try {
      // Start transaction
      await connection.query('START TRANSACTION');

      // Get current receptionist staff info
      const [currentStaff] = await connection.query(
        `SELECT s.staff_id, s.phone_number
         FROM staff s
         JOIN users u ON s.user_id = u.user_id
         WHERE u.role_id = 4
         LIMIT 1`
      );

      if (!currentStaff.length) {
        await connection.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Receptionist not found' },
          { status: 404 }
        );
      }

      const staffId = currentStaff[0].staff_id;
      const oldPhoneNumber = currentStaff[0].phone_number;

      // Update staff profile
      await connection.query(
        `UPDATE staff 
         SET phone_number = ?,
             updated_at = NOW()
         WHERE staff_id = ?`,
        [body.phone_number, staffId]
      );

      // Audit log
      await connection.query(
        `INSERT INTO audit_logs (user_id, action_type, table_name, record_id, old_data, new_data, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          1, // Default user for now
          'UPDATE',
          'staff',
          staffId,
          JSON.stringify({ phone_number: oldPhoneNumber }),
          JSON.stringify({ phone_number: body.phone_number }),
          clientIp
        ]
      );

      // Commit transaction
      await connection.query('COMMIT');

      // Fetch updated profile
      const [updatedStaff] = await connection.query(
        `SELECT 
          s.staff_id,
          s.first_name,
          s.last_name,
          s.employee_id,
          s.designation,
          s.hire_date,
          s.phone_number,
          s.status,
          s.department_id,
          u.email
         FROM staff s
         JOIN users u ON s.user_id = u.user_id
         WHERE s.staff_id = ?`,
        [staffId]
      );

      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        profile: updatedStaff[0],
        timestamp: new Date().toISOString()
      }, { status: 200 });

    } catch (error) {
      if (connection) {
        try {
          await connection.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('[ROLLBACK_ERROR]', rollbackError);
        }
      }
      throw error;
    }

  } catch (error) {
    console.error('[PROFILE_UPDATE_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to update profile', details: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
