import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserId } from '@/services/auth';

/**
 * GET /api/finance/patients
 * Get all patients with their invoice counts
 * RBAC: Finance can only see patients from their department
 */
export async function GET(req) {
  let connection;
  try {
    connection = await db.getConnection();

    // Get current user ID and role
    let userId;
    try {
      userId = await getUserId();
    } catch (authError) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Get user role
    const [userRows] = await connection.query(
      `SELECT role_id FROM users WHERE user_id = ?`,
      [userId]
    );

    if (!userRows.length) {
      connection.release();
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const roleId = userRows[0].role_id;

    // Allow FINANCE (role_id = 6) and ADMIN (role_id = 1)
    if (roleId !== 6 && roleId !== 1) {
      connection.release();
      return NextResponse.json(
        { success: false, error: 'Access Denied: You must be Finance staff' },
        { status: 403 }
      );
    }

    // Get department if finance
    let departmentId = null;
    if (roleId === 6) {
      const [staffRows] = await connection.query(
        `SELECT department_id FROM staff WHERE user_id = ? AND status = 'Active'`,
        [userId]
      );

      if (staffRows.length === 0) {
        connection.release();
        return NextResponse.json(
          { success: false, error: 'Finance profile not found' },
          { status: 404 }
        );
      }

      departmentId = staffRows[0].department_id;
    }

    // Get query params
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = `
      SELECT 
        p.patient_id,
        p.mrn,
        p.first_name,
        p.last_name,
        p.date_of_birth,
        p.gender,
        p.email,
        p.phone_number,
        COUNT(DISTINCT i.invoice_id) as invoice_count,
        SUM(i.total_amount) as total_invoiced,
        SUM(i.amount_paid) as total_paid
      FROM patients p
      LEFT JOIN invoices i ON p.patient_id = i.patient_id AND i.is_deleted = FALSE
      WHERE p.is_deleted = FALSE
    `;

    const params = [];

    if (departmentId) {
      query += ` AND p.department_id = ?`;
      params.push(departmentId);
    }

    query += ` GROUP BY p.patient_id
      ORDER BY p.first_name, p.last_name
      LIMIT ? OFFSET ?`;

    params.push(limit, offset);

    const [patients] = await connection.query(query, params);

    connection.release();

    return NextResponse.json({
      success: true,
      data: patients || [],
      count: patients.length
    });
  } catch (err) {
    if (connection) connection.release();
    console.error('Error fetching patients:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
