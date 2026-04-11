import db from '@/lib/db';
import { getUserId } from './auth';

/**
 * RECEPTIONIST SERVICE - Department & Role-based data access
 * Receptionist (role_id = 4) can:
 * - Register patients in assigned departments only
 * - Schedule appointments for doctors in assigned departments
 * - Manage appointments in assigned departments
 * - View patients in assigned departments
 * - Cannot access medical/diagnostic data
 */

/**
 * Check receptionist role (role_id = 4) and get user ID
 * Returns: { userId, roleId }
 */
async function checkReceptionistAccess(connection) {
  try {
    let userId;
    try {
      userId = await getUserId();
    } catch (authError) {
      console.error('Auth error in checkReceptionistAccess:', authError);
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
    
    // Allow RECEPTIONIST (role_id = 4) and ADMIN (role_id = 1)
    if (roleId !== 4 && roleId !== 1) {
      throw new Error(`Access Denied: Required role RECEPTIONIST (4) or ADMIN (1), got ${roleId}`);
    }

    return { userId, roleId };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error in RBAC check';
    console.error('RBAC Check error:', errorMsg);
    throw new Error(`RBAC Check Failed: ${errorMsg}`);
  }
}

/**
 * Get all departments assigned to this receptionist
 * Returns array of department_ids
 */
async function getReceptionistDepartments(userId, connection) {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    // Get receptionist's assigned departments from staff table
    const [departments] = await connection.query(
      `SELECT DISTINCT department_id FROM staff WHERE user_id = ? AND status = 'Active'`,
      [userId]
    );

    if (!departments || departments.length === 0) {
      throw new Error(`Receptionist (user_id=${userId}) has no assigned active departments. Please contact admin to assign departments.`);
    }

    return departments.map(d => d.department_id);
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error(`Failed to fetch receptionist departments for user ${userId}:`, errorMsg);
    throw new Error(`Department access error: ${errorMsg}`);
  }
}

/**
 * Find or create user by email
 * If email exists: returns existing user_id
 * If email doesn't exist: creates new user with role PATIENT (role_id=7)
 * Returns: user_id
 */
async function findOrCreateUserByEmail(email, connection) {
  try {
    if (!email) {
      throw new Error('Email is required');
    }

    // Check if user exists with this email
    const [existingUsers] = await connection.query(
      `SELECT user_id, role_id FROM users WHERE email = ?`,
      [email]
    );

    if (existingUsers && existingUsers.length > 0) {
      const user = existingUsers[0];
      
      // Verify the user has patient role (role_id = 7)
      if (user.role_id !== 7) {
        const roleNames = {
          1: 'Admin',
          2: 'Doctor',
          3: 'Nurse',
          4: 'Receptionist',
          5: 'Pharmacist',
          6: 'Finance Officer',
          7: 'Patient'
        };
        const roleName = roleNames[user.role_id] || 'Unknown Role';
        throw new Error(`This email belongs to a ${roleName}. Only patient emails can be used for patient registration.`);
      }
      
      console.log(`Patient user found with email: ${email}, user_id: ${user.user_id}`);
      return user.user_id;
    }

    // User doesn't exist, create new one with PATIENT role (role_id=7)
    // clerk_user_id will be NULL for users created via patient registration
    const [insertResult] = await connection.query(
      `INSERT INTO users (email, role_id, clerk_user_id, is_active, created_at, updated_at)
       VALUES (?, 7, NULL, TRUE, NOW(), NOW())`,
      [email]
    );

    const newUserId = insertResult.insertId;
    console.log(`New patient user created with email: ${email}, user_id: ${newUserId}`);

    return newUserId;
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error(`Failed to find or create user by email ${email}:`, errorMsg);
    throw new Error(`User lookup/creation failed: ${errorMsg}`);
  }
}

