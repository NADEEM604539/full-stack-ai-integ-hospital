import db from '@/lib/db';
import { checkPatientAccess } from '@/services/auth';

/**
 * PATIENT SERVICE - User-managed patient profiles
 * A single user (patient) can manage multiple patient profiles (e.g., themselves, family members)
 * 
 * Patient (role_id = 7) can ONLY:
 * - View/manage their own patient profiles
 * - View appointments for their patients
 * - View encounters for their patients
 * - View invoices for their patients
 * - Update their own patient profiles
 * - Register new patients (family members)
 * 
 * RBAC enforced: checkPatientAccess() ensures role_id = 7
 */

/**
 * Verify patient access to specific patient_id
 * Ensures the authenticated user owns this patient profile
 * @param {number} patientId - The patient to access
 * @returns {Promise<Object>} { userId, patientId, patient }
 */
async function verifyPatientAccess(patientId, connection) {
  try {
    const { userId } = await checkPatientAccess();

    // Get patient and verify ownership
    const [patients] = await connection.query(
      `SELECT 
        patient_id,
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
        created_at,
        is_deleted
       FROM patients
       WHERE patient_id = ? AND user_id = ? AND is_deleted = FALSE`,
      [patientId, userId]
    );

    if (!patients.length) {
      throw new Error(`Access Denied: Patient ${patientId} not found or does not belong to you.`);
    }

    return { userId, patientId, patient: patients[0] };
  } catch (error) {
    console.error('Error in verifyPatientAccess:', error.message);
    throw error;
  }
}

/**
 * Fetches all patient profiles managed by the currently logged-in user.
 * A single user can manage multiple patient profiles (e.g., family members).
 * RBAC: Secured by checkPatientAccess.
 * @returns {Promise<Array>} A list of patient objects.
 */
