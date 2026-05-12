import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/admin/users/[id]/update
 * Update user email or other fields
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { email } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    let connection;
    try {
      connection = await db.getConnection();

      // Check if user exists
      const [userExists] = await connection.query(
        'SELECT user_id, email FROM users WHERE user_id = ?',
        [id]
      );

      if (userExists.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Check if email is already taken by another user
      const [emailExists] = await connection.query(
        'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
        [email, id]
      );

      if (emailExists.length > 0) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }

      // Update user email
      await connection.query(
        'UPDATE users SET email = ?, updated_at = NOW() WHERE user_id = ?',
        [email, id]
      );

      return NextResponse.json({
        success: true,
        message: 'User email updated successfully'
      }, { status: 200 });
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error('[USERS/UPDATE] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}
