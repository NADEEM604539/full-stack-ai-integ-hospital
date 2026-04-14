import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserId } from '@/services/auth';

/**
 * PATCH /api/finance/invoices/{invoiceId}/update
 * Update invoice status
 * RBAC: Finance can only update invoices from their department
 */
export async function PATCH(req, { params }) {
  let connection;
  try {
    const { invoiceId } = await params;
    const { status } = await req.json();

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    connection = await db.getConnection();

    // Get current user ID and role
    let userId;
    try {
      userId = await getUserId();
    } catch (authError) {
      connection.release();
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

    // Verify invoice exists and belongs to finance staff's department
    let verifyQuery = `
      SELECT i.invoice_id 
      FROM invoices i
      LEFT JOIN appointments a ON i.appointment_id = a.appointment_id
      WHERE i.invoice_id = ?
    `;

    const verifyParams = [parseInt(invoiceId)];

    if (departmentId) {
      verifyQuery += ` AND (a.department_id = ? OR a.department_id IS NULL)`;
      verifyParams.push(departmentId);
    }

    const [invoices] = await connection.query(verifyQuery, verifyParams);

    if (!invoices.length) {
      connection.release();
      return NextResponse.json(
        { success: false, error: 'Invoice not found or access denied' },
        { status: 404 }
      );
    }

    // Update invoice status
    const [result] = await connection.query(
      `UPDATE invoices SET status = ? WHERE invoice_id = ?`,
      [status, parseInt(invoiceId)]
    );

    if (result.affectedRows === 0) {
      connection.release();
      return NextResponse.json(
        { success: false, error: 'Failed to update invoice' },
        { status: 500 }
      );
    }

    connection.release();

    return NextResponse.json({
      success: true,
      message: 'Invoice status updated successfully'
    });
  } catch (err) {
    if (connection) connection.release();
    console.error('Error updating invoice:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