export async function getManagedPatients() {
  const { userId } = await checkPatientAccess();

  let connection;
  try {
    connection = await db.getConnection();
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
        d.department_name,
        p.created_at
       FROM patients p
       LEFT JOIN departments d ON p.department_id = d.department_id
       WHERE p.user_id = ? AND p.is_deleted = FALSE
       ORDER BY p.first_name, p.last_name`,
      [userId]
    );

    return patients;
  } catch (error) {
    console.error('Error fetching managed patients:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get specific patient profile with full details
 * RBAC: User can only access their own patients
 * @param {number} patientId - The patient to fetch
 * @returns {Promise<Object>} Full patient profile with department info
 */
export async function getPatientProfile(patientId) {
  console.log(`getPatientProfile() called for patientId: ${patientId}`);
  
  let authUserId;
  try {
    const { userId } = await checkPatientAccess();
    authUserId = userId;
    console.log(`getPatientProfile() - Auth successful, userId: ${userId}`);
  } catch (authError) {
    console.error(`getPatientProfile() - Auth failed:`, authError?.message);
    throw authError;
  }

  let connection;
  try {
    connection = await db.getConnection();
    console.log(`getPatientProfile() - Database connected`);

    // Single efficient query with access verification and department info
    const query = `SELECT 
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
      d.department_name,
      p.created_at
     FROM patients p
     LEFT JOIN departments d ON p.department_id = d.department_id
     WHERE p.patient_id = ? AND p.user_id = ? AND p.is_deleted = FALSE`;
    
    console.log(`getPatientProfile() - Executing query for patientId: ${patientId}, userId: ${authUserId}`);
    const [patients] = await connection.query(query, [patientId, authUserId]);
    console.log(`getPatientProfile() - Query executed, found ${patients?.length || 0} records`);

    if (!patients.length) {
      throw new Error(`Access Denied: Patient ${patientId} not found or does not belong to you.`);
    }

    console.log(`getPatientProfile() - Success, returning patient data`);
    return patients[0];
  } catch (error) {
    console.error(`getPatientProfile() - Error:`, {
      message: error?.message,
      patientId,
      authUserId,
    });
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get all appointments for a patient
 * RBAC: User can only access appointments for their owned patients
 * @param {number} patientId - The patient whose appointments to fetch
 * @returns {Promise<Array>} List of appointments
 */
export async function getPatientAppointments(patientId) {
  let connection;
  try {
    connection = await db.getConnection();
    const { userId } = await verifyPatientAccess(patientId, connection);

    const [appointments] = await connection.query(
      `SELECT 
        a.appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.duration_minutes,
        a.status,
        a.reason_for_visit,
        a.notes,
        a.satisfaction_rating,
        a.created_at,
        d.doctor_id,
        CONCAT(s.first_name, ' ', s.last_name) as doctor_name,
        dept.department_name
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.doctor_id
       JOIN staff s ON d.staff_id = s.staff_id
       JOIN departments dept ON a.department_id = dept.department_id
       WHERE a.patient_id = ? AND a.is_deleted = FALSE
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [patientId]
    );

    return appointments;
  } catch (error) {
    console.error('Error fetching patient appointments:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get all encounters (visits) for a patient
 * RBAC: User can only access encounters for their owned patients
 * @param {number} patientId - The patient whose encounters to fetch
 * @returns {Promise<Array>} List of encounters with clinical data
 */
export async function getPatientEncounters(patientId) {
  let connection;
  try {
    connection = await db.getConnection();
    const { userId } = await verifyPatientAccess(patientId, connection);

    const [encounters] = await connection.query(
      `SELECT 
        e.encounter_id,
        e.appointment_id,
        e.admission_date,
        e.discharge_date,
        e.encounter_type,
        e.chief_complaint,
        e.status,
        e.created_at,
        doc.doctor_id,
        CONCAT(s.first_name, ' ', s.last_name) as doctor_name,
        doc.specialization,
        dept.department_name
       FROM encounters e
       LEFT JOIN doctors doc ON e.doctor_id = doc.doctor_id
       LEFT JOIN staff s ON doc.staff_id = s.staff_id
       LEFT JOIN departments dept ON s.department_id = dept.department_id
       WHERE e.patient_id = ? AND e.is_deleted = FALSE
       ORDER BY e.admission_date DESC`,
      [patientId]
    );

    return encounters;
  } catch (error) {
    console.error('Error fetching patient encounters:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get all invoices for a patient
 * RBAC: User can only access invoices for their owned patients
 * @param {number} patientId - The patient whose invoices to fetch
 * @returns {Promise<Array>} List of invoices with payment status
 */
export async function getPatientInvoices(patientId) {
  let connection;
  try {
    connection = await db.getConnection();
    const { userId } = await verifyPatientAccess(patientId, connection);

    const [invoices] = await connection.query(
      `SELECT 
        inv.invoice_id,
        inv.invoice_date,
        inv.due_date,
        inv.subtotal,
        inv.tax_amount,
        inv.discount_amount,
        inv.total_amount,
        inv.amount_paid,
        inv.status,
        inv.created_at,
        (inv.total_amount - COALESCE(inv.amount_paid, 0)) as outstanding_balance,
        DATEDIFF(CURDATE(), inv.due_date) as days_overdue,
        p.patient_id,
        p.mrn,
        p.first_name,
        p.last_name,
        p.email,
        p.phone_number
       FROM invoices inv
       JOIN patients p ON inv.patient_id = p.patient_id
       WHERE inv.patient_id = ? AND inv.is_deleted = FALSE
       ORDER BY inv.invoice_date DESC`,
      [patientId]
    );

    return invoices;
  } catch (error) {
    console.error('Error fetching patient invoices:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Register a new patient (self or family member)
 * RBAC: Patient (role_id = 7) can register patients
 * @param {Object} patientData - Patient information
 * @returns {Promise<Object>} Created patient with patient_id
 */
export async function registerPatient(patientData) {
  const { userId } = await checkPatientAccess();

  let connection;
  try {
    connection = await db.getConnection();

    // Validate required fields
    const required = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'email', 'phoneNumber'];
    for (const field of required) {
      if (!patientData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Generate MRN if not provided
    const mrn = patientData.mrn || `MRN${Date.now()}`;

    // Insert patient
    const [result] = await connection.query(
      `INSERT INTO patients (
        user_id, mrn, first_name, last_name, date_of_birth, gender, 
        blood_type, phone_number, email, address, city,
        emergency_contact, emergency_phone, department_id, is_deleted, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, NOW())`,
      [
        userId,
        mrn,
        patientData.firstName,
        patientData.lastName,
        patientData.dateOfBirth,
        patientData.gender,
        patientData.bloodType || null,
        patientData.phoneNumber,
        patientData.email,
        patientData.address || null,
        patientData.city || null,
        patientData.emergencyContact || null,
        patientData.emergencyPhone || null,
        patientData.departmentId || null
      ]
    );

    return {
      patient_id: result.insertId,
      ...patientData,
      mrn,
      user_id: userId,
      created_at: new Date()
    };
  } catch (error) {
    console.error('Error registering patient:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Update patient profile
 * RBAC: User can only update their own patients
 * @param {number} patientId - The patient to update
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Updated patient
 */
export async function updatePatientProfile(patientId, updateData) {
  let connection;
  try {
    connection = await db.getConnection();
    const { userId } = await verifyPatientAccess(patientId, connection);

    // Build dynamic update query (only update provided fields)
    const allowedFields = [
      'first_name', 'last_name', 'phone_number', 'email', 'address', 'city', 
      'emergency_contact', 'emergency_phone', 'blood_type', 'department_id'
    ];

    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(snakeKey)) {
        fields.push(`${snakeKey} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(patientId);

    const [result] = await connection.query(
      `UPDATE patients SET ${fields.join(', ')}, updated_at = NOW() WHERE patient_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      throw new Error('Patient not found or no changes made');
    }

    // Fetch and return the updated patient data
    const [patients] = await connection.query(
      `SELECT 
        p.patient_id,
        p.mrn,
        p.user_id,
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
        d.department_name,
        p.created_at
       FROM patients p
       LEFT JOIN departments d ON p.department_id = d.department_id
       WHERE p.patient_id = ? AND p.is_deleted = FALSE`,
      [patientId]
    );

    if (!patients.length) {
      throw new Error('Patient not found');
    }

    return patients[0];
  } catch (error) {
    console.error('Error updating patient profile:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get full SOAP details for a specific encounter
 * RBAC: User can only access SOAP for their own patient's encounters
 * @param {number} patientId - The patient ID
 * @param {number} encounterId - The encounter ID
 * @returns {Promise<Object>} Full SOAP note with S, O, A, P components
 */
export async function getEncounterSOAP(patientId, encounterId) {
  const { userId } = await checkPatientAccess();

  let connection;
  try {
    connection = await db.getConnection();

    // Verify patient access and encounter belongs to patient
    const [encounter] = await connection.query(
      `SELECT e.encounter_id, e.patient_id, e.admission_date, e.discharge_date, 
              e.encounter_type, e.chief_complaint, e.status, e.doctor_id,
              CONCAT(s.first_name, ' ', s.last_name) as doctor_name,
              doc.specialization, dept.department_name
       FROM encounters e
       LEFT JOIN doctors doc ON e.doctor_id = doc.doctor_id
       LEFT JOIN staff s ON doc.staff_id = s.staff_id
       LEFT JOIN departments dept ON s.department_id = dept.department_id
       WHERE e.encounter_id = ? AND e.patient_id = ? AND e.is_deleted = FALSE`,
      [encounterId, patientId]
    );

    if (!encounter.length) {
      throw new Error('Encounter not found or access denied');
    }

    const enc = encounter[0];

    // Fetch SOAP components
    const [subjective] = await connection.query(
      `SELECT subjective_id, patient_complaint, symptom_duration, severity_level, 
              affecting_daily_activities, created_at
       FROM subjective_notes WHERE encounter_id = ?`,
      [encounterId]
    );

    const [objective] = await connection.query(
      `SELECT objective_id, physical_examination, lab_findings, imaging_results, 
              other_findings, created_at
       FROM objective_notes WHERE encounter_id = ?`,
      [encounterId]
    );

    const [assessment] = await connection.query(
      `SELECT assessment_id, primary_diagnosis, differential_diagnoses, clinical_reasoning,
              icd10_code, severity_level, ai_suggestion, ai_confidence, created_at
       FROM assessment_notes WHERE encounter_id = ?`,
      [encounterId]
    );

    const [plan] = await connection.query(
      `SELECT plan_id, treatment_plan, medication_plan, follow_up_plan, 
              patient_education, referrals, created_at
       FROM plan_notes WHERE encounter_id = ?`,
      [encounterId]
    );

    // Fetch vitals for this encounter
    const [vitals] = await connection.query(
      `SELECT vital_id, encounter_id, temperature_c, 
              blood_pressure_systolic, blood_pressure_diastolic, heart_rate, 
              oxygen_saturation, weight_kg, height_cm, ai_risk_score, ai_risk_category, recorded_at
       FROM vitals 
       WHERE encounter_id = ?
       ORDER BY recorded_at DESC`,
      [encounterId]
    );

    return {
      encounter: enc,
      subjective: subjective[0] || null,
      objective: objective[0] || null,
      assessment: assessment[0] || null,
      plan: plan[0] || null,
      vitals: vitals || [],
      soapComplete: subjective.length > 0 && objective.length > 0 && 
                    assessment.length > 0 && plan.length > 0
    };
  } catch (error) {
    console.error('Error fetching SOAP details:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Fetch vital signs for a patient
 * Returns latest and historical vital signs including:
 * - Blood pressure
 * - Heart rate
 * - Body temperature
 * - Respiratory rate
 * - Oxygen saturation
 * @param {number} patientId - The patient ID
 * @returns {Promise<Array>} Array of vitals sorted by recorded_at DESC
 */
export async function getPatientVitals(patientId) {
  const { userId } = await checkPatientAccess();

  let connection;
  try {
    connection = await db.getConnection();

    // Verify patient ownership
    const [patients] = await connection.query(
      `SELECT patient_id FROM patients 
       WHERE patient_id = ? AND user_id = ? AND is_deleted = FALSE`,
      [patientId, userId]
    );

    if (!patients.length) {
      throw new Error('Patient not found or access denied');
    }

    // Try to fetch vitals - if table doesn't exist, return empty array
    let vitals = [];
    try {
      const [vitalData] = await connection.query(
        `SELECT 
          v.vital_id,
          v.encounter_id,
          v.temperature_c,
          v.blood_pressure_systolic,
          v.blood_pressure_diastolic,
          v.heart_rate,
          v.oxygen_saturation,
          v.weight_kg,
          v.height_cm,
          v.ai_risk_score,
          v.recorded_at,
          e.encounter_type,
          e.admission_date,
          e.chief_complaint,
          CONCAT(s.first_name, ' ', s.last_name) as doctor_name
         FROM vitals v
         LEFT JOIN encounters e ON v.encounter_id = e.encounter_id
         LEFT JOIN doctors doc ON e.doctor_id = doc.doctor_id
         LEFT JOIN staff s ON doc.staff_id = s.staff_id
         WHERE v.encounter_id IN (
           SELECT encounter_id FROM encounters 
           WHERE patient_id = ? AND is_deleted = FALSE
         )
         ORDER BY v.recorded_at DESC
         LIMIT 50`,
        [patientId]
      );
      vitals = vitalData;
    } catch (dbErr) {
      // Table might not exist yet, return empty array
      console.log('Vitals table not found or query failed:', dbErr.message);
    }

    return vitals;
  } catch (error) {
    console.error('Error fetching patient vitals:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get available doctors for a patient's department
 * RBAC: Patient can only view doctors from their own department
 * @param {number} patientId - The patient requesting doctors
 * @returns {Promise<Array>} List of doctors in patient's department
 */
export async function getAvailableDoctors(patientId) {
  const { userId } = await checkPatientAccess();

  let connection;
  try {
    connection = await db.getConnection();

    // Get patient and verify ownership
    const [patients] = await connection.query(
      `SELECT patient_id, department_id FROM patients 
       WHERE patient_id = ? AND user_id = ? AND is_deleted = FALSE`,
      [patientId, userId]
    );

    if (!patients.length) {
      throw new Error('Patient not found or access denied');
    }

    const departmentId = patients[0].department_id;

    // Get active doctors in patient's department
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
    console.error('Error fetching available doctors:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get available time slots for a doctor on a specific date
 * Generates 30-minute slots based on doctor's availability
 * @param {number} doctorId - The doctor to check availability for
 * @param {string} appointmentDate - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} List of available time slots (HH:MM format)
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
    console.error('Error fetching available time slots:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Book an appointment for a patient
 * RBAC: Patient can only book appointments for their own patients
 * @param {number} patientId - The patient to book appointment for
 * @param {Object} appointmentData - Booking data (doctor_id, appointment_date, appointment_time, reason_for_visit)
 * @returns {Promise<Object>} Created appointment details
 */
export async function bookAppointment(patientId, appointmentData) {
  const { userId } = await checkPatientAccess();

  let connection;
  try {
    connection = await db.getConnection();

    // Verify patient access and ownership
    const [patients] = await connection.query(
      `SELECT patient_id, department_id FROM patients 
       WHERE patient_id = ? AND user_id = ? AND is_deleted = FALSE`,
      [patientId, userId]
    );

    if (!patients.length) {
      throw new Error('Patient not found or access denied');
    }

    const departmentId = patients[0].department_id;

    // Verify doctor exists and is in the patient's department
    const [doctorCheck] = await connection.query(
      `SELECT s.department_id FROM doctors d
       JOIN staff s ON d.staff_id = s.staff_id
       WHERE d.doctor_id = ? AND s.department_id = ?`,
      [appointmentData.doctor_id, departmentId]
    );

    if (!doctorCheck.length) {
      throw new Error('Doctor not found or not in your department');
    }

    // Insert the appointment
    const [result] = await connection.query(
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
        patientId,
        appointmentData.doctor_id,
        departmentId,
        appointmentData.appointment_date,
        appointmentData.appointment_time,
        appointmentData.duration_minutes || 30,
        'Scheduled',
        appointmentData.reason_for_visit || null,
        userId // Patient created the appointment
      ]
    );

    // Return the created appointment details
    const [appointment] = await connection.query(
      `SELECT 
        a.appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.reason_for_visit,
        CONCAT(s.first_name, ' ', s.last_name) as doctor_name,
        d.specialization,
        dept.department_name
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.doctor_id
       JOIN staff s ON d.staff_id = s.staff_id
       JOIN departments dept ON s.department_id = dept.department_id
       WHERE a.appointment_id = ?`,
      [result.insertId]
    );

    return appointment[0] || { success: true, appointment_id: result.insertId };
  } catch (error) {
    console.error('Error booking appointment:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get medical history for a patient
 * RBAC: Patient can only access their own medical history
 * @param {number} patientId - The patient whose medical history to fetch
 * @returns {Promise<Array>} List of medical history records
 */
export async function getPatientMedicalHistory(patientId) {
  const { userId } = await checkPatientAccess();

  let connection;
  try {
    connection = await db.getConnection();

    // Verify patient ownership
    const [patients] = await connection.query(
      `SELECT patient_id FROM patients 
       WHERE patient_id = ? AND user_id = ? AND is_deleted = FALSE`,
      [patientId, userId]
    );

    if (!patients.length) {
      throw new Error('Patient not found or access denied');
    }

    const [history] = await connection.query(
      `SELECT 
        history_id,
        patient_id,
        condition_type,
        description,
        severity,
        status,
        documented_at
       FROM medical_history
       WHERE patient_id = ? AND status != 'Archived'
       ORDER BY documented_at DESC`,
      [patientId]
    );

    return history;
  } catch (error) {
    console.error('Error fetching patient medical history:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Add medical history for a patient
 * RBAC: Patient can only add to their own medical history
 * @param {number} patientId - The patient to add history to
 * @param {Object} historyData - Medical history details
 * @returns {Promise<Object>} Created medical history record
 */
export async function addPatientMedicalHistory(patientId, historyData) {
  const { userId } = await checkPatientAccess();

  let connection;
  try {
    connection = await db.getConnection();

    // Verify patient ownership
    const [patients] = await connection.query(
      `SELECT patient_id FROM patients 
       WHERE patient_id = ? AND user_id = ? AND is_deleted = FALSE`,
      [patientId, userId]
    );

    if (!patients.length) {
      throw new Error('Patient not found or access denied');
    }

    // Insert medical history
    const [result] = await connection.query(
      `INSERT INTO medical_history (
        patient_id,
        condition_type,
        description,
        severity,
        status
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        patientId,
        historyData.condition_type,
        historyData.description,
        historyData.severity || 'Mild',
        'Active'
      ]
    );

    // Return the created record
    const [newRecord] = await connection.query(
      `SELECT 
        history_id,
        patient_id,
        condition_type,
        description,
        severity,
        status,
        documented_at
       FROM medical_history
       WHERE history_id = ?`,
      [result.insertId]
    );

    return newRecord[0];
  } catch (error) {
    console.error('Error adding medical history:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Update medical history record
 * RBAC: Patient can only update their own history
 * @param {number} patientId - The patient who owns the history
 * @param {number} historyId - The history record to update
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Updated medical history record
 */
export async function updatePatientMedicalHistory(patientId, historyId, updateData) {
  const { userId } = await checkPatientAccess();

  let connection;
  try {
    connection = await db.getConnection();

    // Verify patient ownership
    const [patients] = await connection.query(
      `SELECT patient_id FROM patients 
       WHERE patient_id = ? AND user_id = ? AND is_deleted = FALSE`,
      [patientId, userId]
    );

    if (!patients.length) {
      throw new Error('Patient not found or access denied');
    }

    // Verify history belongs to this patient
    const [historyCheck] = await connection.query(
      `SELECT history_id FROM medical_history 
       WHERE history_id = ? AND patient_id = ?`,
      [historyId, patientId]
    );

    if (!historyCheck.length) {
      throw new Error('Medical history not found');
    }

    // Update the record
    await connection.query(
      `UPDATE medical_history SET
        condition_type = ?,
        description = ?,
        severity = ?,
        status = ?
       WHERE history_id = ?`,
      [
        updateData.condition_type,
        updateData.description,
        updateData.severity,
        updateData.status,
        historyId
      ]
    );

    // Return updated record
    const [updated] = await connection.query(
      `SELECT 
        history_id,
        patient_id,
        condition_type,
        description,
        severity,
        status,
        documented_at
       FROM medical_history
       WHERE history_id = ?`,
      [historyId]
    );

    return updated[0];
  } catch (error) {
    console.error('Error updating medical history:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Delete medical history record
 * RBAC: Patient can only delete their own history
 * @param {number} patientId - The patient who owns the history
 * @param {number} historyId - The history record to delete
 * @returns {Promise<Object>} Success response
 */
export async function deletePatientMedicalHistory(patientId, historyId) {
  const { userId } = await checkPatientAccess();

  let connection;
  try {
    connection = await db.getConnection();

    // Verify patient ownership
    const [patients] = await connection.query(
      `SELECT patient_id FROM patients 
       WHERE patient_id = ? AND user_id = ? AND is_deleted = FALSE`,
      [patientId, userId]
    );

    if (!patients.length) {
      throw new Error('Patient not found or access denied');
    }

    // Verify history belongs to this patient
    const [historyCheck] = await connection.query(
      `SELECT history_id FROM medical_history 
       WHERE history_id = ? AND patient_id = ?`,
      [historyId, patientId]
    );

    if (!historyCheck.length) {
      throw new Error('Medical history not found');
    }

    // Delete the record
    await connection.query(
      `DELETE FROM medical_history WHERE history_id = ?`,
      [historyId]
    );

    return { success: true, message: 'Medical history deleted successfully' };
  } catch (error) {
    console.error('Error deleting medical history:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}
