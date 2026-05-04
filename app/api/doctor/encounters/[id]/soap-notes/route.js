import { NextResponse } from 'next/server';
import { getUserId } from '@/services/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/doctor/encounters/[id]/soap-notes
 * Save SOAP notes and vitals to database for a specific encounter
 * 
 * Request body:
 * {
 *   subjective: string,
 *   objective: string,
 *   assessment: string,
 *   plan: string,
 *   temperature: number,
 *   bpSystolic: number,
 *   bpDiastolic: number,
 *   heartRate: number,
 *   oxygenSat: number,
 *   weight: number,
 *   height: number
 * }
 */
export async function POST(request, { params }) {
  let connection;
  try {
    const { id: encounterId } = await params;
    const body = await request.json();

    const {
      subjective,
      objective,
      assessment,
      plan,
      temperature,
      bpSystolic,
      bpDiastolic,
      heartRate,
      oxygenSat,
      weight,
      height,
      aiDifferentialDiagnoses, // Array of AI differentials stringified
      aiMedicationPlan // Array of medication recommendations stringified
    } = body;

    // Get current user
    let userId;
    try {
      userId = await getUserId();
    } catch (authError) {
      throw new Error(`Authentication failed: ${authError?.message}`);
    }

    connection = await db.getConnection();

    // Verify user is a doctor and owns this encounter
    const [userRows] = await connection.query(
      `SELECT role_id FROM users WHERE user_id = ?`,
      [userId]
    );

    if (!userRows.length) {
      throw new Error(`User ${userId} not found`);
    }

    const roleId = userRows[0].role_id;

    // Only doctors (role_id=2) and admins (role_id=1) can save
    if (roleId !== 2 && roleId !== 1) {
      throw new Error('Access Denied: Required DOCTOR or ADMIN role');
    }

    // Get doctor_id for RBAC check
    let doctor_id = null;
    let staff_id = null;
    if (roleId === 2) {
      const [doctorRows] = await connection.query(
        `SELECT d.doctor_id, d.staff_id FROM doctors d
         JOIN staff s ON d.staff_id = s.staff_id
         WHERE s.user_id = ?`,
        [userId]
      );

      if (!doctorRows.length) {
        throw new Error('Doctor profile not found');
      }

      doctor_id = doctorRows[0].doctor_id;
      staff_id = doctorRows[0].staff_id;
    } else {
      // For admin, get their staff_id if they have one
      const [adminStaff] = await connection.query(
        `SELECT staff_id FROM staff WHERE user_id = ?`,
        [userId]
      );
      if (adminStaff.length > 0) {
        staff_id = adminStaff[0].staff_id;
      }
    }

    // Verify encounter exists and doctor has access
    let encQuery = `
      SELECT e.encounter_id, e.patient_id, e.doctor_id
      FROM encounters e
      WHERE e.encounter_id = ?
    `;

    if (roleId === 2) {
      encQuery += ` AND e.doctor_id = ?`;
    }

    const params_array = roleId === 2 ? [encounterId, doctor_id] : [encounterId];
    const [encounters] = await connection.query(encQuery, params_array);

    if (!encounters.length) {
      throw new Error('Encounter not found or access denied');
    }

    const encounter = encounters[0];
    const patient_id = encounter.patient_id;

    // Start transaction
    await connection.beginTransaction();

    try {
      // 1. Save Subjective Notes
      if (subjective && subjective.trim()) {
        const [existingSubj] = await connection.query(
          `SELECT subjective_id FROM subjective_notes WHERE encounter_id = ?`,
          [encounterId]
        );

        if (existingSubj.length > 0) {
          await connection.query(
            `UPDATE subjective_notes 
             SET patient_complaint = ?, created_by = ?
             WHERE encounter_id = ?`,
            [subjective.trim(), userId, encounterId]
          );
        } else {
          await connection.query(
            `INSERT INTO subjective_notes (encounter_id, patient_complaint, created_by)
             VALUES (?, ?, ?)`,
            [encounterId, subjective.trim(), userId]
          );
        }
      }

      // 2. Save Objective Notes
      if (objective && objective.trim()) {
        const [existingObj] = await connection.query(
          `SELECT objective_id FROM objective_notes WHERE encounter_id = ?`,
          [encounterId]
        );

        if (existingObj.length > 0) {
          await connection.query(
            `UPDATE objective_notes 
             SET physical_examination = ?, lab_findings = ?
             WHERE encounter_id = ?`,
            [objective.trim(), '', encounterId]
          );
        } else {
          await connection.query(
            `INSERT INTO objective_notes (encounter_id, physical_examination, lab_findings, created_by)
             VALUES (?, ?, ?, ?)`,
            [encounterId, objective.trim(), '', userId]
          );
        }
      }

      // 3. Save Assessment Notes & Diagnostics
      if (assessment && assessment.trim()) {
        const fullAssessment = assessment.trim();
        
        // Extract a short primary diagnosis (max 255 chars) vs the full reasoning
        let primaryDiag = fullAssessment.split('\n')[0].replace('Primary Diagnosis:', '').trim();
        if (primaryDiag.length > 250) {
          primaryDiag = primaryDiag.substring(0, 247) + '...';
        }
        if (!primaryDiag) primaryDiag = 'Diagnosis pending';

        const [existingAss] = await connection.query(
          `SELECT assessment_id FROM assessment_notes WHERE encounter_id = ?`,
          [encounterId]
        );

        if (existingAss.length > 0) {
          await connection.query(
            `UPDATE assessment_notes 
             SET primary_diagnosis = ?, 
                 clinical_reasoning = ?,
                 ai_differential_ranks = ?
             WHERE encounter_id = ?`,
            [
              primaryDiag,
              fullAssessment,
              aiDifferentialDiagnoses || null, 
              encounterId
            ]
          );
        } else {
          await connection.query(
            `INSERT INTO assessment_notes (encounter_id, primary_diagnosis, clinical_reasoning, ai_differential_ranks, created_by)
             VALUES (?, ?, ?, ?, ?)`,
            [
              encounterId, 
              primaryDiag, 
              fullAssessment,
              aiDifferentialDiagnoses || null, 
              userId
            ]
          );
        }
      }

      // 4. Save Plan Notes & Medications
      if (plan && plan.trim()) {
        const [existingPlan] = await connection.query(
          `SELECT plan_id FROM plan_notes WHERE encounter_id = ?`,
          [encounterId]
        );

        if (existingPlan.length > 0) {
          await connection.query(
            `UPDATE plan_notes 
             SET treatment_plan = ?, 
                 medication_plan = ?,
                 updated_by = ?,
                 updated_at = NOW()
             WHERE encounter_id = ?`,
            [
              plan.trim(), 
              aiMedicationPlan || null, 
              userId,
              encounterId
            ]
          );
        } else {
          await connection.query(
            `INSERT INTO plan_notes (encounter_id, treatment_plan, medication_plan, created_by)
             VALUES (?, ?, ?, ?)`,
            [
              encounterId,
              plan.trim(),
              aiMedicationPlan || null,
              userId
            ]
          );
        }
      }

      // 5. Save Vitals
      if (temperature || bpSystolic || bpDiastolic || heartRate || oxygenSat || weight || height) {
        if (!staff_id) {
          throw new Error('Staff record not found for current user');
        }

        const [existingVitals] = await connection.query(
          `SELECT vital_id FROM vitals WHERE encounter_id = ?`,
          [encounterId]
        );

        const vitalData = {
          temperature_c: temperature ? parseFloat(temperature) : null,
          blood_pressure_systolic: bpSystolic ? parseInt(bpSystolic) : null,
          blood_pressure_diastolic: bpDiastolic ? parseInt(bpDiastolic) : null,
          heart_rate: heartRate ? parseInt(heartRate) : null,
          oxygen_saturation: oxygenSat ? parseFloat(oxygenSat) : null,
          weight_kg: weight ? parseFloat(weight) : null,
          height_cm: height ? parseFloat(height) : null,
        };

        if (existingVitals.length > 0) {
          let updateQuery = `UPDATE vitals SET `;
          const updateClauses = [];
          const updateValues = [];

          Object.entries(vitalData).forEach(([key, value]) => {
            if (value !== null) {
              updateClauses.push(`${key} = ?`);
              updateValues.push(value);
            }
          });

          if (updateClauses.length > 0) {
            updateQuery += updateClauses.join(', ') + ` WHERE encounter_id = ?`;
            updateValues.push(encounterId);
            await connection.query(updateQuery, updateValues);
          }
        } else {
          const columns = ['encounter_id', 'recorded_by'];
          const placeholders = ['?', '?'];
          const values = [encounterId, staff_id];

          Object.entries(vitalData).forEach(([key, value]) => {
            if (value !== null) {
              columns.push(key);
              placeholders.push('?');
              values.push(value);
            }
          });

          await connection.query(
            `INSERT INTO vitals (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
            values
          );
        }
      }

      // 6. Log to audit_logs
      const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
      await connection.query(
        `INSERT INTO audit_logs (user_id, action_type, table_name, record_id, new_data, ip_address)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          'UPDATE',
          'encounters',
          encounterId,
          JSON.stringify({
            subjective: subjective ? 'updated' : 'none',
            objective: objective ? 'updated' : 'none',
            assessment: assessment ? 'updated' : 'none',
            plan: plan ? 'updated' : 'none',
            vitals: [temperature, bpSystolic, bpDiastolic, heartRate, oxygenSat, weight, height].some(v => v) ? 'updated' : 'none',
          }),
          clientIp
        ]
      );

      // Commit transaction
      await connection.commit();

      return NextResponse.json({
        success: true,
        encounterId,
        message: 'SOAP notes and vitals saved successfully',
      });
    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    }
  } catch (error) {
    console.error('SOAP Save API Error:', error?.message);

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
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
