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

/**
 * Checks if the current user is a patient.
 * Throws an error if not authenticated or not a patient.
 * @returns {Promise<{userId: number}>} The user's ID and role ID.
 */
export async function checkPatientAccess() {

  
  const user = await currentUser();


  if (!user) {
    console.error('checkPatientAccess() - No user logged in');
    throw new Error('Authentication failed: No user is logged in.');
  }

  const email = user.emailAddresses?.[0]?.emailAddress;
  if (!email) {
    console.error('checkPatientAccess() - User has no email');
    throw new Error('Authentication failed: User profile has no email.');
  }

 

  let connection;
  try {
    connection = await db.getConnection();
    const [rows] = await connection.query(
      'SELECT user_id, role_id FROM users WHERE email = ?',
      [email]
    );

 

    if (rows.length === 0) {
      console.error(`checkPatientAccess() - User email "${email}" not found in database`);
      throw new Error(`Access Denied: User with email "${email}" not found in the system.`);
    }

    const dbUser = rows[0];
  
    
    if (dbUser.role_id !== 7) { // 7 is the role_id for PATIENT
      console.error(`checkPatientAccess() - Invalid role_id: ${dbUser.role_id}, expected 7`);
      throw new Error('Access Denied: You do not have permission to access this resource.');
    }

   
    return { userId: dbUser.user_id };
  } catch (error) {
    console.error('checkPatientAccess() - Error:', {
      message: error.message,
      stack: error?.stack?.split('\n').slice(0, 2).join('\n'),
    });
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Checks if the current user is a doctor and retrieves their doctor_id
 * Throws an error if not authenticated or not a doctor.
 * @param {Connection} connection - Database connection (optional, will create if not provided)
 * @returns {Promise<{doctorId: number, userId: number}>} The doctor's ID and user ID
 */
export async function checkDoctorAccess(connection) {
  
  const user = await currentUser();
  
  if (!user) {
    console.error('checkDoctorAccess() - No user logged in');
    throw new Error('Authentication failed: No user is logged in.');
  }

  const email = user.emailAddresses?.[0]?.emailAddress;
  if (!email) {
    console.error('checkDoctorAccess() - User has no email');
    throw new Error('Authentication failed: User profile has no email.');
  }

  let conn = connection;
  let shouldRelease = false;

  try {
    if (!conn) {
      conn = await db.getConnection();
      shouldRelease = true;
    }

    // Get user and verify it's a doctor
    const [rows] = await conn.query(
      'SELECT user_id, role_id FROM users WHERE email = ?',
      [email]
    );


    if (rows.length === 0) {
      console.error(`checkDoctorAccess() - User email "${email}" not found in database`);
      throw new Error(`Access Denied: User with email "${email}" not found in the system.`);
    }

    const dbUser = rows[0];
    
    if (dbUser.role_id !== 2) { // 2 is the role_id for DOCTOR
      console.error(`checkDoctorAccess() - Invalid role_id: ${dbUser.role_id}, expected 2 (DOCTOR)`);
      throw new Error('Access Denied: You do not have permission to access this resource. Doctor role required.');
    }

    // Get doctor_id from doctors table
    const [doctorRows] = await conn.query(
      `SELECT d.doctor_id 
       FROM doctors d
       JOIN staff s ON d.staff_id = s.staff_id
       WHERE s.user_id = ?`,
      [dbUser.user_id]
    );

    if (doctorRows.length === 0) {
       throw new Error('Access Denied: Doctor profile not found for this user.');
    }

    const doctorId = doctorRows[0].doctor_id;
     
    return { doctorId, userId: dbUser.user_id };
  } catch (error) {
    throw error;
  } finally {
    if (shouldRelease && conn) conn.release();
  }
}

/**
 * Checks if the current user is a nurse and retrieves their nurse_id (staff_id)
 * Throws an error if not authenticated or not a nurse.
 * Also enforces department-based access control
 * @param {Connection} connection - Database connection (optional, will create if not provided)
 * @returns {Promise<{nurseId: number, userId: number, departmentId: number}>} The nurse's staff_id, user_id, and department_id
 */
export async function checkNurseAccess(connection) {
   
  const user = await currentUser(); 
  if (!user) {
     throw new Error('Authentication failed: No user is logged in.');
  }

  const email = user.emailAddresses?.[0]?.emailAddress;
  if (!email) {
     throw new Error('Authentication failed: User profile has no email.');
  }

  let conn = connection;
  let shouldRelease = false;

  try {
    if (!conn) {
      conn = await db.getConnection();
      shouldRelease = true;
    }

    // Get user and verify it's a nurse (role_id = 3)
    const [rows] = await conn.query(
      'SELECT user_id, role_id FROM users WHERE email = ?',
      [email]
    );

    console.log(`checkNurseAccess() - Database query returned ${rows?.length || 0} rows`);

    if (rows.length === 0) {
      console.error(`checkNurseAccess() - User email "${email}" not found in database`);
      throw new Error(`Access Denied: User with email "${email}" not found in the system.`);
    }

    const dbUser = rows[0];
    console.log(`checkNurseAccess() - User found, userId: ${dbUser.user_id}, role_id: ${dbUser.role_id}`);
    
    if (dbUser.role_id !== 3) { // 3 is the role_id for NURSE
      console.error(`checkNurseAccess() - Invalid role_id: ${dbUser.role_id}, expected 3 (NURSE)`);
      throw new Error('Access Denied: You do not have permission to access this resource. Nurse role required.');
    }

    // Get nurse profile from staff table (department_id for department-based access)
    const [nurseRows] = await conn.query(
      `SELECT staff_id, department_id 
       FROM staff 
       WHERE user_id = ?`,
      [dbUser.user_id]
    );

    if (nurseRows.length === 0) {
      console.error(`checkNurseAccess() - Nurse profile not found for user ${dbUser.user_id}`);
      throw new Error('Access Denied: Nurse profile not found for this user.');
    }

    const nurseId = nurseRows[0].staff_id;
    const departmentId = nurseRows[0].department_id;
    
    console.log(`checkNurseAccess() - Auth successful, returning nurseId: ${nurseId}, userId: ${dbUser.user_id}, departmentId: ${departmentId}`);
    
    return { nurseId, userId: dbUser.user_id, departmentId };
  } catch (error) {
    console.error('checkNurseAccess() - Error:', {
      message: error.message,
      stack: error?.stack?.split('\n').slice(0, 2).join('\n'),
    });
    throw error;
  } finally {
    if (shouldRelease && conn) conn.release();
  }
}
