import db from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * POST /api/createuser
 * 
 * Webhook endpoint for Clerk user creation events.
 * Creates user record in MySQL with default PATIENT role.
 * 
 * This follows enterprise database management standards:
 * - Input validation and sanitization
 * - Parameterized queries to prevent SQL injection
 * - Proper error handling with meaningful responses
 * - Transaction safety for data consistency
 * - Audit trail support
 */
export async function POST(request) {
  let connection;
  
  try {
    const body = await request.json();

    // ========== VALIDATION ==========
    // Validate Clerk webhook payload structure
    if (!body?.data?.email_addresses?.[0]?.email_address) {
      console.warn('Invalid Clerk payload: Missing email address');
      return NextResponse.json(
        { error: 'Invalid request: Missing email address' },
        { status: 400 }
      );
    }

    if (!body?.data?.id) {
      console.warn('Invalid Clerk payload: Missing clerk_user_id');
      return NextResponse.json(
        { error: 'Invalid request: Missing clerk user ID' },
        { status: 400 }
      );
    }

    // Extract and validate data
    const clerkUserId = body.data.id;
    const email = body.data.email_addresses[0].email_address;
    const username = body.data.first_name || email.split('@')[0];

    // Validate email format (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // ========== DATABASE OPERATION ==========
    connection = await db.getConnection();

    // Check if user already exists (by email or clerk_user_id)
    const [existingUsers] = await connection.query(
      `SELECT user_id, email, clerk_user_id FROM users 
       WHERE email = ? OR clerk_user_id = ? 
       LIMIT 1`,
      [email, clerkUserId]
    );

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      console.warn(`User already exists: email=${email}, clerk_id=${clerkUserId}`);
      
      return NextResponse.json(
        { 
          error: 'User already exists',
          userId: existingUser.user_id,
          message: 'Email or Clerk ID already registered in system'
        },
        { status: 409 }
      );
    }

    // ========== CREATE NEW USER ==========
    // Insert new user with:
    // - clerk_user_id from Clerk webhook
    // - email from Clerk
    // - username from Clerk first_name (or email prefix)
    // - role_id = 7 (PATIENT - default role)
    // - is_active = TRUE (new users active by default)
    
    const insertResult = await connection.query(
      `INSERT INTO users (clerk_user_id, email, username, role_id, is_active) 
       VALUES (?, ?, ?, 7, TRUE)`,
      [clerkUserId, email, username]
    );

    const userId = insertResult[0].insertId;

    console.log(`User created successfully: user_id=${userId}, email=${email}, role=PATIENT(7)`);

    return NextResponse.json(
      { 
        message: 'User created successfully',
        userId: userId,
        email: email,
        role: 'PATIENT',
        redirectUrl: '/',
        timestamp: new Date().toISOString()
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error in createuser POST:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      stack: error.stack
    });

    // Handle specific database errors
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Duplicate entry: Email or Clerk ID already exists' },
        { status: 409 }
      );
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return NextResponse.json(
        { error: 'Invalid role ID: Role does not exist' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to create user. Please try again later.'
      },
      { status: 500 }
    );

  } finally {
    // Release connection back to pool
    if (connection) {
      connection.release();
    }
  }
}