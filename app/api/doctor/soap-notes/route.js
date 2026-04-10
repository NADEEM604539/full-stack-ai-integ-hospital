import { NextResponse } from 'next/server';
import { getUserId } from '@/services/auth';
import { callClinicalAgent, parseSoapSuggestions } from '@/services/ai-agent';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/doctor/soap-notes/analyze
 * Send SOAP note draft to AI clinical agent for analysis
 * 
 * Request body:
 * {
 *   encounterId: number,
 *   subjective: string (optional),
 *   objective: string (optional),
 *   assessment: string (optional),
 *   plan: string (optional)
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   aiSuggestions: object (parsed SOAP suggestions from AI),
 *   rawResponse: string (raw AI response),
 *   error?: string (if analysis fails)
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { encounterId, subjective, objective, assessment, plan } = body;

    if (!encounterId) {
      return NextResponse.json(
        { error: 'encounterId is required' },
        { status: 400 }
      );
    }

    // Get current user for RBAC
    let userId;
    try {
      userId = await getUserId();
    } catch (authError) {
      throw new Error(`Authentication failed: ${authError?.message}`);
    }

    let connection;
    try {
      connection = await db.getConnection();
    } catch (dbError) {
      throw new Error(`Database connection failed: ${dbError?.message}`);
    }

    try {
      // Verify user is a doctor and owns this encounter
      const [userRows] = await connection.query(
        `SELECT role_id FROM users WHERE user_id = ?`,
        [userId]
      );

      if (!userRows.length) {
        throw new Error(`User ${userId} not found in database`);
      }

      const roleId = userRows[0].role_id;

      // Only doctors (role_id = 2) and admins (role_id = 1) can analyze SOAP
      if (roleId !== 2 && roleId !== 1) {
        throw new Error(`Access Denied: Required role DOCTOR (2) or ADMIN (1), got ${roleId}`);
      }

      // Verify encounter exists and doctor has access
      let encQuery = `
        SELECT e.encounter_id, e.doctor_id, e.patient_id, p.mrn,
               p.first_name, p.last_name
        FROM encounters e
        JOIN patients p ON e.patient_id = p.patient_id
        WHERE e.encounter_id = ?
      `;

      let encounters;

      if (roleId === 2) {
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

        [encounters] = await connection.query(encQuery, [encounterId, doctorId]);

        if (!encounters.length) {
          throw new Error('Encounter not found or access denied');
        }
      } else {
        [encounters] = await connection.query(encQuery, [encounterId]);

        if (!encounters.length) {
          throw new Error('Encounter not found');
        }
      }

      // Build clinical data to send to AI agent
      const clinicalData = buildClinicalData({
        encounterId,
        subjective,
        objective,
        assessment,
        plan,
        patientMRN: encounters?.[0]?.mrn || 'UNKNOWN',
      });

      console.log('🏥 Analyzing SOAP note for encounter:', encounterId);

      // Call AI agent (with 35 second timeout)
      const agentResponse = await callClinicalAgent(clinicalData);

      // Parse agent response into structured suggestions
      const suggestions = parseSoapSuggestions(agentResponse);

      connection.release();

      return NextResponse.json({
        success: true,
        encounterId,
        aiSuggestions: suggestions,
        message: 'SOAP analysis completed successfully',
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error('SOAP Analysis API Error:', error?.message);

    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      error?.message?.includes('timeout') ? 504 :
      500;

    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Failed to analyze SOAP note',
        errorType: error?.message?.includes('timeout') ? 'TIMEOUT' : 'SERVER_ERROR'
      },
      { status: statusCode }
    );
  }
}

/**
 * Build formatted clinical data string for AI agent
 */
function buildClinicalData({
  encounterId,
  subjective,
  objective,
  assessment,
  plan,
  patientMRN,
}) {
  const sections = [];

  sections.push(`Encounter ID: ${encounterId}`);
  sections.push(`Patient MRN: ${patientMRN}`);
  sections.push('');

  if (subjective && subjective.trim()) {
    sections.push('SUBJECTIVE (Chief Complaint & History):');
    sections.push(subjective.trim());
    sections.push('');
  }

  if (objective && objective.trim()) {
    sections.push('OBJECTIVE (Vitals, Exam, Labs, Imaging):');
    sections.push(objective.trim());
    sections.push('');
  }

  if (assessment && assessment.trim()) {
    sections.push('ASSESSMENT (Diagnosis & Clinical Reasoning):');
    sections.push(assessment.trim());
    sections.push('');
  }

  if (plan && plan.trim()) {
    sections.push('PLAN (Treatment, Medications, Follow-up):');
    sections.push(plan.trim());
    sections.push('');
  }

  return sections.join('\n');
}
