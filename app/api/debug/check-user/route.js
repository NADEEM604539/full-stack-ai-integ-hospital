import { currentUser } from '@clerk/nextjs/server';
import db from '@/lib/db';

/**
 * DEBUG ENDPOINT: Comprehensive user verification
 * GET /api/debug/check-user
 * 
 * Returns:
 * 1. Clerk authentication status
 * 2. Database user record
 * 3. Staff/department assignment
 * 4. Role validation
 */
export async function GET(request) {
  try {
    // Step 1: Check Clerk authentication
    let clerkUser = null;
    let clerkError = null;

    try {
      clerkUser = await currentUser();
    } catch (err) {
      clerkError = {
        message: err?.message,
        name: err?.name,
        status: err?.status,
        details: String(err),
      };
      console.error('Clerk error:', clerkError);
    }

    // Step 2: Check database user record
    let dbUser = null;
    let dbUserError = null;

    if (clerkUser?.primaryEmailAddress?.emailAddress) {
      try {
        const connection = await db.getConnection();
        const [users] = await connection.promise().query(
          'SELECT id, email, role_id, is_deleted FROM users WHERE email = ?',
          [clerkUser.primaryEmailAddress.emailAddress]
        );
        connection.release();

        dbUser = users?.[0] || null;
      } catch (err) {
        dbUserError = {
          message: err?.message,
          code: err?.code,
        };
        console.error('Database user query error:', dbUserError);
      }
    }

    // Step 3: Check staff/department assignment
    let staffRecord = null;
    let staffError = null;

    if (dbUser?.id) {
      try {
        const connection = await db.getConnection();
        const [staffRecords] = await connection.promise().query(
          `SELECT id, user_id, department_id, position, is_active 
           FROM staff 
           WHERE user_id = ? AND is_deleted = 0`,
          [dbUser.id]
        );
        connection.release();

        staffRecord = staffRecords?.[0] || null;
      } catch (err) {
        staffError = {
          message: err?.message,
          code: err?.code,
        };
        console.error('Database staff query error:', staffError);
      }
    }

    // Step 4: Check department details if staff exists
    let departmentRecord = null;
    let departmentError = null;

    if (staffRecord?.department_id) {
      try {
        const connection = await db.getConnection();
        const [depts] = await connection.promise().query(
          'SELECT id, name FROM departments WHERE id = ?',
          [staffRecord.department_id]
        );
        connection.release();

        departmentRecord = depts?.[0] || null;
      } catch (err) {
        departmentError = {
          message: err?.message,
          code: err?.code,
        };
        console.error('Database department query error:', departmentError);
      }
    }

    // Compile comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      authentication: {
        clerkauthenticated: !!clerkUser,
        clerkUserId: clerkUser?.id,
        clerkEmail: clerkUser?.primaryEmailAddress?.emailAddress,
        clerkError: clerkError,
      },
      database: {
        userFound: !!dbUser,
        userId: dbUser?.id,
        email: dbUser?.email,
        roleId: dbUser?.role_id,
        isDeleted: dbUser?.is_deleted,
        dbUserError: dbUserError,
      },
      staff: {
        staffFound: !!staffRecord,
        staffId: staffRecord?.id,
        departmentId: staffRecord?.department_id,
        position: staffRecord?.position,
        isActive: staffRecord?.is_active,
        staffError: staffError,
      },
      department: {
        departmentFound: !!departmentRecord,
        departmentId: departmentRecord?.id,
        departmentName: departmentRecord?.name,
        departmentError: departmentError,
      },
      validation: {
        clerkAuthenticated: !!clerkUser,
        userInDatabase: !!dbUser,
        hasStaffRecord: !!staffRecord,
        hasValidDepartment: !!departmentRecord,
        isRecaptionist: dbUser?.role_id === 4 || dbUser?.role_id === 1,
        canAccessDashboard: !!clerkUser && !!dbUser && !!staffRecord && !!departmentRecord,
      },
    };


    return new Response(
      JSON.stringify(report, null, 2),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Debug endpoint fatal error:', error);
    return new Response(
      JSON.stringify({
        error: 'Debug check failed',
        message: error?.message,
        details: String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
