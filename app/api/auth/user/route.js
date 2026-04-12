import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/user
 * Fetch current authenticated user's information
 * 
 * Returns:
 * {
 *   user_id: number,
 *   email: string,
 *   username: string,
 *   role: string,
 *   role_id: number
 * }
 */
export async function GET(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let connection;
    try {
      connection = await db.getConnection();

      // Fetch user info with role
      const [users] = await connection.query(
        `SELECT 
          u.user_id,
          u.email,
          u.username,
          u.role_id,
          r.role
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.role_id
         WHERE u.clerk_user_id = ?`,
        [userId]
      );

      if (!users.length) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      const user = users[0];

      return NextResponse.json({
        success: true,
        data: {
          user_id: user.user_id,
          email: user.email,
          username: user.username,
          role: user.role || 'PATIENT',
          role_id: user.role_id,
        },
      });
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error('Get User API Error:', error?.message);

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch user info' },
      { status: 500 }
    );
  }
}
