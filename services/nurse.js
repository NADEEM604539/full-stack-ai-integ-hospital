import db from '@/lib/db';
import { getUserId } from './auth';

/**
 * NURSE SERVICE - Department & Role-based data access
 * Nurse (role_id = 3) can ONLY:
 * - View patients in their assigned department
 * - View/manage encounters in their department
 * - Record vital signs for department encounters
 * - View/manage medical history for department patients
 * - View SOAP notes (read-only)
 * - Cannot access other departments' data
 * - Cannot modify SOAP notes or treatment decisions
 */

/**
 * Check nurse role (role_id = 3) and get nurse_id (staff_id)
 * Returns: { userId, roleId, nurseId, departmentId }
 */
async function checkNurseAccess(connection) {
  try {
    let userId;
    try {
      userId = await getUserId();
    } catch (authError) {
      console.error('Auth error in checkNurseAccess:', authError);
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

    // Allow NURSE (role_id = 3) and ADMIN (role_id = 1)
    if (roleId !== 3 && roleId !== 1) {
      throw new Error(`Access Denied: Required role NURSE (3) or ADMIN (1), got ${roleId}`);
    }

    // Get nurse info: staff -> department
    const [nurseRows] = await connection.query(
      `SELECT staff_id, department_id 
       FROM staff
       WHERE user_id = ? AND status = 'Active'`,
      [userId]
    );

    if (!nurseRows.length) {
      throw new Error(`Nurse profile not found for user ${userId}. Admin must create nurse profile.`);
    }

    const nurseId = nurseRows[0].staff_id;
    const departmentId = nurseRows[0].department_id;

    return { userId, roleId, nurseId, departmentId };
  } catch (error) {
    const errorMsg = error?.message || String(error) || 'Unknown error in RBAC check';
    console.error('RBAC Check error:', errorMsg);
    throw new Error(`RBAC Check Failed: ${errorMsg}`);
  }
}

/**
 * Get all patients in nurse's department
 * RBAC: Nurse can only see patients from their own department
 */
export async function getNursePatients() {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkNurseAccess(connection);
    const { departmentId } = access;

    const [patients] = await connection.query(
      `SELECT 
        p.patient_id,
        p.mrn,
        CONCAT(p.first_name, ' ', p.last_name) as full_name,
        p.date_of_birth,
        p.gender,
        p.blood_type,
        p.phone_number,
        p.email,
        fn_calculate_age(p.date_of_birth) as age,
        (SELECT COUNT(*) FROM encounters e WHERE e.patient_id = p.patient_id AND e.is_deleted = FALSE) as total_encounters,
        (SELECT MAX(e.admission_date) FROM encounters e WHERE e.patient_id = p.patient_id AND e.is_deleted = FALSE) as last_visit,
        (SELECT COALESCE(COUNT(*), 0) FROM vitals v 
         JOIN encounters e ON v.encounter_id = e.encounter_id 
         WHERE e.patient_id = p.patient_id) as vitals_count
       FROM patients p
       WHERE p.department_id = ? AND p.is_deleted = FALSE
       ORDER BY p.first_name, p.last_name`,
      [departmentId]
    );

    return patients;
  } catch (error) {
    console.error('Error fetching nurse patients:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get all encounters for nurse's department
 * RBAC: Nurse can only see encounters for patients in their department
 */
export async function getNurseEncounters() {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkNurseAccess(connection);
    const { departmentId } = access;

    const [encounters] = await connection.query(
      `SELECT 
        e.encounter_id,
        e.patient_id,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.mrn,
        e.encounter_type,
        e.status,
        e.chief_complaint,
        e.admission_date,
        e.discharge_date,
        CONCAT(s.first_name, ' ', s.last_name) as doctor_name,
        (SELECT COUNT(*) FROM vitals v WHERE v.encounter_id = e.encounter_id) as vitals_count,
        e.created_at
       FROM encounters e
       JOIN patients p ON e.patient_id = p.patient_id
       LEFT JOIN staff s ON e.doctor_id = s.staff_id
       WHERE p.department_id = ? AND e.is_deleted = FALSE
       ORDER BY e.admission_date DESC`,
      [departmentId]
    );

    return encounters;
  } catch (error) {
    console.error('Error fetching nurse encounters:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get encounter details by ID
 * RBAC: Nurse can only access encounters for patients in their department
 */
export async function getEncounterDetail(encounterId) {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkNurseAccess(connection);
    const { departmentId } = access;

    const [encounters] = await connection.query(
      `SELECT 
        e.encounter_id as id,
        e.patient_id,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.mrn,
        p.date_of_birth,
        p.gender,
        p.blood_type,
        e.encounter_type,
        e.status,
        e.chief_complaint,
        e.admission_date,
        e.discharge_date,
        CONCAT(s.first_name, ' ', s.last_name) as doctor_name,
        dr.specialization,
        s.employee_id as license_number
       FROM encounters e
       JOIN patients p ON e.patient_id = p.patient_id
       LEFT JOIN doctors dr ON e.doctor_id = dr.doctor_id
       LEFT JOIN staff s ON dr.staff_id = s.staff_id
       WHERE e.encounter_id = ? AND p.department_id = ?`,
      [encounterId, departmentId]
    );

    if (!encounters.length) {
      throw new Error('Encounter not found or access denied');
    }

    return encounters[0];
  } catch (error) {
    console.error('Error fetching encounter detail:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Create new encounter for a patient
 * RBAC: Nurse can only create encounters for patients in their department
 */
export async function createEncounter(patientId, encounterType, chiefComplaint = null) {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkNurseAccess(connection);
    const { departmentId } = access;

    // Verify patient belongs to nurse's department
    const [patientCheck] = await connection.query(
      `SELECT patient_id FROM patients 
       WHERE patient_id = ? AND department_id = ? AND is_deleted = FALSE`,
      [patientId, departmentId]
    );

    if (!patientCheck.length) {
      throw new Error('Patient not found or access denied');
    }

    // Insert encounter
    await connection.query(
      `INSERT INTO encounters 
       (patient_id, encounter_type, chief_complaint, admission_date, status, is_deleted)
       VALUES (?, ?, ?, NOW(), 'Active', FALSE)`,
      [patientId, encounterType, chiefComplaint]
    );

    const [result] = await connection.query(
      `SELECT encounter_id FROM encounters 
       WHERE patient_id = ? AND encounter_type = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [patientId, encounterType]
    );

    return result[0].encounter_id;
  } catch (error) {
    console.error('Error creating encounter:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Record vital signs with AI risk assessment
 * RBAC: Nurse can only record vitals for encounters in their department
 */
export async function recordVitals(encounterId, vitalsData, recordedBy) {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkNurseAccess(connection);
    const { departmentId } = access;

    // Verify encounter belongs to nurse's department
    const [encounterCheck] = await connection.query(
      `SELECT e.encounter_id FROM encounters e
       JOIN patients p ON e.patient_id = p.patient_id
       WHERE e.encounter_id = ? AND p.department_id = ?`,
      [encounterId, departmentId]
    );

    if (!encounterCheck.length) {
      throw new Error('Encounter not found or access denied');
    }

    // Calculate AI risk score
    let riskScore = 0;
    const alerts = [];

    if (vitalsData.temperature_c) {
      if (vitalsData.temperature_c < 36 || vitalsData.temperature_c > 39) {
        riskScore += 20;
      }
      if (vitalsData.temperature_c > 39) {
        riskScore += 10;
        alerts.push('HIGH_FEVER');
      }
    }

    if (vitalsData.blood_pressure_systolic > 160) {
      riskScore += 25;
      alerts.push('HIGH_BP');
    }

    if (vitalsData.heart_rate) {
      if (vitalsData.heart_rate < 50) {
        riskScore += 15;
        alerts.push('BRADYCARDIA');
      } else if (vitalsData.heart_rate > 120) {
        riskScore += 15;
        alerts.push('TACHYCARDIA');
      }
    }

    if (vitalsData.oxygen_saturation) {
      if (vitalsData.oxygen_saturation < 95) {
        riskScore += 20;
      }
      if (vitalsData.oxygen_saturation < 90) {
        riskScore += 20;
        alerts.push('CRITICAL_LOW_O2');
      }
    }

    // Determine risk category
    let riskCategory = 'Low';
    if (riskScore >= 50) riskCategory = 'Critical';
    else if (riskScore >= 30) riskCategory = 'High';
    else if (riskScore >= 15) riskCategory = 'Moderate';

    // Insert vitals
    await connection.query(
      `INSERT INTO vitals 
       (encounter_id, temperature_c, blood_pressure_systolic, blood_pressure_diastolic, 
        heart_rate, oxygen_saturation, weight_kg, height_cm, ai_risk_score, ai_risk_category, 
        recorded_by, recorded_at, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), FALSE)`,
      [
        encounterId,
        vitalsData.temperature_c || null,
        vitalsData.blood_pressure_systolic || null,
        vitalsData.blood_pressure_diastolic || null,
        vitalsData.heart_rate || null,
        vitalsData.oxygen_saturation || null,
        vitalsData.weight_kg || null,
        vitalsData.height_cm || null,
        riskScore,
        riskCategory,
        recordedBy
      ]
    );

    const [result] = await connection.query(
      `SELECT vital_id FROM vitals 
       WHERE encounter_id = ? 
       ORDER BY recorded_at DESC LIMIT 1`,
      [encounterId]
    );

    return {
      vital_id: result[0].vital_id,
      risk_score: riskScore,
      risk_category: riskCategory,
      alerts
    };
  } catch (error) {
    console.error('Error recording vitals:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get vitals history for encounter
 * RBAC: Nurse can only see vitals for encounters in their department
 */
export async function getEncounterVitals(encounterId) {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkNurseAccess(connection);
    const { departmentId } = access;

    const [vitals] = await connection.query(
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
        v.ai_risk_category,
        v.recorded_at,
        v.updated_at,
        CONCAT(s.first_name, ' ', s.last_name) as recorded_by
       FROM vitals v
       LEFT JOIN staff s ON v.recorded_by = s.staff_id
       JOIN encounters e ON v.encounter_id = e.encounter_id
       JOIN patients p ON e.patient_id = p.patient_id
       WHERE v.encounter_id = ? AND p.department_id = ?`,
      [encounterId, departmentId]
    );

    return vitals[0] || null;
  } catch (error) {
    console.error('Error fetching encounter vitals:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get all medical history records for a patient
 * RBAC: Nurse can only access history for patients in their department
 */
export async function getPatientMedicalHistory(patientId) {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkNurseAccess(connection);
    const { departmentId } = access;

    // Verify patient belongs to nurse's department
    const [patientCheck] = await connection.query(
      `SELECT patient_id FROM patients 
       WHERE patient_id = ? AND department_id = ? AND is_deleted = FALSE`,
      [patientId, departmentId]
    );

    if (!patientCheck.length) {
      throw new Error('Patient not found or access denied');
    }

    const [records] = await connection.query(
      `SELECT 
        mh.history_id as id,
        mh.patient_id,
        mh.condition_type,
        mh.description,
        mh.severity,
        mh.status,
        mh.documented_at
       FROM medical_history mh
       WHERE mh.patient_id = ?
       ORDER BY mh.documented_at DESC`,
      [patientId]
    );

    return records;
  } catch (error) {
    console.error('Error fetching medical history:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Add new medical history record
 * RBAC: Nurse can only add for patients in their department
 */
export async function addMedicalHistory(patientId, conditionType, description, severity = 'Moderate', status = 'Active') {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkNurseAccess(connection);
    const { departmentId } = access;

    // Verify patient belongs to nurse's department
    const [patientCheck] = await connection.query(
      `SELECT patient_id FROM patients 
       WHERE patient_id = ? AND department_id = ? AND is_deleted = FALSE`,
      [patientId, departmentId]
    );

    if (!patientCheck.length) {
      throw new Error('Patient not found or access denied');
    }

    await connection.query(
      `INSERT INTO medical_history 
       (patient_id, condition_type, description, severity, status)
       VALUES (?, ?, ?, ?, ?)`,
      [patientId, conditionType, description, severity, status]
    );

    const [result] = await connection.query(
      `SELECT history_id as id FROM medical_history 
       WHERE patient_id = ? AND condition_type = ? 
       ORDER BY documented_at DESC LIMIT 1`,
      [patientId, conditionType]
    );

    return result[0].id;
  } catch (error) {
    console.error('Error adding medical history:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Update medical history record
 * RBAC: Nurse can only update for patients in their department
 */
export async function updateMedicalHistory(recordId, updates) {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkNurseAccess(connection);
    const { departmentId } = access;

    // Verify record belongs to nurse's department patient
    const [record] = await connection.query(
      `SELECT mh.history_id 
       FROM medical_history mh
       JOIN patients p ON mh.patient_id = p.patient_id
       WHERE mh.history_id = ? AND p.department_id = ?`,
      [recordId, departmentId]
    );

    if (!record.length) {
      throw new Error('Record not found or access denied');
    }

    const setClauses = [];
    const values = [];

    if (updates.conditionType !== undefined) {
      setClauses.push('condition_type = ?');
      values.push(updates.conditionType);
    }
    if (updates.description !== undefined) {
      setClauses.push('description = ?');
      values.push(updates.description);
    }
    if (updates.severity !== undefined) {
      setClauses.push('severity = ?');
      values.push(updates.severity);
    }
    if (updates.status !== undefined) {
      setClauses.push('status = ?');
      values.push(updates.status);
    }

    if (setClauses.length === 0) {
      return true; // No updates to apply
    }

    values.push(recordId);

    await connection.query(
      `UPDATE medical_history SET ${setClauses.join(', ')} WHERE history_id = ?`,
      values
    );

    return true;
  } catch (error) {
    console.error('Error updating medical history:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Delete medical history record (hard delete)
 * RBAC: Nurse can only delete for patients in their department
 */
export async function deleteMedicalHistory(recordId) {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkNurseAccess(connection);
    const { departmentId } = access;

    // Verify record belongs to nurse's department patient
    const [record] = await connection.query(
      `SELECT mh.history_id 
       FROM medical_history mh
       JOIN patients p ON mh.patient_id = p.patient_id
       WHERE mh.history_id = ? AND p.department_id = ?`,
      [recordId, departmentId]
    );

    if (!record.length) {
      throw new Error('Record not found or access denied');
    }

    await connection.query(
      `DELETE FROM medical_history WHERE history_id = ?`,
      [recordId]
    );

    return true;
  } catch (error) {
    console.error('Error deleting medical history:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get SOAP notes for an encounter (read-only for nurse)
 * RBAC: Nurse can only view SOAP for encounters in their department
 */
export async function getEncounterSOAP(encounterId) {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkNurseAccess(connection);
    const { departmentId } = access;

    const [soap] = await connection.query(
      `SELECT 
        sn.subjective_id,
        sn.patient_complaint,
        sn.symptom_duration,
        sn.severity_level,
        on2.objective_id,
        on2.physical_examination,
        on2.lab_findings,
        on2.imaging_results,
        an.assessment_id,
        an.primary_diagnosis,
        an.icd10_code,
        an.severity_level as assessment_severity,
        pn.plan_id,
        pn.treatment_plan,
        pn.medication_plan,
        pn.follow_up_plan,
        sn.created_at,
        CONCAT(s.first_name, ' ', s.last_name) as created_by
       FROM encounters e
       JOIN patients p ON e.patient_id = p.patient_id
       LEFT JOIN subjective_notes sn ON e.encounter_id = sn.encounter_id
       LEFT JOIN objective_notes on2 ON e.encounter_id = on2.encounter_id
       LEFT JOIN assessment_notes an ON e.encounter_id = an.encounter_id
       LEFT JOIN plan_notes pn ON e.encounter_id = pn.encounter_id
       LEFT JOIN staff s ON sn.created_by = s.staff_id
       WHERE e.encounter_id = ? AND p.department_id = ?`,
      [encounterId, departmentId]
    );

    return soap[0] || null;
  } catch (error) {
    console.error('Error fetching SOAP notes:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Record or update vital signs for an encounter
 * RBAC: Nurse can only record vitals for patients in their department
 * Note: One encounter = one vital (uses INSERT ... ON DUPLICATE KEY UPDATE)
 */
export async function recordEncounterVitals(
  encounterId,
  temperature_c,
  blood_pressure_systolic,
  blood_pressure_diastolic,
  heart_rate,
  oxygen_saturation,
  weight_kg = null,
  height_cm = null,
  ai_risk_score = 0,
  ai_risk_category = null
) {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkNurseAccess(connection);
    const { nurseId, departmentId } = access;

    // Verify encounter belongs to nurse's department
    const [encounter] = await connection.query(
      `SELECT e.encounter_id FROM encounters e
       JOIN patients p ON e.patient_id = p.patient_id
       WHERE e.encounter_id = ? AND p.department_id = ?`,
      [encounterId, departmentId]
    );

    if (!encounter.length) {
      throw new Error('Encounter not found or access denied');
    }

    // Insert or update vital using ON DUPLICATE KEY UPDATE
    // This enforces 1:1 relationship
    await connection.query(
      `INSERT INTO vitals (
        encounter_id, recorded_by, temperature_c, 
        blood_pressure_systolic, blood_pressure_diastolic,
        heart_rate, oxygen_saturation, weight_kg, height_cm,
        ai_risk_score, ai_risk_category, recorded_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        temperature_c = VALUES(temperature_c),
        blood_pressure_systolic = VALUES(blood_pressure_systolic),
        blood_pressure_diastolic = VALUES(blood_pressure_diastolic),
        heart_rate = VALUES(heart_rate),
        oxygen_saturation = VALUES(oxygen_saturation),
        weight_kg = VALUES(weight_kg),
        height_cm = VALUES(height_cm),
        ai_risk_score = VALUES(ai_risk_score),
        ai_risk_category = VALUES(ai_risk_category),
        recorded_by = VALUES(recorded_by),
        updated_at = NOW()`,
      [
        encounterId,
        nurseId,
        temperature_c,
        blood_pressure_systolic,
        blood_pressure_diastolic,
        heart_rate,
        oxygen_saturation,
        weight_kg,
        height_cm,
        ai_risk_score,
        ai_risk_category,
      ]
    );

    // Fetch and return the recorded vital
    const [vitals] = await connection.query(
      `SELECT 
        vital_id,
        encounter_id,
        temperature_c,
        blood_pressure_systolic,
        blood_pressure_diastolic,
        heart_rate,
        oxygen_saturation,
        weight_kg,
        height_cm,
        ai_risk_score,
        ai_risk_category,
        recorded_at,
        updated_at
       FROM vitals
       WHERE encounter_id = ?`,
      [encounterId]
    );

    return vitals[0] || null;
  } catch (error) {
    console.error('Error recording vital signs:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get nurse dashboard statistics
 * RBAC: Nurse can only see stats for their own department
 */
export async function getNurseDashboardStats() {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkNurseAccess(connection);
    const { departmentId } = access;

    // Total patients in department
    const [patientsCount] = await connection.query(
      `SELECT COUNT(DISTINCT p.patient_id) as total
       FROM patients p
       WHERE p.department_id = ? AND p.is_deleted = FALSE`,
      [departmentId]
    );

    // Active encounters in department
    const [encountersCount] = await connection.query(
      `SELECT COUNT(DISTINCT e.encounter_id) as total
       FROM encounters e
       JOIN patients p ON e.patient_id = p.patient_id
       WHERE e.status = 'Active' AND e.is_deleted = FALSE AND p.department_id = ?`,
      [departmentId]
    );

    // Vitals recorded today in department
    const [vitalsCount] = await connection.query(
      `SELECT COUNT(v.vital_id) as total
       FROM vitals v
       JOIN encounters e ON v.encounter_id = e.encounter_id
       JOIN patients p ON e.patient_id = p.patient_id
       WHERE DATE(v.recorded_at) = CURDATE() AND p.department_id = ?`,
      [departmentId]
    );

    // Pending tasks: Active encounters without vitals recorded today
    const [pendingCount] = await connection.query(
      `SELECT COUNT(DISTINCT e.encounter_id) as total
       FROM encounters e
       JOIN patients p ON e.patient_id = p.patient_id
       LEFT JOIN vitals v ON e.encounter_id = v.encounter_id AND DATE(v.recorded_at) = CURDATE()
       WHERE e.status = 'Active' AND e.is_deleted = FALSE 
       AND p.department_id = ? AND v.vital_id IS NULL`,
      [departmentId]
    );

    // Recent activity: Last 5 encounters in department
    const [recentActivity] = await connection.query(
      `SELECT 
        e.encounter_id,
        e.patient_id,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.mrn,
        e.encounter_type,
        e.status,
        e.chief_complaint,
        e.admission_date,
        CONCAT(s.first_name, ' ', s.last_name) as doctor_name,
        (SELECT COUNT(*) FROM vitals v WHERE v.encounter_id = e.encounter_id) as vitals_count
       FROM encounters e
       JOIN patients p ON e.patient_id = p.patient_id
       LEFT JOIN staff s ON e.doctor_id = s.staff_id
       WHERE p.department_id = ? AND e.is_deleted = FALSE
       ORDER BY e.admission_date DESC
       LIMIT 5`,
      [departmentId]
    );

    return {
      stats: {
        totalPatients: patientsCount[0]?.total || 0,
        activeEncounters: encountersCount[0]?.total || 0,
        vitalsRecorded: vitalsCount[0]?.total || 0,
        pendingTasks: pendingCount[0]?.total || 0
      },
      recentActivity: recentActivity || []
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Request medicines for a patient encounter
 * RBAC: Nurse can only request for patients in their department
 * @param {number} encounterId - Encounter ID
 * @param {number} appointmentId - Appointment ID
 * @param {array} medicines - Array of {medicineId, medicineName, quantity, unitPrice, notes}
 */
export async function requestMedicines(appointmentId, medicines) {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkNurseAccess(connection);
    const { nurseId, departmentId } = access;

    // Verify appointment belongs to nurse's department
    const [appointments] = await connection.query(
      `SELECT a.appointment_id, a.patient_id, p.department_id
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       WHERE a.appointment_id = ? AND p.department_id = ?`,
      [appointmentId, departmentId]
    );

    if (!appointments.length) {
      throw new Error('Appointment not found or access denied');
    }

    const { patient_id: patientId } = appointments[0];

    await connection.beginTransaction();

    // Calculate total amount
    let totalAmount = 0;
    medicines.forEach(med => {
      totalAmount += (med.quantity * med.unitPrice);
    });

    // Create order
    const [result] = await connection.query(
      `INSERT INTO order_medicine (appointment_id, patient_id, status, total_amount, requested_by, created_at, updated_at)
       VALUES (?, ?, 'Pending', ?, ?, NOW(), NOW())`,
      [appointmentId, patientId, totalAmount, nurseId]
    );

    const orderId = result.insertId;

    // Insert medicine items
    for (const medicine of medicines) {
      await connection.query(
        `INSERT INTO order_medicine_items (order_id, medicine_id, medicine_name, quantity, unit_price, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, medicine.medicineId, medicine.medicineName, medicine.quantity, medicine.unitPrice, medicine.notes || null]
      );
    }

    await connection.commit();

    return {
      orderId: orderId,
      status: 'Pending',
      totalAmount: totalAmount,
      itemCount: medicines.length,
      message: 'Medicine order created and sent to pharmacist for approval'
    };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error requesting medicines:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get all medicine requests by this nurse
 * RBAC: Nurse can only see their own requests
 */
export async function getNurseMedicineRequests() {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkNurseAccess(connection);
    const { nurseId } = access;

    const [requests] = await connection.query(`
      SELECT 
        om.order_id,
        om.appointment_id,
        om.patient_id,
        om.status,
        om.total_amount,
        om.rejection_reason,
        om.approved_by,
        om.created_at,
        om.updated_at,
        p.mrn,
        p.first_name,
        p.last_name,
        a.appointment_date,
        a.appointment_time,
        pharma_staff.first_name as approval_first_name,
        pharma_staff.last_name as approval_last_name,
        COUNT(omi.item_id) as item_count
      FROM order_medicine om
      LEFT JOIN patients p ON om.patient_id = p.patient_id
      LEFT JOIN appointments a ON om.appointment_id = a.appointment_id
      LEFT JOIN staff pharma_staff ON om.approved_by = pharma_staff.staff_id
      LEFT JOIN order_medicine_items omi ON om.order_id = omi.order_id
      WHERE om.requested_by = ?
      GROUP BY om.order_id
      ORDER BY om.created_at DESC
    `, [nurseId]);

    return requests;
  } catch (error) {
    console.error('Error fetching nurse medicine requests:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get details of a specific medicine order
 * RBAC: Nurse can only see their own orders
 */
export async function getNurseMedicineOrderDetail(orderId) {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkNurseAccess(connection);
    const { nurseId } = access;

    // Get order header
    const [orders] = await connection.query(`
      SELECT 
        om.order_id,
        om.appointment_id,
        om.patient_id,
        om.status,
        om.total_amount,
        om.rejection_reason,
        om.requested_by,
        om.approved_by,
        om.created_at,
        om.updated_at,
        p.mrn,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        a.appointment_date,
        a.appointment_time,
        pharma_staff.first_name as approval_first_name,
        pharma_staff.last_name as approval_last_name
      FROM order_medicine om
      LEFT JOIN patients p ON om.patient_id = p.patient_id
      LEFT JOIN appointments a ON om.appointment_id = a.appointment_id
      LEFT JOIN staff pharma_staff ON om.approved_by = pharma_staff.staff_id
      WHERE om.order_id = ? AND om.requested_by = ?
    `, [orderId, nurseId]);

    if (!orders.length) {
      throw new Error('Medicine order not found or access denied');
    }

    const order = orders[0];

    // Get order items
    const [items] = await connection.query(`
      SELECT 
        omi.item_id,
        omi.order_id,
        omi.medicine_id,
        omi.medicine_name,
        omi.quantity,
        omi.unit_price,
        omi.total_price,
        omi.notes
      FROM order_medicine_items omi
      WHERE omi.order_id = ?
      ORDER BY omi.item_id ASC
    `, [orderId]);

    return {
      ...order,
      items: items || []
    };
  } catch (error) {
    console.error('Error fetching medicine order detail:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get all appointments for nurse's department
 * RBAC: Nurse can only see appointments in their department
 */
export async function getNurseAppointments() {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkNurseAccess(connection);
    const { departmentId } = access;

    const [appointments] = await connection.query(
      `SELECT 
        a.appointment_id,
        a.patient_id,
        a.doctor_id,
        a.appointment_date,
        a.appointment_time,
        a.duration_minutes,
        a.status,
        a.reason_for_visit,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.mrn,
        CONCAT(s.first_name, ' ', s.last_name) as doctor_name,
        (SELECT COUNT(*) FROM encounters e WHERE e.appointment_id = a.appointment_id) as encounter_count,
        (SELECT COUNT(*) FROM order_medicine om WHERE om.appointment_id = a.appointment_id) as medicine_order_count
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       LEFT JOIN doctors d ON a.doctor_id = d.doctor_id
       LEFT JOIN staff s ON d.staff_id = s.staff_id
       WHERE a.department_id = ? AND a.is_deleted = FALSE
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [departmentId]
    );

    return appointments;
  } catch (error) {
    console.error('Error fetching nurse appointments:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get appointment detail with encounters and existing medicine orders
 * RBAC: Nurse can only access appointments in their department
 */
export async function getAppointmentDetail(appointmentId) {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkNurseAccess(connection);
    const { departmentId } = access;

    // Get appointment
    const [appointments] = await connection.query(
      `SELECT 
        a.appointment_id,
        a.patient_id,
        a.doctor_id,
        a.appointment_date,
        a.appointment_time,
        a.duration_minutes,
        a.status,
        a.reason_for_visit,
        a.notes,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.mrn,
        p.date_of_birth,
        p.blood_type,
        p.phone_number,
        p.email,
        CONCAT(s.first_name, ' ', s.last_name) as doctor_name,
        sp.specialization
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       LEFT JOIN doctors d ON a.doctor_id = d.doctor_id
       LEFT JOIN staff s ON d.staff_id = s.staff_id
       LEFT JOIN (SELECT doctor_id, specialization FROM doctors) sp ON a.doctor_id = sp.doctor_id
       WHERE a.appointment_id = ? AND a.department_id = ? AND a.is_deleted = FALSE`,
      [appointmentId, departmentId]
    );

    if (!appointments.length) {
      throw new Error('Appointment not found or access denied');
    }

    const appointment = appointments[0];

    // Get encounters for this appointment
    const [encounters] = await connection.query(
      `SELECT 
        e.encounter_id,
        e.encounter_type,
        e.chief_complaint,
        e.status,
        e.admission_date
       FROM encounters e
       WHERE e.appointment_id = ? AND e.is_deleted = FALSE`,
      [appointmentId]
    );

    // Get medicine orders
    const [medicineOrders] = await connection.query(
      `SELECT 
        om.order_id,
        om.status,
        om.total_amount,
        om.created_at,
        COUNT(omi.item_id) as item_count
       FROM order_medicine om
       LEFT JOIN order_medicine_items omi ON om.order_id = omi.order_id
       WHERE om.appointment_id = ?
       GROUP BY om.order_id
       ORDER BY om.created_at DESC`,
      [appointmentId]
    );

    // Get items for each medicine order
    const medicineOrdersWithItems = await Promise.all(
      medicineOrders.map(async (order) => {
        const [items] = await connection.query(
          `SELECT 
            omi.item_id,
            omi.medicine_id,
            ii.item_name as medicine_name,
            omi.quantity,
            omi.unit_price,
            omi.notes
           FROM order_medicine_items omi
           LEFT JOIN inventory_items ii ON omi.medicine_id = ii.item_id
           WHERE omi.order_id = ?`,
          [order.order_id]
        );
        return {
          ...order,
          items: items || []
        };
      })
    );

    return {
      appointment,
      encounters,
      medicineOrders: medicineOrdersWithItems
    };
  } catch (error) {
    console.error('Error fetching appointment detail:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get medicine order with items for editing
 * RBAC: Nurse can only access orders from their requested requests
 */
export async function getMedicineOrderWithItems(orderId) {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkNurseAccess(connection);
    const { departmentId } = access;

    // Get order
    const [orders] = await connection.query(
      `SELECT 
        om.order_id,
        om.appointment_id,
        om.patient_id,
        om.status,
        om.total_amount,
        om.rejection_reason,
        om.created_at,
        om.requested_by
       FROM order_medicine om
       JOIN appointments a ON om.appointment_id = a.appointment_id
       WHERE om.order_id = ? AND a.department_id = ? AND om.status = 'Pending'`,
      [orderId, departmentId]
    );

    if (!orders.length) {
      throw new Error('Medicine order not found or cannot be edited (must be Pending status)');
    }

    const order = orders[0];

    // Get items
    const [items] = await connection.query(
      `SELECT 
        omi.item_id as id,
        omi.medicine_id,
        omi.medicine_name,
        omi.quantity,
        omi.unit_price,
        omi.notes
       FROM order_medicine_items omi
       WHERE omi.order_id = ?`,
      [orderId]
    );

    return {
      order,
      items
    };
  } catch (error) {
    console.error('Error fetching medicine order:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Update medicine order items (can only update if Pending)
 * RBAC: Nurse can only update their own Pending orders
 */
export async function updateMedicineOrderItems(orderId, items) {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkNurseAccess(connection);
    const { departmentId } = access;

    // Verify order is pending and belongs to nurse's department
    const [orders] = await connection.query(
      `SELECT om.order_id FROM order_medicine om
       JOIN appointments a ON om.appointment_id = a.appointment_id
       WHERE om.order_id = ? AND a.department_id = ? AND om.status = 'Pending'`,
      [orderId, departmentId]
    );

    if (!orders.length) {
      throw new Error('Medicine order not found or cannot be edited');
    }

    await connection.beginTransaction();

    // Delete old items
    await connection.query(
      `DELETE FROM order_medicine_items WHERE order_id = ?`,
      [orderId]
    );

    // Insert new items and calculate total
    let totalAmount = 0;
    for (const item of items) {
      await connection.query(
        `INSERT INTO order_medicine_items (order_id, medicine_id, medicine_name, quantity, unit_price, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.medicine_id, item.medicine_name, item.quantity, item.unit_price, item.notes || null]
      );
      totalAmount += (item.quantity * item.unit_price);
    }

    // Update order total
    await connection.query(
      `UPDATE order_medicine SET total_amount = ? WHERE order_id = ?`,
      [totalAmount, orderId]
    );

    await connection.commit();

    return { orderId, totalAmount, itemCount: items.length };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error updating medicine order:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Delete medicine order (can only delete if Pending)
 * RBAC: Nurse can only delete their own Pending orders
 */
export async function deleteMedicineOrder(orderId) {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkNurseAccess(connection);
    const { departmentId } = access;

    // Verify order is pending and belongs to nurse's department
    const [orders] = await connection.query(
      `SELECT om.order_id FROM order_medicine om
       JOIN appointments a ON om.appointment_id = a.appointment_id
       WHERE om.order_id = ? AND a.department_id = ? AND om.status = 'Pending'`,
      [orderId, departmentId]
    );

    if (!orders.length) {
      throw new Error('Medicine order not found or cannot be deleted');
    }

    await connection.beginTransaction();

    // Delete items
    await connection.query(
      `DELETE FROM order_medicine_items WHERE order_id = ?`,
      [orderId]
    );

    // Delete order
    await connection.query(
      `DELETE FROM order_medicine WHERE order_id = ?`,
      [orderId]
    );

    await connection.commit();

    return { success: true, message: 'Medicine order deleted successfully' };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error deleting medicine order:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

export { checkNurseAccess };
