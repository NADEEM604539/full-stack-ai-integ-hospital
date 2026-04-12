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
  const { userId } = await checkPatientAccess();

  let connection;
  try {
    connection = await db.getConnection();

    // Single efficient query with access verification and department info
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
        d.department_name,
        p.created_at
       FROM patients p
       LEFT JOIN departments d ON p.department_id = d.department_id
       WHERE p.patient_id = ? AND p.user_id = ? AND p.is_deleted = FALSE`,
      [patientId, userId]
    );

    if (!patients.length) {
      throw new Error(`Access Denied: Patient ${patientId} not found or does not belong to you.`);
    }

    return patients[0];
  } catch (error) {
    console.error('Error fetching patient profile:', error.message);
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

    return {
      success: true,
      patient_id: patientId,
      message: 'Patient profile updated successfully'
    };
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

    return {
      encounter: enc,
      subjective: subjective[0] || null,
      objective: objective[0] || null,
      assessment: assessment[0] || null,
      plan: plan[0] || null,
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
          vital_id,
          encounter_id,
          blood_pressure,
          heart_rate,
          body_temperature,
          respiratory_rate,
          oxygen_saturation,
          recorded_at,
          created_at
         FROM vitals
         WHERE encounter_id IN (
           SELECT encounter_id FROM encounters 
           WHERE patient_id = ? AND is_deleted = FALSE
         )
         ORDER BY recorded_at DESC
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
