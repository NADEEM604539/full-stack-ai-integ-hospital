import { currentUser } from '@clerk/nextjs/server';
import db from '@/lib/db';

/**
 * Get current user's ID from database
 * Uses Clerk currentUser's email to lookup in database
 * @returns {Promise<number>} user_id from database
 * @throws {Error} If user not authenticated or not in database
 */
export async function getUserId() {
  let user;
  try {
    user = await currentUser();
  } catch (clerkError) {
    // Handle ClerkAPIResponseError and other Clerk errors
    const errorMsg = clerkError?.message || 
                     clerkError?.errors?.[0]?.message || 
                     String(clerkError) || 
                     'Unknown Clerk error';
    console.error('Clerk currentUser() error:', errorMsg);
    throw new Error(`Clerk authentication error: ${errorMsg}`);
  }
  
  if (!user) {
    throw new Error('No authenticated user found - user is not logged in');
  }

  const email = user.emailAddresses?.[0]?.emailAddress;
  if (!email) {
    throw new Error('User authenticated but no email address found in Clerk profile');
  }

  let connection;
  try {
    connection = await db.getConnection();
    const [rows] = await connection.query(
      'SELECT user_id FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (!rows || rows.length === 0) {
      throw new Error(`User with email "${email}" not found in database. Admin must create user profile.`);
    }

    return rows[0].user_id;
  } catch (dbError) {
    console.error('Database error in getUserId():', dbError?.message || String(dbError));
    throw dbError;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get current user's email from Clerk
 */
export async function getUserEmail() {
  try {
    const user = await currentUser();
    
    if (!user || !user.emailAddresses[0]?.emailAddress) {
      throw new Error('No authenticated user found');
    }

    return user.emailAddresses[0].emailAddress;
  } catch (error) {
    console.error('Error in getUserEmail():', error.message);
    throw error;
  }
}

/**
 * Get current user's role ID from database
 * Uses Clerk currentUser's email to lookup in database
 */
export async function getUserRoleId() {
  try {
    const user = await currentUser();
    
    if (!user || !user.emailAddresses[0]?.emailAddress) {
      throw new Error('No authenticated user found');
    }

    const email = user.emailAddresses[0].emailAddress;
    let connection;

    try {
      connection = await db.getConnection();
      const [rows] = await connection.query(
        'SELECT role_id FROM users WHERE email = ? LIMIT 1',
        [email]
      );

      if (rows.length === 0) {
        throw new Error(`User not found in database for email: ${email}`);
      }

      return rows[0].role_id;
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error('Error in getUserRoleId():', error.message);
    throw error;
  }
}

/**
 * Get current user's role name from database (e.g., ADMIN, DOCTOR, PATIENT)
 * Uses Clerk currentUser's email to lookup in database
 */
export async function getUserRole() {
  try {
    const user = await currentUser();
    
    if (!user || !user.emailAddresses[0]?.emailAddress) {
      throw new Error('No authenticated user found');
    }

    const email = user.emailAddresses[0].emailAddress;
    let connection;

    try {
      connection = await db.getConnection();
      const [rows] = await connection.query(
        `SELECT r.role 
         FROM users u 
         JOIN roles r ON u.role_id = r.role_id 
         WHERE u.email = ? LIMIT 1`,
        [email]
      );

      if (rows.length === 0) {
        throw new Error(`User or role not found for email: ${email}`);
      }

      return rows[0].role;
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error('Error in getUserRole():', error.message);
    throw error;
  }
}
