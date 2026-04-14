import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserId } from '@/services/auth';

/**
 * GET /api/finance/invoices/{invoiceId}
 * Get invoice details with line items
 * RBAC: Finance can only view invoices from their department
 */
export async function GET(req, { params }) {
  let connection;
  try {
    const { invoiceId } = await params;

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
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

    // Get invoice details
    let invoiceQuery = `
      SELECT 
        i.invoice_id,
        i.appointment_id,
        i.invoice_date,
        i.due_date,
        i.subtotal,
        i.tax_amount,
        i.discount_amount,
        i.total_amount,
        i.amount_paid,
        i.status,
        DATEDIFF(NOW(), i.due_date) AS days_overdue,
        p.patient_id,
        p.mrn,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        p.email as patient_email,
        p.phone_number as patient_phone,
        a.appointment_date,
        a.appointment_time,
        CONCAT(s.first_name, ' ', s.last_name) AS doctor_name,
        dept.department_name,
        i.created_by
      FROM invoices i
      LEFT JOIN appointments a ON i.appointment_id = a.appointment_id
      LEFT JOIN patients p ON i.patient_id = p.patient_id
      LEFT JOIN doctors d ON a.doctor_id = d.doctor_id
      LEFT JOIN staff s ON d.staff_id = s.staff_id
      LEFT JOIN departments dept ON a.department_id = dept.department_id
      WHERE i.invoice_id = ? AND i.is_deleted = FALSE
    `;

    const invoiceParams = [parseInt(invoiceId)];

    if (departmentId) {
      invoiceQuery += ` AND (a.department_id = ? OR a.department_id IS NULL)`;
      invoiceParams.push(departmentId);
    }

    const [invoices] = await connection.query(invoiceQuery, invoiceParams);

    if (!invoices.length) {
      connection.release();
      return NextResponse.json(
        { success: false, error: 'Invoice not found or access denied' },
        { status: 404 }
      );
    }

    const invoice = invoices[0];

    // Get line items
    const [items] = await connection.query(
      `SELECT 
        invoice_line_item_id as id,
        description,
        item_type,
        quantity,
        unit_price
       FROM invoice_line_items
       WHERE invoice_id = ? AND is_deleted = FALSE
       ORDER BY invoice_line_item_id`,
      [parseInt(invoiceId)]
    );

    connection.release();

    return NextResponse.json({
      success: true,
      data: {
        ...invoice,
        items: items || []
      }
    });
  } catch (err) {
    if (connection) connection.release();
    console.error('Error fetching invoice details:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