export async function getDashboardStats() {
  let connection;
  try {
    connection = await db.getConnection();
    const { userId, roleId } = await checkReceptionistAccess(connection);
    
    const todayDate = new Date().toISOString().split('T')[0];
    const departmentIds = await getReceptionistDepartments(userId, connection);
    const deptPlaceholders = departmentIds.map(() => '?').join(',');

    // Today's appointments (department-filtered)
    const [todayAppointments] = await connection.query(
      `SELECT COUNT(*) as count 
        FROM appointments 
        WHERE appointment_date = ? 
        AND department_id IN (${deptPlaceholders})
        AND status != 'Cancelled'`,
      [todayDate, ...departmentIds]
    );

    // Total patients in assigned departments
    const [totalPatients] = await connection.query(
      `SELECT COUNT(*) as count 
        FROM patients 
        WHERE is_active = TRUE
        AND department_id IN (${deptPlaceholders})`,
      [...departmentIds]
    );

    // Scheduled appointments in assigned departments
    const [scheduledAppointments] = await connection.query(
      `SELECT COUNT(*) as count 
        FROM appointments 
        WHERE status = 'Scheduled'
        AND department_id IN (${deptPlaceholders})`,
      [...departmentIds]
    );

    // Completed today in assigned departments
    const [completedToday] = await connection.query(
      `SELECT COUNT(*) as count 
        FROM appointments 
        WHERE appointment_date = ? 
        AND status = 'Completed'
        AND department_id IN (${deptPlaceholders})`,
      [todayDate, ...departmentIds]
    );

    return {
      todayAppointmentsCount: todayAppointments[0]?.count || 0,
      totalPatientsCount: totalPatients[0]?.count || 0,
      scheduledAppointmentsCount: scheduledAppointments[0]?.count || 0,
      completedTodayCount: completedToday[0]?.count || 0,
    };
  } catch (error) {
    throw new Error(`Failed to fetch dashboard stats: ${error.message}`);
  } finally {
    if (connection) connection.release();
  }
}

