import { NextResponse } from 'next/server';
import { getPatientInvoices } from '@/services/patient';

export const dynamic = 'force-dynamic';

/**
 * GET /api/patient/[patientId]/invoices
 * Fetch all invoices for a patient
 * 
 * RBAC:
 * ✓ User can access invoices only for their owned patients
 * ✗ Other users: Access Denied
 * 
 * Features:
 * ✓ User isolation (deep access control verification)
 * ✓ Payment status and amounts
 * ✓ Outstanding balance calculation
 * ✓ Days overdue tracking
 * ✓ Sorted by date (newest first)
 * ✓ Parameterized queries
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

    const invoices = await getPatientInvoices(parseInt(patientId));

    return NextResponse.json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    console.error('Patient Invoices API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch invoices' },
      { status: statusCode }
    );
  }
}
