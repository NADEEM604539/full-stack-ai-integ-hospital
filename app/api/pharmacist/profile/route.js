import { currentUser } from '@clerk/nextjs/server';
import db from '@/lib/db';
import { checkPharmacistAccess } from '@/services/pharmacist';

/**
 * GET /api/pharmacist/profile
 * Fetch the current pharmacist's profile information
 */
export async function GET(req) {
  let connection;
  try {
    const user = await currentUser();
    if (!user) {
      return Response.json({ message: 'Not authenticated' }, { status: 401 });
    }

    connection = await db.getConnection();

    // Verify pharmacist access and get staff_id
    const { pharmacistId, departmentId } = await checkPharmacistAccess(connection);

    // Fetch pharmacist details from staff table with JOINs
    const [results] = await connection.query(
      `SELECT 
        s.staff_id,
        s.first_name,
        s.last_name,
        u.email,
        s.phone_number,
        s.department_id,
        s.designation,
        s.hire_date,
        s.employee_id,
        s.status,
        s.user_id,
        COALESCE(d.department_name, 'N/A') as department_name
       FROM staff s
       JOIN users u ON s.user_id = u.user_id
       LEFT JOIN departments d ON s.department_id = d.department_id
       WHERE s.staff_id = ?`,
      [pharmacistId]
    );

    if (!results || results.length === 0) {
      return Response.json({ message: 'Pharmacist profile not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: results[0]
    });
  } catch (error) {
    console.error('[Profile GET Error]', error);
    return Response.json(
      { message: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

/**
 * PUT /api/pharmacist/profile
 * Update pharmacist profile (phone number only)
 */
export async function PUT(req) {
  let connection;
  try {
    const user = await currentUser();
    if (!user) {
      return Response.json({ message: 'Not authenticated' }, { status: 401 });
    }

    connection = await db.getConnection();

    // Verify pharmacist access
    const { pharmacistId, departmentId } = await checkPharmacistAccess(connection);

    const body = await req.json();
    const { phone_number } = body;

    // Validate phone number
    if (!phone_number || !phone_number.trim()) {
      return Response.json({ message: 'Phone number is required' }, { status: 400 });
    }

    // Basic phone number validation (10-15 digits, allow +, -, spaces)
    const phoneRegex = /^[\d\s\-\+]{10,15}$/;
    if (!phoneRegex.test(phone_number.replace(/\s/g, ''))) {
      return Response.json(
        { message: 'Invalid phone number format. Please enter 10-15 digits.' },
        { status: 400 }
      );
    }

    // Update phone number only
    await connection.query(
      'UPDATE staff SET phone_number = ? WHERE staff_id = ? AND department_id = ?',
      [phone_number.trim(), pharmacistId, departmentId]
    );

    return Response.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating pharmacist profile:', error);
    return Response.json(
      { message: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
