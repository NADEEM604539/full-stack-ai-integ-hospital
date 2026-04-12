import { NextResponse } from 'next/server';
import { getPatientAppointments } from '@/services/patient';

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