export async function getTodayAppointments() {
  let connection;
  try {
    connection = await db.getConnection();
    const { userId } = await checkReceptionistAccess(connection);
    const departmentIds = await getReceptionistDepartments(userId, connection);
    const deptPlaceholders = departmentIds.map(() => '?').join(',');

    const todayDate = new Date().toISOString().split('T')[0];

    const [appointments] = await connection.query(
      `SELECT 
          a.appointment_id,
          a.appointment_time,
          a.status,
          a.reason_for_visit,
          p.patient_id,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.phone_number as patient_phone,
          s.first_name as doctor_first_name,
          s.last_name as doctor_last_name,
          d.specialization,
          d.consultation_fee,
          a.department_id
        FROM appointments a
        JOIN patients p ON a.patient_id = p.patient_id
        JOIN doctors d ON a.doctor_id = d.doctor_id
        JOIN staff s ON d.staff_id = s.staff_id
        WHERE a.appointment_date = ?
        AND a.department_id IN (${deptPlaceholders})
        ORDER BY a.appointment_time ASC`,
      [todayDate, ...departmentIds]
    );

    return appointments || [];
  } catch (error) {
    throw new Error(`Failed to fetch today appointments: ${error.message}`);
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get all appointments (not just today) for receptionist's departments
 * Used by appointments page for full list with date/status filtering
 */
export async function getAllAppointments() {
  let connection;
  try {
    connection = await db.getConnection();
    const { userId } = await checkReceptionistAccess(connection);
    const departmentIds = await getReceptionistDepartments(userId, connection);
    const deptPlaceholders = departmentIds.map(() => '?').join(',');

    const [appointments] = await connection.query(
      `SELECT 
          a.appointment_id,
          a.appointment_date,
          a.appointment_time,
          a.duration_minutes,
          a.status,
          a.reason_for_visit,
          a.doctor_id,
          p.patient_id,
          p.mrn,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.phone_number as patient_phone,
          CONCAT(p.first_name, ' ', p.last_name) as patient_name,
          s.first_name as doctor_first_name,
          s.last_name as doctor_last_name,
          CONCAT(s.first_name, ' ', s.last_name) as doctor_name,
          d.specialization,
          d.consultation_fee,
          a.department_id
        FROM appointments a
        JOIN patients p ON a.patient_id = p.patient_id
        JOIN doctors d ON a.doctor_id = d.doctor_id
        JOIN staff s ON d.staff_id = s.staff_id
        WHERE a.department_id IN (${deptPlaceholders})
        ORDER BY a.appointment_date DESC, a.appointment_time ASC`,
      [...departmentIds]
    );

    return appointments || [];
  } catch (error) {
    throw new Error(`Failed to fetch all appointments: ${error.message}`);
  } finally {
    if (connection) connection.release();
  }
}

export async function getPatientsList(limit = 50, offset = 0) {
  let connection;
  try {
    connection = await db.getConnection();
    const { userId } = await checkReceptionistAccess(connection);
    const departmentIds = await getReceptionistDepartments(userId, connection);
    const deptPlaceholders = departmentIds.map(() => '?').join(',');

    const [patients] = await connection.query(
      `SELECT 
          p.patient_id,
          p.mrn,
          p.first_name,
          p.last_name,
          p.email,
          p.phone_number,
          p.date_of_birth,
          p.gender,
          p.blood_type,
          p.address,
          p.city,
          p.emergency_contact,
          p.emergency_phone,
          p.is_active,
          p.department_id
        FROM patients p
        WHERE p.is_active = TRUE
        AND p.department_id IN (${deptPlaceholders})
        ORDER BY p.patient_id DESC
        LIMIT ? OFFSET ?`,
      [...departmentIds, limit, offset]
    );

    return patients || [];
  } catch (error) {
    throw new Error(`Failed to fetch patients list: ${error.message}`);
  } finally {
    if (connection) connection.release();
  }
}

export async function searchPatients(searchTerm) {
  let connection;
  try {
    connection = await db.getConnection();
    const { userId } = await checkReceptionistAccess(connection);
    const departmentIds = await getReceptionistDepartments(userId, connection);
    const deptPlaceholders = departmentIds.map(() => '?').join(',');

    const searchPattern = `%${searchTerm}%`;
    
    const [patients] = await connection.query(
      `SELECT 
          p.patient_id,
          p.mrn,
          p.first_name,
          p.last_name,
          p.email,
          p.phone_number,
          p.date_of_birth,
          p.gender,
          p.blood_type,
          p.address,
          p.city,
          p.department_id
        FROM patients p
        WHERE (p.first_name LIKE ? 
          OR p.last_name LIKE ? 
          OR p.mrn LIKE ?
          OR p.email LIKE ?)
        AND p.department_id IN (${deptPlaceholders})
        ORDER BY p.first_name ASC
        LIMIT 20`,
      [searchPattern, searchPattern, searchPattern, searchPattern, ...departmentIds]
    );

    return patients || [];
  } catch (error) {
    throw new Error(`Failed to search patients: ${error.message}`);
  } finally {
    if (connection) connection.release();
  }
}

export async function getPatientById(patientId) {
  let connection;
  try {
    connection = await db.getConnection();
    const { userId } = await checkReceptionistAccess(connection);
    const departmentIds = await getReceptionistDepartments(userId, connection);
    const deptPlaceholders = departmentIds.map(() => '?').join(',');

    const [patient] = await connection.query(
      `SELECT * FROM patients 
       WHERE patient_id = ?
       AND department_id IN (${deptPlaceholders})`,
      [patientId, ...departmentIds]
    );

    if (!patient.length) {
      throw new Error('Patient not found or not in your department');
    }

    return patient[0] || null;
  } catch (error) {
    throw new Error(`Failed to fetch patient: ${error.message}`);
  } finally {
    if (connection) connection.release();
  }
}

export async function getAvailableDoctors() {
  let connection;
  try {
    connection = await db.getConnection();
    const { userId } = await checkReceptionistAccess(connection);
    const departmentIds = await getReceptionistDepartments(userId, connection);
    const deptPlaceholders = departmentIds.map(() => '?').join(',');

    const [doctors] = await connection.query(
      `SELECT 
          d.doctor_id,
          d.specialization,
          d.consultation_fee,
          d.max_appointments_per_day,
          s.first_name,
          s.last_name,
          s.employee_id,
          s.status,
          s.department_id
        FROM doctors d
        JOIN staff s ON d.staff_id = s.staff_id
        WHERE s.status = 'Active'
        AND s.department_id IN (${deptPlaceholders})
        ORDER BY d.specialization ASC`,
      [...departmentIds]
    );

    return doctors || [];
  } catch (error) {
    throw new Error(`Failed to fetch doctors: ${error.message}`);
  } finally {
    if (connection) connection.release();
  }
}

export async function getDoctorAvailability(doctorId, dayOfWeek) {
  let connection;
  try {
    connection = await db.getConnection();
    const { userId } = await checkReceptionistAccess(connection);
    const departmentIds = await getReceptionistDepartments(userId, connection);
    const deptPlaceholders = departmentIds.map(() => '?').join(',');

    // Verify doctor is in receptionist's department
    const [doctorCheck] = await connection.query(
      `SELECT s.department_id FROM doctors d
       JOIN staff s ON d.staff_id = s.staff_id
       WHERE d.doctor_id = ?
       AND s.department_id IN (${deptPlaceholders})`,
      [doctorId, ...departmentIds]
    );

    if (!doctorCheck.length) {
      throw new Error('Doctor not in your department');
    }

    const [availability] = await connection.query(
      `SELECT * FROM doctor_availability 
       WHERE doctor_id = ? AND day_of_week = ?`,
      [doctorId, dayOfWeek]
    );

    return availability[0] || null;
  } catch (error) {
    throw new Error(`Failed to fetch doctor availability: ${error.message}`);
  } finally {
    if (connection) connection.release();
  }
}

export async function createPatient(patientData) {
  let connection;
  try {
    connection = await db.getConnection();
    const { userId } = await checkReceptionistAccess(connection);
    const departmentIds = await getReceptionistDepartments(userId, connection);

    // Verify receptionist can register in the requested department
    const departmentId = patientData.department_id || departmentIds[0];
    if (!departmentIds.includes(departmentId)) {
      throw new Error('Cannot register patient in this department - not assigned to you');
    }

    // Find or create user by email
    let patientUserId = null;
    if (patientData.email) {
      patientUserId = await findOrCreateUserByEmail(patientData.email, connection);
      console.log(`Patient will be linked to user_id: ${patientUserId}`);
    }

    const mrn = 'MRN-' + Date.now();

    const [result] = await connection.query(
      `INSERT INTO patients (
        user_id,
        mrn,
        first_name,
        last_name,
        date_of_birth,
        gender,
        blood_type,
        phone_number,
        email,
        address,
        city,
        emergency_contact,
        emergency_phone,
        department_id,
        is_active,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?)`,
      [
        patientUserId,
        mrn,
        patientData.first_name,
        patientData.last_name,
        patientData.date_of_birth,
        patientData.gender,
        patientData.blood_type || null,
        patientData.phone_number,
        patientData.email || null,
        patientData.address || null,
        patientData.city || null,
        patientData.emergency_contact || null,
        patientData.emergency_phone || null,
        departmentId,
        userId
      ]
    );

    return { success: true, mrn: mrn, user_id: patientUserId };
  } catch (error) {
    throw new Error(`Failed to create patient: ${error.message}`);
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Update existing patient with optional user email change
 * If email changes, find or create new user and link to patient
 * Returns: updated patient data
 */
export async function updatePatient(patientId, patientData) {
  let connection;
  try {
    connection = await db.getConnection();
    const { userId } = await checkReceptionistAccess(connection);
    const departmentIds = await getReceptionistDepartments(userId, connection);

    // Get current patient to verify access
    const [currentPatient] = await connection.query(
      `SELECT * FROM patients WHERE patient_id = ? AND department_id IN (${departmentIds.map(() => '?').join(',')})`,
      [patientId, ...departmentIds]
    );

    if (!currentPatient.length) {
      throw new Error('Patient not found or not in your department');
    }

    const patient = currentPatient[0];

    // Handle user email change with find-or-create logic
    let newUserId = patient.user_id;
    if (patientData.email && patientData.email !== patient.email) {
      newUserId = await findOrCreateUserByEmail(patientData.email, connection);
      console.log(`Email changed from ${patient.email} to ${patientData.email}, linked to user_id: ${newUserId}`);
    }

    // Update patient record
    await connection.query(
      `UPDATE patients SET 
        first_name = ?,
        last_name = ?,
        date_of_birth = ?,
        gender = ?,
        blood_type = ?,
        phone_number = ?,
        email = ?,
        address = ?,
        city = ?,
        emergency_contact = ?,
        emergency_phone = ?,
        user_id = ?,
        updated_by = ?,
        updated_at = NOW()
      WHERE patient_id = ?`,
      [
        patientData.first_name || patient.first_name,
        patientData.last_name || patient.last_name,
        patientData.date_of_birth || patient.date_of_birth,
        patientData.gender || patient.gender,
        patientData.blood_type || patient.blood_type,
        patientData.phone_number || patient.phone_number,
        patientData.email || patient.email,
        patientData.address || patient.address,
        patientData.city || patient.city,
        patientData.emergency_contact || patient.emergency_contact,
        patientData.emergency_phone || patient.emergency_phone,
        newUserId,
        userId,
        patientId
      ]
    );

    // Return updated patient
    const [updatedPatient] = await connection.query(
      `SELECT * FROM patients WHERE patient_id = ?`,
      [patientId]
    );

    return updatedPatient[0] || null;
  } catch (error) {
    throw new Error(`Failed to update patient: ${error.message}`);
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get all doctors for a specific department including their staff details
 */
export async function getDoctorsForDepartment(departmentId) {
  let connection;
  try {
    connection = await db.getConnection();

    const [doctors] = await connection.query(
      `SELECT 
        d.doctor_id,
        d.staff_id,
        d.specialization,
        d.consultation_fee,
        s.first_name as staff_first_name,
        s.last_name as staff_last_name,
        s.employee_id,
        dep.department_name
      FROM doctors d
      JOIN staff s ON d.staff_id = s.staff_id
      JOIN departments dep ON s.department_id = dep.department_id
      WHERE s.department_id = ? 
      AND s.status = 'Active'
      ORDER BY s.first_name, s.last_name`,
      [departmentId]
    );

    return doctors;
  } catch (error) {
    throw new Error(`Failed to fetch doctors for department: ${error.message}`);
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get available time slots for a doctor on a specific date
 * Generates 30-minute slots based on doctor's availability and existing appointments
 */
export async function getAvailableTimeSlots(doctorId, appointmentDate) {
  let connection;
  try {
    connection = await db.getConnection();

    // Get doctor's availability for the day of week
    const dayOfWeek = new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'long' });

    const [availability] = await connection.query(
      `SELECT shift_start_time, shift_end_time
       FROM doctor_availability
       WHERE doctor_id = ? AND day_of_week = ? AND is_working = true`,
      [doctorId, dayOfWeek]
    );

    if (!availability.length) {
      return []; // Doctor not available on this day
    }

    const { shift_start_time, shift_end_time } = availability[0];

    // Get booked appointments for this doctor on this date
    const [bookedSlots] = await connection.query(
      `SELECT appointment_time
       FROM appointments
       WHERE doctor_id = ? 
       AND appointment_date = ? 
       AND status != 'Cancelled'
       AND is_deleted = false`,
      [doctorId, appointmentDate]
    );

    const bookedTimes = new Set(bookedSlots.map(slot => slot.appointment_time));

    // Generate 30-minute slots between shift times
    const slots = [];
    const [startHours, startMin] = shift_start_time.split(':').map(Number);
    const [endHours, endMin] = shift_end_time.split(':').map(Number);

    let currentHours = startHours;
    let currentMin = startMin;
    const endTotalMin = endHours * 60 + endMin;

    while (currentHours * 60 + currentMin < endTotalMin) {
      const timeStr = `${String(currentHours).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}:00`;
      
      // Only add if not already booked
      if (!bookedTimes.has(timeStr)) {
        slots.push(timeStr.substring(0, 5)); // Return HH:MM format
      }

      currentMin += 30;
      if (currentMin >= 60) {
        currentMin -= 60;
        currentHours += 1;
      }
    }

    return slots;
  } catch (error) {
    throw new Error(`Failed to fetch available time slots: ${error.message}`);
  } finally {
    if (connection) connection.release();
  }
}

export async function scheduleAppointment(appointmentData) {
  let connection;
  try {
    connection = await db.getConnection();
    const { userId } = await checkReceptionistAccess(connection);
    const departmentIds = await getReceptionistDepartments(userId, connection);
    const deptPlaceholders = departmentIds.map(() => '?').join(',');

    // Verify patient exists in receptionist's department
    const [patientCheck] = await connection.query(
      `SELECT department_id FROM patients 
       WHERE patient_id = ?
       AND department_id IN (${deptPlaceholders})`,
      [appointmentData.patient_id, ...departmentIds]
    );

    if (!patientCheck.length) {
      throw new Error('Patient not found in your department');
    }

    // Verify doctor exists in receptionist's department
    const [doctorCheck] = await connection.query(
      `SELECT s.department_id FROM doctors d
       JOIN staff s ON d.staff_id = s.staff_id
       WHERE d.doctor_id = ?
       AND s.department_id IN (${deptPlaceholders})`,
      [appointmentData.doctor_id, ...departmentIds]
    );

    if (!doctorCheck.length) {
      throw new Error('Doctor not found in your department');
    }

    const departmentId = patientCheck[0].department_id;

    await connection.query(
      `INSERT INTO appointments (
        patient_id,
        doctor_id,
        department_id,
        appointment_date,
        appointment_time,
        duration_minutes,
        status,
        reason_for_visit,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        appointmentData.patient_id,
        appointmentData.doctor_id,
        departmentId,
        appointmentData.appointment_date,
        appointmentData.appointment_time,
        appointmentData.duration_minutes || 30,
        'Scheduled',
        appointmentData.reason_for_visit || null,
        userId
      ]
    );

    return { success: true, message: 'Appointment scheduled successfully' };
  } catch (error) {
    throw new Error(`Failed to schedule appointment: ${error.message}`);
  } finally {
    if (connection) connection.release();
  }
}
