import db from '@/lib/db';
import { getUserId } from './auth';

/**
 * ADMIN SERVICE - Full system access
 * Admin (role_id = 1) can:
 * - Manage all admins
 * - Manage all users
 * - View all patients, encounters, payments
 * - Manage departments and staff
 * - Access all hospital data
 */

/**
 * Check admin role (role_id = 1) and get user ID
 * Returns: { userId, roleId }
 */
async function checkAdminAccess(connection) {
  try {
    let userId;
    try {
      userId = await getUserId();
    } catch (authError) {
      console.error('Auth error in checkAdminAccess:', authError);
      throw new Error(`Authentication failed: ${authError?.message || String(authError)}`);
    }

    if (!userId) {
      throw new Error('No user ID obtained from authentication');
    }
    
    // Query user role from database
    const [userRole] = await connection.query(
      `SELECT role_id, user_id FROM users WHERE user_id = ?`,
      [userId]
    );

    if (!userRole.length) {
      throw new Error(`User ${userId} not found in database`);
    }

    const roleId = userRole[0].role_id;
    
    // Only allow ADMIN (role_id = 1)
    if (roleId !== 1) {
      throw new Error(`Access Denied: Required role ADMIN (1), got ${roleId}`);
    }

    return { userId, roleId };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error in RBAC check';
    console.error('RBAC Check error:', errorMsg);
    throw new Error(`RBAC Check Failed: ${errorMsg}`);
  }
}

/**
 * Get all admins (role_id = 1)
 * Returns: array of admin objects
 */
