import { NextResponse } from 'next/server';
import { getPatientMedicinesByAppointment } from '@/services/patient';

export const dynamic = 'force-dynamic';

/**
 * GET /api/patient/[patientId]/medicines
 * Get all medicines prescribed to a patient, grouped by appointment
 * 
 * RBAC:
 * ✓ User can access medicines only for their owned patients
 * ✗ Other users: Access Denied
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

    const medicines = await getPatientMedicinesByAppointment(parseInt(patientId));

    return NextResponse.json({
      success: true,
      count: medicines.length,
      data: medicines,
    });
  } catch (error) {
    console.error('Patient Medicines API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch medicines' },
      { status: statusCode }
    );
  }
}
