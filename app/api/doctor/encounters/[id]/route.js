import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserId } from '@/services/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/doctor/encounters/[id]
 * Fetch encounter details with existing SOAP notes
 * 
 * RBAC:
 * ✓ Doctor (role_id = 2) can access only own encounters
 * ✓ Admin (role_id = 1) can access any encounter
 * ✗ Other roles: Access Denied
 */
export async function GET(request, { params }) {
  try {
    const { id: encounterId } = await params;

    if (!encounterId) {
      return NextResponse.json(
        { error: 'Encounter ID is required' },
        { status: 400 }
      );
    }

    let connection;
    try {
      connection = await db.getConnection();
    } catch (dbError) {
      throw new Error(`Database connection failed: ${dbError?.message || String(dbError)}`);
    }

    // Get current user
    let userId;
    try {
      userId = await getUserId();
    } catch (authError) {
      throw new Error(`Authentication failed: ${authError?.message || String(authError)}`);
    }

    try {
      // Get user role
      const [userRows] = await connection.query(
        `SELECT role_id FROM users WHERE user_id = ?`,
        [userId]
      );

      if (!userRows.length) {
        throw new Error(`User ${userId} not found in database`);
      }

      const roleId = userRows[0].role_id;

      // Only DOCTOR (2) and ADMIN (1) can access
      if (roleId !== 2 && roleId !== 1) {
        throw new Error(`Access Denied: Required role DOCTOR (2) or ADMIN (1), got ${roleId}`);
      }

      // Build base query for encounter
      let encounterQuery = `
        SELECT 
          e.encounter_id,
          e.patient_id,
          e.doctor_id,
          e.appointment_id,
          e.encounter_type,
          e.admission_date,
          e.discharge_date,
          e.chief_complaint,
          e.status,
          e.created_at,
          e.updated_at,
          p.mrn,
          p.first_name,
          p.last_name,
          p.date_of_birth,
          p.gender,
          p.blood_type
        FROM encounters e
        JOIN patients p ON e.patient_id = p.patient_id
        WHERE e.encounter_id = ?
      `;

      // If doctor, restrict to own encounters
      let queryParams = [encounterId];
      if (roleId === 2) {
        // Get doctor_id for this user
        const [doctorRows] = await connection.query(
          `SELECT d.doctor_id FROM doctors d
           JOIN staff s ON d.staff_id = s.staff_id
           WHERE s.user_id = ?`,
          [userId]
        );

        if (!doctorRows.length) {
          throw new Error(`Doctor profile not found for user ${userId}`);
        }

        const doctorId = doctorRows[0].doctor_id;
        encounterQuery += ` AND e.doctor_id = ?`;
        queryParams.push(doctorId);
      }

      // Fetch encounter
      const [encounters] = await connection.query(encounterQuery, queryParams);

      if (!encounters.length) {
        connection.release();
        return NextResponse.json(
          { error: 'Encounter not found or access denied' },
          { status: 404 }
        );
      }

      const encounter = encounters[0];
      const patientId = encounter.patient_id;

      // Fetch patient medical history (allergies, chronic conditions, etc.)
      const [medicalHistory] = await connection.query(
        `SELECT condition_type, description, severity, status FROM medical_history 
         WHERE patient_id = ? AND status = 'Active'
         ORDER BY condition_type ASC`,
        [patientId]
      );

      // Fetch patient vitals for this encounter
      const [vitals] = await connection.query(
        `SELECT temperature_c, blood_pressure_systolic, blood_pressure_diastolic, 
                heart_rate, oxygen_saturation, weight_kg, height_cm, recorded_at
         FROM vitals WHERE encounter_id = ? 
         ORDER BY recorded_at DESC LIMIT 1`,
        [encounterId]
      );

      // Organize medical history by type
      const allergies = medicalHistory.filter(h => h.condition_type === 'Allergy');
      const chronicConditions = medicalHistory.filter(h => h.condition_type === 'Chronic Condition');
      const previousSurgeries = medicalHistory.filter(h => h.condition_type === 'Previous Surgery');
      const familyHistory = medicalHistory.filter(h => h.condition_type === 'Family History');

      // Fetch existing SOAP notes
      const soapNotes = {};

      // Subjective notes
      const [subjRows] = await connection.query(
        `SELECT patient_complaint, symptom_duration, severity_level, affecting_daily_activities 
         FROM subjective_notes WHERE encounter_id = ? LIMIT 1`,
        [encounterId]
      );
      if (subjRows.length) {
        soapNotes.subjective = {
          complaint: subjRows[0].patient_complaint,
          duration: subjRows[0].symptom_duration,
          severity: subjRows[0].severity_level,
          affectingActivities: subjRows[0].affecting_daily_activities,
        };
      }

      // Objective notes
      const [objRows] = await connection.query(
        `SELECT physical_examination, lab_findings, imaging_results, other_findings 
         FROM objective_notes WHERE encounter_id = ? LIMIT 1`,
        [encounterId]
      );
      if (objRows.length) {
        soapNotes.objective = {
          examination: objRows[0].physical_examination,
          labFindings: objRows[0].lab_findings,
          imagingResults: objRows[0].imaging_results,
          other: objRows[0].other_findings,
        };
      }

      // Assessment notes
      const [assRows] = await connection.query(
        `SELECT primary_diagnosis, differential_diagnoses, clinical_reasoning, icd10_code, severity_level, 
                ai_suggestion, ai_differential_ranks, ai_confidence, ai_override_reason
         FROM assessment_notes WHERE encounter_id = ? LIMIT 1`,
        [encounterId]
      );
      if (assRows.length) {
        
        let aiDifferentialRanksRaw = assRows[0].ai_differential_ranks;
        try {
          if (aiDifferentialRanksRaw && typeof aiDifferentialRanksRaw === 'string') {
             aiDifferentialRanksRaw = JSON.parse(aiDifferentialRanksRaw);
          }
        } catch(e) {
          // If it's not valid JSON, we assume it's user-edited plain text
        }

        soapNotes.assessment = {
          primaryDiagnosis: assRows[0].primary_diagnosis,
          differentialDiagnoses: assRows[0].differential_diagnoses,
          clinicalReasoning: assRows[0].clinical_reasoning,
          icd10Code: assRows[0].icd10_code,
          severity: assRows[0].severity_level,
          aiSuggestion: assRows[0].ai_suggestion ? JSON.parse(assRows[0].ai_suggestion) : null,
          aiDifferentialRanks: aiDifferentialRanksRaw,
          aiConfidence: assRows[0].ai_confidence,
          aiOverrideReason: assRows[0].ai_override_reason,
        };
      }

      // Plan notes
      const [planRows] = await connection.query(
        `SELECT treatment_plan, medication_plan, follow_up_plan, patient_education, referrals 
         FROM plan_notes WHERE encounter_id = ? LIMIT 1`,
        [encounterId]
      );
      if (planRows.length) {
         let aiMedicationPlanRaw = planRows[0].medication_plan;
        try {
          if (aiMedicationPlanRaw && typeof aiMedicationPlanRaw === 'string') {
             aiMedicationPlanRaw = JSON.parse(aiMedicationPlanRaw);
          }
        } catch(e) {
          // If it's not valid JSON, we assume it's user-edited plain text
        }

        soapNotes.plan = {
          treatment: planRows[0].treatment_plan,
          medication: aiMedicationPlanRaw,
          followUp: planRows[0].follow_up_plan,
          education: planRows[0].patient_education,
          referrals: planRows[0].referrals,
        };
      }

      return NextResponse.json({
        success: true,
        encounter,
        patientContext: {
          medicalHistory: {
            allergies: allergies.map(a => ({ description: a.description, severity: a.severity })),
            chronicConditions: chronicConditions.map(c => ({ description: c.description, severity: c.severity })),
            previousSurgeries: previousSurgeries.map(s => ({ description: s.description })),
            familyHistory: familyHistory.map(f => ({ description: f.description })),
          },
          vitals: vitals.length > 0 ? {
            temperature: vitals[0].temperature_c,
            bpSystolic: vitals[0].blood_pressure_systolic,
            bpDiastolic: vitals[0].blood_pressure_diastolic,
            heartRate: vitals[0].heart_rate,
            oxygenSaturation: vitals[0].oxygen_saturation,
            weight: vitals[0].weight_kg,
            height: vitals[0].height_cm,
            recordedAt: vitals[0].recorded_at,
          } : null,
        },
        soapNotes: Object.keys(soapNotes).length > 0 ? soapNotes : null,
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error('Fetch Encounter API Error:', error?.message);

    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch encounter' },
      { status: statusCode }
    );
  }
}

/**
 * POST /api/doctor/encounters/[id]/soap-notes
 * Save SOAP notes for an encounter
 * 
 * Request body:
 * {
 *   subjective: string (full text content),
 *   objective: string (full text content),
 *   assessment: string (full text content),
 *   plan: string (full text content),
 *   severity?: number (1-10),
 *   icd10Code?: string
 * }
 * 
 * RBAC: Same as GET - Doctor or Admin only
 */
export async function POST(request, { params }) {
  try {
    const { id: encounterId } = await params;
    const body = await request.json();
    const { 
      subjective, 
      objective, 
      assessment, 
      plan, 
      severity = 5,
      icd10Code 
    } = body;

    if (!encounterId) {
      return NextResponse.json(
        { error: 'Encounter ID is required' },
        { status: 400 }
      );
    }

    // At least one section must be provided
    if (!subjective && !objective && !assessment && !plan) {
      return NextResponse.json(
        { error: 'At least one SOAP section is required' },
        { status: 400 }
      );
    }

    let connection;
    try {
      connection = await db.getConnection();
    } catch (dbError) {
      throw new Error(`Database connection failed: ${dbError?.message || String(dbError)}`);
    }

    // Get current user
    let userId;
    try {
      userId = await getUserId();
    } catch (authError) {
      throw new Error(`Authentication failed: ${authError?.message || String(authError)}`);
    }

    try {
      // Get user role
      const [userRows] = await connection.query(
        `SELECT role_id FROM users WHERE user_id = ?`,
        [userId]
      );

      if (!userRows.length) {
        throw new Error(`User ${userId} not found in database`);
      }

      const roleId = userRows[0].role_id;

      // Only DOCTOR (2) and ADMIN (1) can save SOAP notes
      if (roleId !== 2 && roleId !== 1) {
        throw new Error(`Access Denied: Required role DOCTOR (2) or ADMIN (1), got ${roleId}`);
      }

      // Verify encounter exists and user has access
      let encQuery = `
        SELECT e.encounter_id, e.doctor_id, e.patient_id
        FROM encounters e
        WHERE e.encounter_id = ?
      `;

      let queryParams = [encounterId];

      if (roleId === 2) {
        // Get doctor_id for this user
        const [doctorRows] = await connection.query(
          `SELECT d.doctor_id FROM doctors d
           JOIN staff s ON d.staff_id = s.staff_id
           WHERE s.user_id = ?`,
          [userId]
        );

        if (!doctorRows.length) {
          throw new Error(`Doctor profile not found for user ${userId}`);
        }

        const doctorId = doctorRows[0].doctor_id;
        encQuery += ` AND e.doctor_id = ?`;
        queryParams.push(doctorId);
      }

      const [encounters] = await connection.query(encQuery, queryParams);

      if (!encounters.length) {
        throw new Error('Encounter not found or access denied');
      }

      const encounter = encounters[0];

      // Start transaction
      await connection.query('START TRANSACTION');

      try {
        // Save subjective notes
        if (subjective && subjective.trim()) {
          // Check if exists
          const [subjRows] = await connection.query(
            `SELECT subjective_id FROM subjective_notes WHERE encounter_id = ? LIMIT 1`,
            [encounterId]
          );

          if (subjRows.length) {
            // Update existing
            await connection.query(
              `UPDATE subjective_notes 
               SET patient_complaint = ?, severity_level = ? 
               WHERE encounter_id = ?`,
              [subjective.trim(), severity, encounterId]
            );
          } else {
            // Insert new
            await connection.query(
              `INSERT INTO subjective_notes 
               (encounter_id, patient_complaint, severity_level, created_by, created_at) 
               VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
              [encounterId, subjective.trim(), severity, userId]
            );
          }
        }

        // Save objective notes
        if (objective && objective.trim()) {
          const [objRows] = await connection.query(
            `SELECT objective_id FROM objective_notes WHERE encounter_id = ? LIMIT 1`,
            [encounterId]
          );

          if (objRows.length) {
            await connection.query(
              `UPDATE objective_notes 
               SET physical_examination = ? 
               WHERE encounter_id = ?`,
              [objective.trim(), encounterId]
            );
          } else {
            await connection.query(
              `INSERT INTO objective_notes 
               (encounter_id, physical_examination, created_by, created_at) 
               VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
              [encounterId, objective.trim(), userId]
            );
          }
        }

        // Save assessment notes
        if (assessment && assessment.trim()) {
          const [assRows] = await connection.query(
            `SELECT assessment_id FROM assessment_notes WHERE encounter_id = ? LIMIT 1`,
            [encounterId]
          );

          if (assRows.length) {
            await connection.query(
              `UPDATE assessment_notes 
               SET primary_diagnosis = ?, icd10_code = ? 
               WHERE encounter_id = ?`,
              [assessment.trim(), icd10Code || null, encounterId]
            );
          } else {
            await connection.query(
              `INSERT INTO assessment_notes 
               (encounter_id, primary_diagnosis, icd10_code, created_by, created_at) 
               VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
              [encounterId, assessment.trim(), icd10Code || null, userId]
            );
          }
        }

        // Save plan notes
        if (plan && plan.trim()) {
          const [planRows] = await connection.query(
            `SELECT plan_id FROM plan_notes WHERE encounter_id = ? LIMIT 1`,
            [encounterId]
          );

          if (planRows.length) {
            await connection.query(
              `UPDATE plan_notes 
               SET treatment_plan = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
               WHERE encounter_id = ?`,
              [plan.trim(), userId, encounterId]
            );
          } else {
            await connection.query(
              `INSERT INTO plan_notes 
               (encounter_id, treatment_plan, created_by, created_at) 
               VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
              [encounterId, plan.trim(), userId]
            );
          }
        }

        // Note: Encounter status remains 'Active'/'Discharged'/'Transferred'
        // SOAP documentation is tracked by the presence of rows in subjective/objective/assessment/plan tables
        // Update encounter's updated_by and updated_at to track last modification
        await connection.query(
          `UPDATE encounters SET updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE encounter_id = ?`,
          [userId, encounterId]
        );

        // Log to audit_logs
        const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
        await connection.query(
          `INSERT INTO audit_logs (user_id, action_type, table_name, record_id, new_data, ip_address)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, 'CREATE_OR_UPDATE', 'soap_notes', encounterId, JSON.stringify({sections: 'subjective,objective,assessment,plan'}), clientIp]
        );

        // Commit transaction
        await connection.query('COMMIT');

        return NextResponse.json({
          success: true,
          encounterId,
          message: 'SOAP notes saved successfully',
          savedAt: new Date().toISOString(),
        });
      } catch (txError) {
        // Rollback on error
        await connection.query('ROLLBACK');
        throw txError;
      }
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error('Save SOAP Notes API Error:', error?.message);

    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to save SOAP notes',
      },
      { status: statusCode }
    );
  }
}

/**
 * PUT /api/doctor/encounters/[id]
 * Update encounter details (status, discharge_date, chief_complaint)
 * 
 * RBAC: Doctor (role_id = 2) can update only their own encounters
 *       Admin (role_id = 1) can update any encounter
 */
export async function PUT(request, { params }) {
  try {
    const { id: encounterId } = await params;
    const body = await request.json();
    const { status, discharge_date, chief_complaint } = body;

    if (!encounterId) {
      return NextResponse.json(
        { error: 'Encounter ID is required' },
        { status: 400 }
      );
    }

    let connection;
    try {
      connection = await db.getConnection();
    } catch (dbError) {
      throw new Error(`Database connection failed: ${dbError?.message}`);
    }

    // Get current user
    let userId;
    try {
      userId = await getUserId();
    } catch (authError) {
      throw new Error(`Authentication failed: ${authError?.message}`);
    }

    try {
      // Get user role
      const [userRows] = await connection.query(
        `SELECT role_id FROM users WHERE user_id = ?`,
        [userId]
      );

      if (!userRows.length) {
        throw new Error(`User ${userId} not found in database`);
      }

      const roleId = userRows[0].role_id;

      // Only DOCTOR (2) and ADMIN (1) can update
      if (roleId !== 2 && roleId !== 1) {
        throw new Error(`Access Denied: Required role DOCTOR (2) or ADMIN (1), got ${roleId}`);
      }

      // Get encounter and verify doctor can update it
      let encounterQuery = `SELECT encounter_id, doctor_id FROM encounters WHERE encounter_id = ?`;
      let queryParams = [encounterId];

      if (roleId === 2) {
        // Get doctor_id for this user
        const [doctorRows] = await connection.query(
          `SELECT d.doctor_id FROM doctors d
           JOIN staff s ON d.staff_id = s.staff_id
           WHERE s.user_id = ?`,
          [userId]
        );

        if (!doctorRows.length) {
          throw new Error(`Doctor profile not found for user ${userId}`);
        }

        const doctorId = doctorRows[0].doctor_id;
        encounterQuery += ` AND doctor_id = ?`;
        queryParams.push(doctorId);
      }

      const [encounters] = await connection.query(encounterQuery, queryParams);

      if (!encounters.length) {
        throw new Error('Encounter not found or access denied');
      }

      // Update encounter
      const updateParts = [];
      const updateValues = [];

      if (status !== undefined) {
        updateParts.push('status = ?');
        updateValues.push(status);
      }
      if (discharge_date !== undefined) {
        updateParts.push('discharge_date = ?');
        updateValues.push(discharge_date);
      }
      if (chief_complaint !== undefined) {
        updateParts.push('chief_complaint = ?');
        updateValues.push(chief_complaint);
      }

      if (updateParts.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateParts.push('updated_by = ?');
      updateValues.push(userId);
      updateParts.push('updated_at = CURRENT_TIMESTAMP');

      updateValues.push(encounterId);

      await connection.query(
        `UPDATE encounters SET ${updateParts.join(', ')} WHERE encounter_id = ?`,
        updateValues
      );

      // Fetch and return updated encounter
      const [updatedEncounters] = await connection.query(
        `SELECT * FROM encounters WHERE encounter_id = ?`,
        [encounterId]
      );

      return NextResponse.json({
        success: true,
        data: updatedEncounters[0],
        message: 'Encounter updated successfully',
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error('Update Encounter API Error:', error?.message);

    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to update encounter' },
      { status: statusCode }
    );
  }
}

/**
 * DELETE /api/doctor/encounters/[id]
 * Hard delete an encounter (removes from database)
 * 
 * RBAC: Doctor (role_id = 2) can delete only their own encounters
 *       Admin (role_id = 1) can delete any encounter
 */
export async function DELETE(request, { params }) {
  try {
    const { id: encounterId } = await params;

    if (!encounterId) {
      return NextResponse.json(
        { error: 'Encounter ID is required' },
        { status: 400 }
      );
    }

    let connection;
    try {
      connection = await db.getConnection();
    } catch (dbError) {
      throw new Error(`Database connection failed: ${dbError?.message}`);
    }

    // Get current user
    let userId;
    try {
      userId = await getUserId();
    } catch (authError) {
      throw new Error(`Authentication failed: ${authError?.message}`);
    }

    try {
      // Get user role
      const [userRows] = await connection.query(
        `SELECT role_id FROM users WHERE user_id = ?`,
        [userId]
      );

      if (!userRows.length) {
        throw new Error(`User ${userId} not found in database`);
      }

      const roleId = userRows[0].role_id;

      // Only DOCTOR (2) and ADMIN (1) can delete
      if (roleId !== 2 && roleId !== 1) {
        throw new Error(`Access Denied: Required role DOCTOR (2) or ADMIN (1), got ${roleId}`);
      }

      // Get encounter and verify doctor can delete it
      let encounterQuery = `SELECT encounter_id, doctor_id FROM encounters WHERE encounter_id = ?`;
      let queryParams = [encounterId];

      if (roleId === 2) {
        // Get doctor_id for this user
        const [doctorRows] = await connection.query(
          `SELECT d.doctor_id FROM doctors d
           JOIN staff s ON d.staff_id = s.staff_id
           WHERE s.user_id = ?`,
          [userId]
        );

        if (!doctorRows.length) {
          throw new Error(`Doctor profile not found for user ${userId}`);
        }

        const doctorId = doctorRows[0].doctor_id;
        encounterQuery += ` AND doctor_id = ?`;
        queryParams.push(doctorId);
      }

      const [encounters] = await connection.query(encounterQuery, queryParams);

      if (!encounters.length) {
        throw new Error('Encounter not found or access denied');
      }

      // Start transaction for cascading deletes
      await connection.query('START TRANSACTION');

      try {
        // Delete related SOAP notes (cascade)
        await connection.query('DELETE FROM subjective_notes WHERE encounter_id = ?', [encounterId]);
        await connection.query('DELETE FROM objective_notes WHERE encounter_id = ?', [encounterId]);
        await connection.query('DELETE FROM assessment_notes WHERE encounter_id = ?', [encounterId]);
        await connection.query('DELETE FROM plan_notes WHERE encounter_id = ?', [encounterId]);
        await connection.query('DELETE FROM vitals WHERE encounter_id = ?', [encounterId]);

        // Delete the encounter itself
        await connection.query('DELETE FROM encounters WHERE encounter_id = ?', [encounterId]);

        // Log to audit_logs
        const clientIp2 = request.headers.get('x-forwarded-for') || 'unknown';
        await connection.query(
          `INSERT INTO audit_logs (user_id, action_type, table_name, record_id, new_data, ip_address)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, 'DELETE', 'encounters', encounterId, JSON.stringify({action: 'hard_delete'}), clientIp2]
        );

        // Commit transaction
        await connection.query('COMMIT');

        return NextResponse.json({
          success: true,
          message: 'Encounter permanently deleted',
        });
      } catch (txError) {
        // Rollback on error
        await connection.query('ROLLBACK');
        throw txError;
      }
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error('Delete Encounter API Error:', error?.message);

    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to delete encounter' },
      { status: statusCode }
    );
  }
}
