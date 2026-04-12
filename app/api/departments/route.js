import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/departments
 * Get all active departments (public endpoint)
 * No authentication required - patients need this to select their department
 */
export async function GET(request) {
  let connection;
  try {
    connection = await db.getConnection();
    
    const [departments] = await connection.query(
      `SELECT 
        department_id,
        department_name,
        department_head_name,
        location,
        contact_number,
        email
       FROM departments
       WHERE is_active = TRUE
       ORDER BY department_name`
    );

    return NextResponse.json(
      { success: true, data: departments || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get departments API Error:', error?.message);
    
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch departments' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
