import db from '@/lib/db';
import { getUserId } from './auth';

/**
 * DOCTOR SERVICE - Role & Department-based data access
 * Doctor (role_id = 2) can ONLY:
 * - View their own appointments
 * - View their own patients
 * - View their own encounters
 * - Access doctors in their department (colleagues)
 * - Update only their phone_number in profile
 * - Cannot access other doctors' data or department's admin settings
 */

/**
 * Check doctor role (role_id = 2) and get doctor_id
 * Returns: { userId, roleId, doctorId, departmentId }
 */
async function checkDoctorAccess(connection) {
  try {
    let userId;
    try {
      userId = await getUserId();
    } catch (authError) {
      console.error('Auth error in checkDoctorAccess:', authError);
      throw new Error(`Authentication failed: ${authError?.message || String(authError)}`);
    }

    if (!userId) {
      throw new Error('No user ID obtained from authentication');
    }
    
    // Query user role from database
    const [userRows] = await connection.query(
      `SELECT role_id FROM users WHERE user_id = ?`,
      [userId]
    );

    if (!userRows.length) {
      throw new Error(`User ${userId} not found in database`);
    }

    const roleId = userRows[0].role_id;
    
    // Allow DOCTOR (role_id = 2) and ADMIN (role_id = 1)
    if (roleId !== 2 && roleId !== 1) {
      throw new Error(`Access Denied: Required role DOCTOR (2) or ADMIN (1), got ${roleId}`);
    }

    // Get doctor info: doctors -> staff -> department
    const [doctorRows] = await connection.query(
      `SELECT d.doctor_id, s.department_id 
       FROM doctors d
       JOIN staff s ON d.staff_id = s.staff_id
       WHERE s.user_id = ?`,
      [userId]
    );

    if (!doctorRows.length) {
      throw new Error(`Doctor profile not found for user ${userId}. Admin must create doctor profile.`);
    }

    const doctorId = doctorRows[0].doctor_id;
    const departmentId = doctorRows[0].department_id;

    return { userId, roleId, doctorId, departmentId };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error in RBAC check';
    console.error('RBAC Check error:', errorMsg);
    throw new Error(`RBAC Check Failed: ${errorMsg}`);
  }
}

/**
 * Get doctor's own appointments
 * Doctor can ONLY see their own appointments
 */
export async function getDoctorAppointments() {
  try {
    let connection;
    try {
      connection = await db.getConnection();
    } catch (dbError) {
      throw new Error(`Database connection failed: ${dbError?.message || String(dbError)}`);
    }

    // RBAC check - verify doctor role and get doctor_id
    let authDoctorId;
    try {
      const access = await checkDoctorAccess(connection);
      authDoctorId = access.doctorId;
    } catch (authError) {
      throw authError;
    }

    // Get appointments for this specific doctor
    const [appointments] = await connection.query(
      `SELECT 
        a.appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.duration_minutes,
        a.status,
        a.reason_for_visit,
        a.notes,
        a.patient_id,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.mrn,
        d.doctor_id,
        s.first_name as doctor_first_name,
        s.last_name as doctor_last_name,
        dept.department_name
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.doctor_id
      JOIN staff s ON d.staff_id = s.staff_id
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN departments dept ON s.department_id = dept.department_id
      WHERE a.doctor_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [authDoctorId]
    );

    connection.release();
    return appointments || [];
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error(`Failed to fetch doctor appointments:`, errorMsg);
    throw new Error(`Appointment retrieval failed: ${errorMsg}`);
  }
}

/**
 * Get doctor's own patients (from their department)
 * Doctor can ONLY see patients registered to their department
 */
export async function getDoctorPatients() {
  try {
    let connection;
    try {
      connection = await db.getConnection();
    } catch (dbError) {
      throw new Error(`Database connection failed: ${dbError?.message || String(dbError)}`);
    }

    const access = await checkDoctorAccess(connection);

    // Department-based access control: Doctor sees all patients in their department
    const [patients] = await connection.query(
      `SELECT DISTINCT
        p.patient_id,
        p.user_id,
        p.first_name,
        p.last_name,
        p.mrn,
        p.date_of_birth,
        p.gender,
        p.phone_number,
        p.email,
        p.address,
        p.city,
        p.emergency_contact,
        p.emergency_phone
      FROM patients p
      WHERE p.department_id = ? AND p.is_deleted = FALSE
      ORDER BY p.first_name, p.last_name`,
      [access.departmentId]
    );

    connection.release();
    return patients || [];
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error(`Failed to fetch doctor patients:`, errorMsg);
    throw new Error(`Patient retrieval failed: ${errorMsg}`);
  }
}

/**
 * Get doctor's own encounters
 * Doctor can ONLY see encounters for their own patients
 */
export async function getDoctorEncounters() {
  try {
    let connection;
    try {
      connection = await db.getConnection();
    } catch (dbError) {
      throw new Error(`Database connection failed: ${dbError?.message || String(dbError)}`);
    }

    const access = await checkDoctorAccess(connection);

    const [encounters] = await connection.query(
      `SELECT 
        e.encounter_id,
        e.patient_id,
        e.doctor_id,
        e.encounter_type,
        e.admission_date,
        e.discharge_date,
        e.status,
        e.chief_complaint,
        e.created_at,
        e.updated_at,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.mrn
      FROM encounters e
      JOIN patients p ON e.patient_id = p.patient_id
      WHERE e.doctor_id = ?
      ORDER BY e.admission_date DESC`,
      [access.doctorId]
    );

    connection.release();
    return encounters || [];
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error(`Failed to fetch doctor encounters:`, errorMsg);
    throw new Error(`Encounter retrieval failed: ${errorMsg}`);
  }
}

/**
 * Get doctor's own schedule
 */
export async function getDoctorSchedule() {
  try {
    let connection;
    try {
      connection = await db.getConnection();
    } catch (dbError) {
      throw new Error(`Database connection failed: ${dbError?.message || String(dbError)}`);
    }

    const access = await checkDoctorAccess(connection);

    const [schedule] = await connection.query(
      `SELECT 
        availability_id,
        day_of_week,
        TIME_FORMAT(shift_start_time, '%H:%i') AS shift_start_time,
        TIME_FORMAT(shift_end_time, '%H:%i') AS shift_end_time,
        is_working
      FROM doctor_availability
      WHERE doctor_id = ?
      ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')`,
      [access.doctorId]
    );

    connection.release();
    return schedule || [];
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error(`Failed to fetch doctor schedule:`, errorMsg);
    throw new Error(`Schedule retrieval failed: ${errorMsg}`);
  }
}