export async function getAllAdmins() {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    const [admins] = await connection.query(
      `SELECT user_id, email, username, is_active, created_at
       FROM users
       WHERE role_id = 1
       ORDER BY created_at DESC`
    );

    return admins || [];
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error fetching admins:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Create new admin
 * Only existing admins can create new admins
 */
export async function createAdmin(email, username) {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    if (!email || !email.trim()) {
      throw new Error('Email is required');
    }

    // Check if email already exists
    const [existing] = await connection.query(
      `SELECT user_id FROM users WHERE email = ?`,
      [email.trim()]
    );

    if (existing && existing.length > 0) {
      throw new Error('Email already exists');
    }

    // Create new admin
    const [result] = await connection.query(
      `INSERT INTO users (email, username, role_id, is_active, created_at)
       VALUES (?, ?, 1, 1, NOW())`,
      [email.trim(), username?.trim() || null]
    );

    return { user_id: result.insertId, email: email.trim(), username: username?.trim() || null };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error creating admin:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Delete admin by ID
 * Prevents self-deletion
 */
export async function deleteAdmin(adminIdToDelete) {
  let connection;
  try {
    connection = await db.getConnection();
    
    const { userId: currentUserId } = await checkAdminAccess(connection);

    if (currentUserId === adminIdToDelete) {
      throw new Error('Cannot delete yourself');
    }

    // Verify the user to delete is an admin
    const [adminToDelete] = await connection.query(
      `SELECT role_id FROM users WHERE user_id = ?`,
      [adminIdToDelete]
    );

    if (!adminToDelete || adminToDelete.length === 0) {
      throw new Error('Admin not found');
    }

    if (adminToDelete[0].role_id !== 1) {
      throw new Error('User is not an admin');
    }

    // Delete the admin
    const [result] = await connection.query(
      `DELETE FROM users WHERE user_id = ?`,
      [adminIdToDelete]
    );

    if (result.affectedRows === 0) {
      throw new Error('Failed to delete admin');
    }

    return { success: true, message: 'Admin deleted successfully' };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error deleting admin:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get all patients
 */
export async function getAllPatients() {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    const [patients] = await connection.query(
      `SELECT 
        p.patient_id,
        p.user_id,
        p.mrn,
        p.first_name,
        p.last_name,
        p.date_of_birth,
        p.gender,
        p.blood_type,
        p.phone_number,
        p.email,
        p.address,
        p.city,
        p.emergency_contact,
        p.emergency_phone,
        p.department_id,
        p.is_active,
        p.ai_readmission_risk,
        d.department_name,
        p.created_at
       FROM patients p
       LEFT JOIN departments d ON p.department_id = d.department_id
       ORDER BY p.first_name, p.last_name`
    );

    return patients || [];
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error fetching patients:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get patients who are not yet staff
 * (Still role_id = 7)
 */
export async function getPatientsAsUsers() {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    const [patients] = await connection.query(
      `SELECT 
        u.user_id,
        u.email,
        u.is_active,
        p.patient_id,
        p.first_name,
        p.last_name,
        p.mrn,
        p.date_of_birth,
        p.gender,
        p.blood_type,
        p.phone_number,
        p.email as patient_email,
        p.department_id,
        d.department_name
       FROM patients p
       LEFT JOIN users u ON p.user_id = u.user_id
       LEFT JOIN departments d ON p.department_id = d.department_id
       WHERE u.role_id = 7
       ORDER BY p.first_name, p.last_name`
    );

    return patients || [];
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error fetching patients as users:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Convert patient to staff
 * Changes role from PATIENT (7) to specified role
 * Adds to staff table with department assignment
 */
export async function convertPatientToStaff(userId, email, firstName, lastName, departmentId, roleId) {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    if (!userId || !departmentId || !roleId) {
      throw new Error('Missing required fields: user_id, department_id, role_id');
    }

    // Verify user exists and is a patient
    const [user] = await connection.query(
      `SELECT role_id FROM users WHERE user_id = ?`,
      [userId]
    );

    if (!user || user.length === 0) {
      throw new Error('User not found');
    }

    if (user[0].role_id !== 7) {
      throw new Error('User is not a patient');
    }

    // Start transaction
    await connection.beginTransaction();

    try {
      // 1. Update user role
      await connection.query(
        `UPDATE users SET role_id = ? WHERE user_id = ?`,
        [roleId, userId]
      );

      // 2. Check if staff record exists
      const [staffRecord] = await connection.query(
        `SELECT staff_id FROM staff WHERE user_id = ?`,
        [userId]
      );

      if (!staffRecord || staffRecord.length === 0) {
        // Create new staff record
        await connection.query(
          `INSERT INTO staff (user_id, department_id, first_name, last_name, email, created_at)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [userId, departmentId, firstName, lastName, email]
        );
      } else {
        // Update existing staff record
        await connection.query(
          `UPDATE staff SET department_id = ? WHERE user_id = ?`,
          [departmentId, userId]
        );
      }

      await connection.commit();
      return { success: true, message: 'Patient converted to staff successfully' };
    } catch (txError) {
      await connection.rollback();
      throw txError;
    }
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error converting patient to staff:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get all encounters with patient and doctor info
 */
export async function getAllEncounters() {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    const [encounters] = await connection.query(
      `SELECT 
        e.encounter_id,
        e.patient_id,
        e.doctor_id,
        e.admission_date,
        e.appointment_id,
        e.encounter_type,
        e.chief_complaint,
        e.status,
        e.created_by,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.mrn,
        u.email as doctor_email,
        s.first_name as doctor_first_name,
        s.last_name as doctor_last_name
       FROM encounters e
       LEFT JOIN patients p ON e.patient_id = p.patient_id
       LEFT JOIN doctors d ON e.doctor_id = d.doctor_id
       LEFT JOIN staff s ON d.staff_id = s.staff_id
       LEFT JOIN users u ON s.user_id = u.user_id
       ORDER BY e.admission_date DESC`
    );

    return encounters || [];
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error fetching encounters:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get SOAP notes for an encounter (from separate S/O/A/P tables)
 */
export async function getEncounterSOAP(encounterId) {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    // Get Subjective notes
    const [subjective] = await connection.query(
      `SELECT patient_complaint, symptom_duration, severity_level, affecting_daily_activities, created_by
       FROM subjective_notes
       WHERE encounter_id = ?
       LIMIT 1`,
      [encounterId]
    );

    // Get Objective notes
    const [objective] = await connection.query(
      `SELECT physical_examination, lab_findings, imaging_results, created_by
       FROM objective_notes
       WHERE encounter_id = ?
       LIMIT 1`,
      [encounterId]
    );

    // Get Assessment notes
    const [assessment] = await connection.query(
      `SELECT primary_diagnosis, differential_diagnoses, clinical_reasoning, icd10_code, severity_level, created_by
       FROM assessment_notes
       WHERE encounter_id = ?
       LIMIT 1`,
      [encounterId]
    );

    // Get Plan notes
    const [plan] = await connection.query(
      `SELECT treatment_plan, medication_plan, follow_up_plan, patient_education, created_by
       FROM plan_notes
       WHERE encounter_id = ?
       LIMIT 1`,
      [encounterId]
    );

    return {
      encounter_id: encounterId,
      subjective: subjective && subjective.length > 0 ? subjective[0] : null,
      objective: objective && objective.length > 0 ? objective[0] : null,
      assessment: assessment && assessment.length > 0 ? assessment[0] : null,
      plan: plan && plan.length > 0 ? plan[0] : null
    };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error fetching SOAP notes:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get all invoices with payment status
 */
export async function getAllInvoices() {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    const [invoices] = await connection.query(
      `SELECT 
        i.invoice_id,
        i.patient_id,
        i.invoice_date,
        i.total_amount,
        i.status,
        COALESCE(SUM(p.amount_paid), 0) as amount_paid,
        (i.total_amount - COALESCE(SUM(p.amount_paid), 0)) as balance_due,
        pa.first_name,
        pa.last_name,
        pa.mrn
       FROM invoices i
       LEFT JOIN patients pa ON i.patient_id = pa.patient_id
       LEFT JOIN payments p ON i.invoice_id = p.invoice_id
       GROUP BY i.invoice_id
       ORDER BY i.invoice_date DESC`
    );

    return invoices || [];
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error fetching invoices:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get current admin's profile
 */
export async function getAdminProfile() {
  let connection;
  try {
    connection = await db.getConnection();
    
    const { userId } = await checkAdminAccess(connection);

    const [admin] = await connection.query(
      `SELECT 
        user_id,
        email,
        username,
        role_id,
        is_active,
        created_at,
        updated_at
       FROM users
       WHERE user_id = ?`,
      [userId]
    );

    if (!admin || admin.length === 0) {
      throw new Error('Admin profile not found');
    }

    return admin[0];
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error fetching admin profile:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Update admin profile
 */
export async function updateAdminProfile(email, username) {
  let connection;
  try {
    connection = await db.getConnection();
    
    const { userId } = await checkAdminAccess(connection);

    if (!email || !username) {
      throw new Error('Email and username are required');
    }

    // Check if new email already exists
    const [existing] = await connection.query(
      `SELECT user_id FROM users WHERE email = ? AND user_id != ?`,
      [email.trim(), userId]
    );

    if (existing && existing.length > 0) {
      throw new Error('Email already in use');
    }

    // Update admin
    const [result] = await connection.query(
      `UPDATE users 
       SET email = ?, username = ?, updated_at = NOW()
       WHERE user_id = ?`,
      [email.trim(), username.trim(), userId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Failed to update profile');
    }

    return { success: true, message: 'Profile updated successfully' };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error updating admin profile:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get current admin's user ID
 * Used by frontend to prevent self-deletion
 */
export async function getCurrentAdminUserId() {
  let connection;
  try {
    connection = await db.getConnection();
    
    const { userId } = await checkAdminAccess(connection);
    return userId;
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error getting current admin user ID:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * ============================================
 * STAFF MANAGEMENT FUNCTIONS
 * ============================================
 */

/**
 * Get all staff members with department and user details
 */
export async function getAllStaff() {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    const [staff] = await connection.query(
      `SELECT s.*, d.department_name, u.email, u.role_id, r.role 
       FROM staff s
       JOIN departments d ON s.department_id = d.department_id
       JOIN users u ON s.user_id = u.user_id
       JOIN roles r ON u.role_id = r.role_id
       ORDER BY s.first_name, s.last_name`
    );

    return staff || [];
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error fetching staff:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get staff member by ID
 */
export async function getStaffById(staffId) {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    const [staff] = await connection.query(
      `SELECT s.*, d.department_name, u.email, u.role_id, r.role 
       FROM staff s
       JOIN departments d ON s.department_id = d.department_id
       JOIN users u ON s.user_id = u.user_id
       JOIN roles r ON u.role_id = r.role_id
       WHERE s.staff_id = ?`,
      [staffId]
    );

    if (!staff || staff.length === 0) {
      throw new Error('Staff member not found');
    }

    return staff[0];
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error fetching staff:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Create new staff member
 * Creates or updates user record, creates staff record
 */
export async function createStaff(email, firstName, lastName, employeeId, designation, departmentId, hireDate, phoneNumber, roleId) {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    if (!email || !firstName || !lastName || !employeeId || !departmentId) {
      throw new Error('Missing required fields');
    }

    const deptId = parseInt(departmentId);
    const roleIdNum = parseInt(roleId) || 3;

    await connection.beginTransaction();

    try {
      // Check if email already exists
      const [existingUser] = await connection.query(
        'SELECT user_id FROM users WHERE email = ?',
        [email]
      );

      let userId;
      if (existingUser && existingUser.length > 0) {
        userId = existingUser[0].user_id;
      } else {
        // Create new user
        const [userResult] = await connection.query(
          'INSERT INTO users (email, role_id, is_active, created_at) VALUES (?, ?, 1, NOW())',
          [email, roleIdNum]
        );
        userId = userResult.insertId;
      }

      // Check if staff record already exists for this user
      const [existingStaff] = await connection.query(
        'SELECT staff_id FROM staff WHERE user_id = ?',
        [userId]
      );

      let staffId;
      if (existingStaff && existingStaff.length > 0) {
        // Update existing staff record
        staffId = existingStaff[0].staff_id;
        await connection.query(
          `UPDATE staff 
           SET department_id = ?, first_name = ?, last_name = ?, employee_id = ?, designation = ?, hire_date = ?, phone_number = ?
           WHERE staff_id = ?`,
          [deptId, firstName, lastName, employeeId, designation || null, hireDate || null, phoneNumber || null, staffId]
        );
      } else {
        // Create new staff record
        const [staffResult] = await connection.query(
          `INSERT INTO staff 
           (user_id, department_id, first_name, last_name, employee_id, designation, hire_date, phone_number, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [userId, deptId, firstName, lastName, employeeId, designation || null, hireDate || null, phoneNumber || null]
        );
        staffId = staffResult.insertId;
      }

      await connection.commit();

      return { 
        staff_id: staffId, 
        user_id: userId, 
        email: email,
        first_name: firstName,
        last_name: lastName 
      };
    } catch (txError) {
      await connection.rollback();
      throw txError;
    }
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error creating staff:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Update staff member
 */
export async function updateStaff(staffId, updates) {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    if (!staffId) {
      throw new Error('Staff ID is required');
    }

    // Build dynamic update query
    const allowed_fields = ['first_name', 'last_name', 'designation', 'department_id', 'hire_date', 'phone_number', 'status'];
    const update_fields = [];
    const update_values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowed_fields.includes(key) && value !== undefined && value !== null) {
        update_fields.push(`${key} = ?`);
        update_values.push(value);
      }
    }

    if (update_fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    update_values.push(staffId);

    const [result] = await connection.query(
      `UPDATE staff SET ${update_fields.join(', ')}, updated_at = NOW() WHERE staff_id = ?`,
      update_values
    );

    if (result.affectedRows === 0) {
      throw new Error('Staff member not found or update failed');
    }

    return { success: true, message: 'Staff member updated successfully' };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error updating staff:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Delete staff member
 * Only removes staff record, keeps user record
 */
export async function deleteStaff(staffId) {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    if (!staffId) {
      throw new Error('Staff ID is required');
    }

    const [result] = await connection.query(
      'DELETE FROM staff WHERE staff_id = ?',
      [staffId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Staff member not found');
    }

    return { success: true, message: 'Staff member deleted successfully' };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error deleting staff:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * ============================================
 * DEPARTMENT MANAGEMENT FUNCTIONS
 * ============================================
 */

/**
 * Get all departments
 */
export async function getAllDepartments() {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    const [departments] = await connection.query(
      `SELECT d.*, COUNT(s.staff_id) as staff_count
       FROM departments d
       LEFT JOIN staff s ON d.department_id = s.department_id
       GROUP BY d.department_id
       ORDER BY d.department_name`
    );

    return departments || [];
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error fetching departments:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get department by ID
 */
export async function getDepartmentById(deptId) {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    const [departments] = await connection.query(
      `SELECT d.*, COUNT(s.staff_id) as staff_count
       FROM departments d
       LEFT JOIN staff s ON d.department_id = s.department_id
       WHERE d.department_id = ?
       GROUP BY d.department_id`,
      [deptId]
    );

    if (!departments || departments.length === 0) {
      throw new Error('Department not found');
    }

    return departments[0];
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error fetching department:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Create new department
 */
export async function createDepartment(departmentName, description, headId) {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    if (!departmentName || !departmentName.trim()) {
      throw new Error('Department name is required');
    }

    const [result] = await connection.query(
      `INSERT INTO departments (department_name, description, head_id, is_active, created_at)
       VALUES (?, ?, ?, 1, NOW())`,
      [departmentName.trim(), description || null, headId || null]
    );

    return { 
      department_id: result.insertId, 
      department_name: departmentName.trim() 
    };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error creating department:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Update department
 */
export async function updateDepartment(deptId, updates) {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    if (!deptId) {
      throw new Error('Department ID is required');
    }

    const allowed_fields = ['department_name', 'description', 'head_id', 'is_active'];
    const update_fields = [];
    const update_values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowed_fields.includes(key) && value !== undefined) {
        update_fields.push(`${key} = ?`);
        update_values.push(value);
      }
    }

    if (update_fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    update_values.push(deptId);

    const [result] = await connection.query(
      `UPDATE departments SET ${update_fields.join(', ')}, updated_at = NOW() WHERE department_id = ?`,
      update_values
    );

    if (result.affectedRows === 0) {
      throw new Error('Department not found or update failed');
    }

    return { success: true, message: 'Department updated successfully' };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error updating department:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Delete department
 * Only allows deletion if no staff members belong to it
 */
export async function deleteDepartment(deptId) {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    if (!deptId) {
      throw new Error('Department ID is required');
    }

    // Check if any staff exist in this department
    const [staff] = await connection.query(
      'SELECT COUNT(*) as count FROM staff WHERE department_id = ?',
      [deptId]
    );

    if (staff[0].count > 0) {
      throw new Error(`Cannot delete department with ${staff[0].count} staff members. Reassign staff first.`);
    }

    const [result] = await connection.query(
      'DELETE FROM departments WHERE department_id = ?',
      [deptId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Department not found');
    }

    return { success: true, message: 'Department deleted successfully' };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error deleting department:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * ============================================
 * USER MANAGEMENT FUNCTIONS
 * ============================================
 */

/**
 * Get all users with roles
 */
export async function getAllUsers() {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    const [users] = await connection.query(
      `SELECT u.user_id, u.email, u.username, u.role_id, u.is_active, u.created_at, u.updated_at, r.role
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       ORDER BY u.created_at DESC`
    );

    return users || [];
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error fetching users:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Update user details
 */
export async function updateUser(userId, updates) {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    if (!userId) {
      throw new Error('User ID is required');
    }

    const allowed_fields = ['email', 'username', 'role_id', 'is_active'];
    const update_fields = [];
    const update_values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowed_fields.includes(key) && value !== undefined) {
        update_fields.push(`${key} = ?`);
        update_values.push(value);
      }
    }

    if (update_fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    update_values.push(userId);

    const [result] = await connection.query(
      `UPDATE users SET ${update_fields.join(', ')}, updated_at = NOW() WHERE user_id = ?`,
      update_values
    );

    if (result.affectedRows === 0) {
      throw new Error('User not found or update failed');
    }

    return { success: true, message: 'User updated successfully' };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error updating user:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * ============================================
 * DASHBOARD & AUDIT FUNCTIONS
 * ============================================
 */

/**
 * Get dashboard statistics
 */
export async function getDashboardStats() {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    const [
      userStats,
      staffStats,
      departmentStats,
      patientStats,
      appointmentStats,
      invoiceStats,
      recentAudit
    ] = await Promise.all([
      connection.query('SELECT COUNT(*) as total FROM users'),
      connection.query('SELECT COUNT(*) as total FROM staff WHERE status = "Active"'),
      connection.query('SELECT COUNT(*) as total FROM departments WHERE is_active = TRUE'),
      connection.query('SELECT COUNT(*) as total FROM patients WHERE is_active = TRUE AND is_deleted = FALSE'),
      connection.query('SELECT COUNT(*) as total FROM appointments WHERE status = "Scheduled"'),
      connection.query(
        `SELECT SUM(total_amount) as total_revenue, COUNT(*) as total_invoices 
         FROM invoices WHERE status = "Paid"`
      ),
      connection.query(
        `SELECT al.action_type, COUNT(*) as count FROM audit_logs al 
         WHERE DATE(al.timestamp) = CURDATE() 
         GROUP BY al.action_type 
         ORDER BY count DESC LIMIT 5`
      )
    ]);

    return {
      totalUsers: userStats[0][0]?.total || 0,
      activeStaff: staffStats[0][0]?.total || 0,
      departments: departmentStats[0][0]?.total || 0,
      activePatients: patientStats[0][0]?.total || 0,
      scheduledAppointments: appointmentStats[0][0]?.total || 0,
      totalRevenue: invoiceStats[0][0]?.total_revenue || 0,
      totalInvoices: invoiceStats[0][0]?.total_invoices || 0,
      recentActions: recentAudit[0] || []
    };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error fetching dashboard stats:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(tableName = null, actionType = null, limit = 50, offset = 0) {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];

    if (tableName) {
      query += ' AND table_name = ?';
      params.push(tableName);
    }

    if (actionType) {
      query += ' AND action_type = ?';
      params.push(actionType);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [logs] = await connection.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1';
    const countParams = [];
    if (tableName) {
      countQuery += ' AND table_name = ?';
      countParams.push(tableName);
    }
    if (actionType) {
      countQuery += ' AND action_type = ?';
      countParams.push(actionType);
    }

    const [countResult] = await connection.query(countQuery, countParams);
    const total = countResult[0]?.total || 0;

    return {
      data: logs || [],
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit
    };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error fetching audit logs:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get all available roles
 * Used for role selection in forms
 */
export async function getAllRoles() {
  let connection;
  try {
    connection = await db.getConnection();
    
    // Note: No RBAC check here - public endpoint for role definitions
    const [roles] = await connection.query(
      'SELECT role_id, role, description FROM roles ORDER BY role_id'
    );

    return roles || [];
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error fetching roles:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * ============================================
 * ADMIN ADDITIONAL FUNCTIONS
 * ============================================
 */

/**
 * Update admin details
 */
export async function updateAdmin(adminId, email, username) {
  let connection;
  try {
    connection = await db.getConnection();
    
    const { userId: currentUserId } = await checkAdminAccess(connection);

    // Prevent self-modification could be allowed, but keeps control
    if (!adminId) {
      throw new Error('Admin ID is required');
    }

    // Verify admin exists
    const [adminCheck] = await connection.query(
      'SELECT role_id FROM users WHERE user_id = ?',
      [adminId]
    );

    if (!adminCheck || adminCheck.length === 0) {
      throw new Error('Admin not found');
    }

    if (adminCheck[0].role_id !== 1) {
      throw new Error('User is not an admin');
    }

    // Check if new email is unique
    if (email) {
      const [existingEmail] = await connection.query(
        'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
        [email, adminId]
      );
      if (existingEmail && existingEmail.length > 0) {
        throw new Error('Email already in use');
      }
    }

    const [result] = await connection.query(
      'UPDATE users SET email = ?, username = ? WHERE user_id = ?',
      [email || null, username || null, adminId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Failed to update admin');
    }

    return { success: true, message: 'Admin updated successfully' };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error updating admin:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Convert admin to staff
 * Changes from role 1 (ADMIN) to staff role with department
 */
export async function adminToStaff(userId, firstName, lastName, designationorDeptId, roleId) {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    if (!userId || !roleId) {
      throw new Error('Missing required fields: user_id, role_id');
    }

    // Verify user exists and is admin
    const [user] = await connection.query(
      'SELECT role_id FROM users WHERE user_id = ?',
      [userId]
    );

    if (!user || user.length === 0) {
      throw new Error('User not found');
    }

    if (user[0].role_id !== 1) {
      throw new Error('User is not an admin');
    }

    await connection.beginTransaction();

    try {
      // 1. Update user role
      await connection.query(
        'UPDATE users SET role_id = ? WHERE user_id = ?',
        [roleId, userId]
      );

      // 2. Create staff record if not exist
      const [staffRecord] = await connection.query(
        'SELECT staff_id FROM staff WHERE user_id = ?',
        [userId]
      );

      if (!staffRecord || staffRecord.length === 0) {
        await connection.query(
          `INSERT INTO staff (user_id, department_id, first_name, last_name, created_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [userId, designationorDeptId, firstName || '', lastName || '']
        );
      } else {
        await connection.query(
          'UPDATE staff SET department_id = ? WHERE user_id = ?',
          [designationorDeptId, userId]
        );
      }

      await connection.commit();
      return { success: true, message: 'Admin converted to staff successfully' };
    } catch (txError) {
      await connection.rollback();
      throw txError;
    }
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error converting admin to staff:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * ============================================
 * PATIENT ADDITIONAL FUNCTIONS
 * ============================================
 */

/**
 * Update patient details
 */
export async function updatePatient(patientId, updates) {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    if (!patientId) {
      throw new Error('Patient ID is required');
    }

    const allowed_fields = ['first_name', 'last_name', 'date_of_birth', 'gender', 'blood_type', 'phone_number', 'email', 'address', 'city', 'emergency_contact', 'emergency_phone', 'department_id', 'is_active'];
    const update_fields = [];
    const update_values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowed_fields.includes(key) && value !== undefined && value !== null && value !== '') {
        update_fields.push(`${key} = ?`);
        update_values.push(value);
      }
    }

    if (update_fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    update_values.push(patientId);

    const [result] = await connection.query(
      `UPDATE patients SET ${update_fields.join(', ')}, updated_at = NOW() WHERE patient_id = ?`,
      update_values
    );

    if (result.affectedRows === 0) {
      throw new Error('Patient not found or update failed');
    }

    return { success: true, message: 'Patient updated successfully' };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error updating patient:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Delete patient (soft delete)
 */
export async function deletePatient(patientId) {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    if (!patientId) {
      throw new Error('Patient ID is required');
    }

    const [result] = await connection.query(
      'UPDATE patients SET is_deleted = TRUE, deleted_at = NOW() WHERE patient_id = ?',
      [patientId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Patient not found');
    }

    return { success: true, message: 'Patient deleted successfully' };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error deleting patient:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Convert patient to staff
 * Changes role from PATIENT (7) to specified role and adds to staff
 */
export async function patientToStaff(userId, patientId, firstName, lastName, departmentId, roleId) {
  let connection;
  try {
    connection = await db.getConnection();
    
    await checkAdminAccess(connection);

    if (!userId || !patientId || !departmentId || !roleId) {
      throw new Error('Missing required fields');
    }

    // Verify patient exists
    const [patient] = await connection.query(
      'SELECT user_id FROM patients WHERE patient_id = ?',
      [patientId]
    );

    if (!patient || patient.length === 0) {
      throw new Error('Patient not found');
    }

    // Verify user is patient
    const [user] = await connection.query(
      'SELECT role_id FROM users WHERE user_id = ?',
      [userId]
    );

    if (!user || user.length === 0) {
      throw new Error('User not found');
    }

    if (user[0].role_id !== 7) {
      throw new Error('User is not a patient');
    }

    await connection.beginTransaction();

    try {
      // 1. Update user role
      await connection.query(
        'UPDATE users SET role_id = ? WHERE user_id = ?',
        [roleId, userId]
      );

      // 2. Create or update staff record
      const [staffRecord] = await connection.query(
        'SELECT staff_id FROM staff WHERE user_id = ?',
        [userId]
      );

      if (!staffRecord || staffRecord.length === 0) {
        await connection.query(
          `INSERT INTO staff (user_id, department_id, first_name, last_name, created_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [userId, departmentId, firstName, lastName]
        );
      } else {
        await connection.query(
          'UPDATE staff SET department_id = ? WHERE user_id = ?',
          [departmentId, userId]
        );
      }

      await connection.commit();
      return { success: true, message: 'Patient converted to staff successfully' };
    } catch (txError) {
      await connection.rollback();
      throw txError;
    }
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error('Error converting patient to staff:', errorMsg);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}
