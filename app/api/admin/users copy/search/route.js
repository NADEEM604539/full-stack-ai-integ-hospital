import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users/search?q=search&limit=10&offset=0
 * Search users with pagination
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let connection;
    try {
      connection = await db.getConnection();

      // Build search query
      const searchCondition = query 
        ? `(u.email LIKE '%${query}%' OR u.username LIKE '%${query}%' OR r.role LIKE '%${query}%')`
        : '1=1';

      // Get total count
      const [countResult] = await connection.query(
        `SELECT COUNT(*) as total FROM users u
         LEFT JOIN roles r ON u.role_id = r.role_id
         WHERE ${searchCondition}`
      );
      const total = countResult[0]?.total || 0;

      // Get paginated results
      const [users] = await connection.query(
        `SELECT 
          u.user_id,
          u.clerk_user_id,
          u.email,
          u.username,
          u.role_id,
          r.role,
          u.is_active,
          u.last_login,
          u.created_at,
          u.updated_at
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.role_id
        WHERE ${searchCondition}
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      return NextResponse.json({
        success: true,
        data: {
          users,
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit)
        }
      }, { status: 200 });
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error('[USERS/SEARCH] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to search users' },
      { status: 500 }
    );
  }
}