/**
 * Update doctor's schedule
 * Doctor can ONLY update their own schedule
 */
export async function updateDoctorSchedule(scheduleData) {
  try {
    let connection;
    try {
      connection = await db.getConnection();
    } catch (dbError) {
      throw new Error(`Database connection failed: ${dbError?.message || String(dbError)}`);
    }

    const access = await checkDoctorAccess(connection);

    // Start transaction
    await connection.beginTransaction();

    try {
      for (const item of scheduleData) {
        const { availability_id, shift_start_time, shift_end_time, is_working } = item;

        // Validate input
        if (!availability_id || !shift_start_time || !shift_end_time === undefined) {
          throw new Error('Missing required schedule fields');
        }

        // Update the schedule
        await connection.query(
          `UPDATE doctor_availability 
           SET shift_start_time = ?, 
               shift_end_time = ?,
               is_working = ?,
               updated_at = NOW()
           WHERE availability_id = ? AND doctor_id = ?`,
          [shift_start_time, shift_end_time, is_working, availability_id, access.doctorId]
        );
      }

      // Commit transaction
      await connection.commit();

      // Fetch updated schedule
      const [schedule] = await connection.query(
        `SELECT 
          availability_id,
          day_of_week,
          TIME_FORMAT(shift_start_time, '%H:%i') AS shift_start_time,
          TIME_FORMAT(shift_end_time, '%H:%i') AS shift_end_time,
          is_working
        FROM doctor_availability
        WHERE doctor_id = ?
        ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')`,
        [access.doctorId]
      );

      connection.release();
      return schedule || [];
    } catch (txErr) {
      await connection.rollback();
      throw txErr;
    }
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error(`Failed to update doctor schedule:`, errorMsg);
    throw new Error(`Schedule update failed: ${errorMsg}`);
  }
}

/**
 * Get doctor's own profile
 */
export async function getDoctorProfile() {
  try {
    let connection;
    try {
      connection = await db.getConnection();
    } catch (dbError) {
      throw new Error(`Database connection failed: ${dbError?.message || String(dbError)}`);
    }

    const access = await checkDoctorAccess(connection);

    const [result] = await connection.query(
      `SELECT 
        d.doctor_id,
        d.first_name,
        d.last_name,
        d.email,
        d.phone_number,
        d.specialization,
        d.consultation_fee,
        d.status,
        d.license_number,
        d.employee_id,
        dept.department_name
      FROM doctors d
      LEFT JOIN departments dept ON d.department_id = dept.department_id
      WHERE d.doctor_id = ?`,
      [access.doctorId]
    );

    connection.release();

    if (!result || result.length === 0) {
      throw new Error('Doctor profile not found');
    }

    return result[0];
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error(`Failed to fetch doctor profile:`, errorMsg);
    throw new Error(`Profile retrieval failed: ${errorMsg}`);
  }
}

