import { NextResponse } from 'next/server';
import { getPatientAppointments, bookAppointment } from '@/services/patient';

export const dynamic = 'force-dynamic';

/**
 * GET /api/patient/[patientId]/appointments
 * Fetch all appointments for a patient
 * 
 * RBAC:
 * ✓ User can access appointments only for their owned patients
 * ✗ Other users: Access Denied
 * 
 * Features:
 * ✓ User isolation (deep access control verification)
 * ✓ Complete appointment details with doctor info
 * ✓ Sorted by date (newest first)
 * ✓ Parameterized queries
 * ✓ Includes appointment status and notes
 */
export async function GET(request, { params }) {
  try {
    const { patientId } = await params;

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    const appointments = await getPatientAppointments(parseInt(patientId));

    return NextResponse.json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error('Patient Appointments API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch appointments' },
      { status: statusCode }
    );
  }
}

/**
 * POST /api/patient/[patientId]/appointments
 * Book a new appointment for the patient
 * 
 * RBAC:
 * ✓ Patient can book appointments only for their own patients
 * ✗ Other users: Access Denied
 * 
 * Request body:
 * {
 *   doctor_id: number,
 *   appointment_date: "YYYY-MM-DD",
 *   appointment_time: "HH:MM",
 *   reason_for_visit: string (optional)
 * }
 * 
 * Features:
 * ✓ User isolation (patient can only book for their own patients)
 * ✓ Department validation (doctor must be in patient's department)
 * ✓ Conflict detection (time slot availability)
 * ✓ Parameterized queries
 */
export async function POST(request, { params }) {
  try {
    const { patientId } = await params;

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.doctor_id || !body.appointment_date || !body.appointment_time) {
      return NextResponse.json(
        { success: false, error: 'doctor_id, appointment_date, and appointment_time are required' },
        { status: 400 }
      );
    }

    const appointment = await bookAppointment(parseInt(patientId), {
      doctor_id: body.doctor_id,
      appointment_date: body.appointment_date,
      appointment_time: body.appointment_time,
      reason_for_visit: body.reason_for_visit || null,
      duration_minutes: 30
    });

    return NextResponse.json({
      success: true,
      message: 'Appointment booked successfully',
      data: appointment,
    }, { status: 201 });
  } catch (error) {
    console.error('Book Appointment API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') || error?.message?.includes('access denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      error?.message?.includes('not in your department') ? 404 :
      500;

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to book appointment' },
      { status: statusCode }
    );
  }
}
