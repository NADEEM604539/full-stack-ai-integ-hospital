import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/departments/[id]/staff-count
 * Get count of staff members in a department
 * RBAC: Only admins can access (enforced at route level)
 */
export async function GET(request, { params }) {
  let connection;
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Department ID is required' },
        { status: 400 }
      );
    }

    connection = await db.getConnection();

    // Get staff count for this department
    const [result] = await connection.query(
      'SELECT COUNT(*) as count FROM staff WHERE department_id = ?',
      [id]
    );

    const count = result && result.length > 0 ? result[0].count : 0;

    return NextResponse.json({ success: true, count }, { status: 200 });
  } catch (error) {
    console.error('Get staff count API Error:', error?.message);
    
    const statusCode = error?.message?.includes('not found') ? 404 : 500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch staff count' },
      { status: statusCode }
    );
  } finally {
    if (connection) connection.release();
  }
}
