import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    console.log('[AUTH/USER] API called');
    
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'No email' },
        { status: 400 }
      );
    }

    let connection;
    try {
      connection = await db.getConnection();

      const [users] = await connection.query(
        `SELECT u.user_id, u.email, u.username, u.role_id, r.role 
         FROM users u 
         LEFT JOIN roles r ON u.role_id = r.role_id 
         WHERE u.email = ? 
         LIMIT 1`,
        [email]
      );

      if (!users || users.length === 0) {
        console.warn('[AUTH/USER] User not found, creating default patient role');
        return NextResponse.json({
          success: true,
          data: {
            user_id: 0,
            email: email,
            username: email.split('@')[0],
            role: 'PATIENT',
            role_id: 2,
          },
        });
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
    console.error('[AUTH/USER] Error:', error.message);
    return NextResponse.json(
      {
        success: true,
        data: {
          user_id: 0,
          email: 'unknown',
          username: 'user',
          role: 'PATIENT',
          role_id: 2,
        },
      },
      { status: 200 }
    );
  }
}