/**
 * Update doctor's phone number only
 * Doctor can ONLY update their own profile
 */
export async function updateDoctorPhone(phoneNumber) {
  try {
    let connection;
    try {
      connection = await db.getConnection();
    } catch (dbError) {
      throw new Error(`Database connection failed: ${dbError?.message || String(dbError)}`);
    }

    const access = await checkDoctorAccess(connection);

    const [result] = await connection.query(
      `UPDATE doctors SET phone_number = ? WHERE doctor_id = ?`,
      [phoneNumber, access.doctorId]
    );

    connection.release();
    return { success: true };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error(`Failed to update doctor profile:`, errorMsg);
    throw new Error(`Profile update failed: ${errorMsg}`);
  }
}

/**
 * Get colleagues (other doctors in same department)
 * Doctor can see ALL doctors in their department (not just their own data)
 */
export async function getDoctorColleagues() {
  try {
    let connection;
    try {
      connection = await db.getConnection();
    } catch (dbError) {
      throw new Error(`Database connection failed: ${dbError?.message || String(dbError)}`);
    }

    const access = await checkDoctorAccess(connection);

    // Get all doctors in the same department (excluding current doctor)
    const [colleagues] = await connection.query(
      `SELECT 
        d.doctor_id,
        d.first_name,
        d.last_name,
        d.email,
        d.phone_number,
        d.specialization,
        d.status,
        d.consultation_fee,
        dept.department_name
      FROM doctors d
      JOIN departments dept ON d.department_id = dept.department_id
      WHERE d.department_id = ? AND d.doctor_id != ?
      ORDER BY d.first_name, d.last_name`,
      [access.departmentId, access.doctorId]
    );

    connection.release();
    return colleagues || [];
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error(`Failed to fetch doctor colleagues:`, errorMsg);
    throw new Error(`Colleagues retrieval failed: ${errorMsg}`);
  }
}

/**
 * Get dashboard stats for doctor
 */
export async function getDoctorDashboardStats() {
  try {
    let connection;
    try {
      connection = await db.getConnection();
    } catch (dbError) {
      throw new Error(`Database connection failed: ${dbError?.message || String(dbError)}`);
    }

    const access = await checkDoctorAccess(connection);

    // Get today's appointments for this doctor
    const [todayAppts] = await connection.query(
      `SELECT COUNT(*) as count FROM appointments 
       WHERE doctor_id = ? AND DATE(appointment_date) = CURDATE()`,
      [access.doctorId]
    );

    // Get completed appointments today for this doctor
    const [completedToday] = await connection.query(
      `SELECT COUNT(*) as count FROM appointments 
       WHERE doctor_id = ? AND DATE(appointment_date) = CURDATE() AND status = 'Completed'`,
      [access.doctorId]
    );

    // Get total patients in doctor's department (RBAC: department-based)
    const [totalPatients] = await connection.query(
      `SELECT COUNT(*) as count FROM patients 
       WHERE department_id = ? AND is_deleted = FALSE`,
      [access.departmentId]
    );

    // Get pending appointments for this doctor
    const [pending] = await connection.query(
      `SELECT COUNT(*) as count FROM appointments 
       WHERE doctor_id = ? AND status IN ('Scheduled', 'No Show')`,
      [access.doctorId]
    );

    // Get doctor name from staff table
    const [doctorInfo] = await connection.query(
      `SELECT s.first_name, s.last_name FROM doctors d
       JOIN staff s ON d.staff_id = s.staff_id
       WHERE d.doctor_id = ?`,
      [access.doctorId]
    );

    connection.release();

    return {
      doctor_name: doctorInfo[0]?.last_name || 'Doctor',
      todays_appointments: todayAppts[0]?.count || 0,
      completed_today: completedToday[0]?.count || 0,
      total_patients: totalPatients[0]?.count || 0,
      pending: pending[0]?.count || 0,
    };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    console.error(`Failed to fetch dashboard stats:`, errorMsg);
    throw new Error(`Dashboard stats failed: ${errorMsg}`);
  }
}
