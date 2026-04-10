import { currentUser } from '@clerk/nextjs/server';
import db from '@/lib/db';

/**
 * DEBUG ENDPOINT
 * Returns current user info from Clerk and database
 * Use to identify authentication and user database sync issues
 */
export async function GET(request) {
  let connection;
  try {
    const user = await currentUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({
          authenticated: false,
          error: 'No user authenticated via Clerk',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const clerkEmail = user.emailAddresses[0]?.emailAddress;
    const clerkUserId = user.id;

    connection = await db.getConnection();

    // Check if user exists in database
    const [dbUser] = await connection.query(
      'SELECT user_id, email, role_id FROM users WHERE email = ? LIMIT 1',
      [clerkEmail]
    );

    if (dbUser.length === 0) {
      return new Response(
        JSON.stringify({
          authenticated: true,
          clerkUser: {
            id: clerkUserId,
            email: clerkEmail,
          },
          database: {
            exists: false,
            error: `User ${clerkEmail} not found in database. Admin must create user record.`,
          },
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if receptionist has departments assigned
    const [staff] = await connection.query(
      'SELECT department_id FROM staff WHERE user_id = ? AND status = "Active"',
      [dbUser[0].user_id]
    );

    return new Response(
      JSON.stringify({
        authenticated: true,
        clerkUser: {
          id: clerkUserId,
          email: clerkEmail,
        },
        databaseUser: {
          user_id: dbUser[0].user_id,
          email: dbUser[0].email,
          role_id: dbUser[0].role_id,
        },
        departmentAssignment: {
          hasAssignedDepartments: staff.length > 0,
          departmentCount: staff.length,
          departments: staff.map(s => s.department_id),
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return new Response(
      JSON.stringify({
        error: error?.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    if (connection) connection.release();
  }
}
