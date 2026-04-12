import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkNurseAccess } from '@/services/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/nurse/vitals
 * Get recent vitals records for nurse's department
 */
export async function GET(request) {
  let connection;
  try {
    connection = await db.getConnection();
    const { departmentId } = await checkNurseAccess(connection);

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
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        CONCAT(s.first_name, ' ', s.last_name) as recorded_by_name,
        e.encounter_type,
        e.chief_complaint
       FROM vitals v
       JOIN encounters e ON v.encounter_id = e.encounter_id
       JOIN patients p ON e.patient_id = p.patient_id
       JOIN staff s ON v.recorded_by = s.staff_id
       WHERE p.department_id = ? AND e.is_deleted = FALSE
       ORDER BY v.recorded_at DESC
       LIMIT 50`,
      [departmentId]
    );

    connection.release();

    return NextResponse.json({
      success: true,
      count: vitals.length,
      data: vitals,
    });
  } catch (error) {
    console.error('Nurse Vitals API Error:', error?.message);

    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch vitals' },
      { status: statusCode }
    );
  } finally {
    if (connection) connection.release();
  }
}

/**
 * POST /api/nurse/vitals
 * Record patient vitals
 * 
 * Request body:
 * {
 *   encounter_id: number,
 *   temperature_c: decimal,
 *   blood_pressure_systolic: int,
 *   blood_pressure_diastolic: int,
 *   heart_rate: int,
 *   oxygen_saturation: int,
 *   weight_kg: decimal,
 *   height_cm: decimal
 * }
 * 
 * AI features:
 * ✓ Automatic risk score calculation
 * ✓ Risk category classification
 * ✓ Alert generation if critical
 */
export async function POST(request) {
  let connection;
  try {
    connection = await db.getConnection();
    const { departmentId, nurseId, userId } = await checkNurseAccess(connection);

    const body = await request.json();
    const {
      encounter_id,
      temperature_c,
      blood_pressure_systolic,
      blood_pressure_diastolic,
      heart_rate,
      oxygen_saturation,
      weight_kg,
      height_cm,
    } = body;

    // Validate required fields
    if (!encounter_id) {
      return NextResponse.json(
        { success: false, error: 'encounter_id is required' },
        { status: 400 }
      );
    }

    // Verify encounter belongs to nurse's department
    const [encounterCheck] = await connection.query(
      `SELECT e.encounter_id FROM encounters e
       JOIN patients p ON e.patient_id = p.patient_id
       WHERE e.encounter_id = ? AND p.department_id = ? AND e.is_deleted = FALSE`,
      [encounter_id, departmentId]
    );

    if (encounterCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Encounter not found or not in your department' },
        { status: 403 }
      );
    }

    // Calculate basic AI risk score (simplified)
    let riskScore = 0;
    let riskCategory = 'Low';
    const alerts = [];

    // Temperature check (normal: 36.5-37.5°C)
    if (temperature_c && (temperature_c < 36 || temperature_c > 39)) {
      riskScore += temperature_c > 39 ? 30 : 20;
      if (temperature_c > 39) alerts.push({ alert_type: 'HIGH_FEVER', severity: 'HIGH', description: 'Fever above 39°C' });
    }

    // BP check
    if (blood_pressure_systolic && blood_pressure_systolic > 160) {
      riskScore += 25;
      alerts.push({ alert_type: 'HIGH_BP', severity: 'HIGH', description: 'Systolic BP > 160' });
    }

    // Heart rate check (normal: 60-100 bpm)
    if (heart_rate && (heart_rate < 50 || heart_rate > 120)) {
      riskScore += 15;
      if (heart_rate < 50) alerts.push({ alert_type: 'BRADYCARDIA', severity: 'MEDIUM', description: 'Heart rate too low' });
      if (heart_rate > 120) alerts.push({ alert_type: 'TACHYCARDIA', severity: 'MEDIUM', description: 'Heart rate too high' });
    }

    // O2 saturation check (should be > 95%)
    if (oxygen_saturation && oxygen_saturation < 95) {
      riskScore += oxygen_saturation < 90 ? 40 : 20;
      if (oxygen_saturation < 90) alerts.push({ alert_type: 'LOW_O2', severity: 'CRITICAL', description: 'O2 saturation critically low' });
    }

    // Determine risk category
    if (riskScore >= 50) riskCategory = 'Critical';
    else if (riskScore >= 30) riskCategory = 'High';
    else if (riskScore >= 15) riskCategory = 'Moderate';
    else riskCategory = 'Low';

    // Start transaction
    await connection.beginTransaction();

    try {
      const [result] = await connection.query(
        `INSERT INTO vitals (
          encounter_id, recorded_by, temperature_c, blood_pressure_systolic, 
          blood_pressure_diastolic, heart_rate, oxygen_saturation, weight_kg, 
          height_cm, ai_risk_score, ai_risk_category, ai_alerts, recorded_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          encounter_id, nurseId, temperature_c, blood_pressure_systolic,
          blood_pressure_diastolic, heart_rate, oxygen_saturation, weight_kg,
          height_cm, riskScore, riskCategory, JSON.stringify(alerts),
        ]
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: 'Vitals recorded successfully',
        data: {
          vital_id: result.insertId,
          risk_score: riskScore,
          risk_category: riskCategory,
          alerts: alerts.length > 0 ? alerts : null,
        },
      }, { status: 201 });

    } catch (txError) {
      await connection.rollback();
      throw txError;
    }

  } catch (error) {
    console.error('Record Vitals API Error:', error?.message);

    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to record vitals' },
      { status: statusCode }
    );
  } finally {
    if (connection) connection.release();
  }
}
