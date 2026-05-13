import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/admin/users/[id]/delete
 * Delete a user
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    let connection;
    try {
      connection = await db.getConnection();

      // Check if user exists
      const [userExists] = await connection.query(
        'SELECT user_id FROM users WHERE user_id = ?',
        [id]
      );

      if (userExists.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Delete user
      await connection.query('DELETE FROM users WHERE user_id = ?', [id]);

      return NextResponse.json({
        success: true,
        message: 'User deleted successfully'
      }, { status: 200 });
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error('[USERS/DELETE] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
