import { NextRequest, NextResponse } from 'next/server';
import financeService from '@/services/finance';
import { generateInvoiceFromEncounter, getPatientBalance, getOutstandingBills, getBillingAnalytics } from '@/services/finance';
import { getUserId } from '@/services/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    
    // Handle new action-based routes
    if (action === 'patient-balance') {
      const patientId = searchParams.get('patient_id');
      if (!patientId) {
        return NextResponse.json(
          { error: 'patient_id is required' },
          { status: 400 }
        );
      }
      const balance = await getPatientBalance(parseInt(patientId));
      return NextResponse.json({
        success: true,
        patient_id: patientId,
        outstanding_balance: balance
      });
    }

    if (action === 'outstanding-bills') {
      const bills = await getOutstandingBills();
      return NextResponse.json({
        success: true,
        data: bills,
        count: bills.length
      });
    }

    if (action === 'analytics') {
      const startDate = searchParams.get('start_date');
      const endDate = searchParams.get('end_date');
      if (!startDate || !endDate) {
        return NextResponse.json(
          { error: 'start_date and end_date are required (YYYY-MM-DD format)' },
          { status: 400 }
        );
      }
      const analytics = await getBillingAnalytics(startDate, endDate);
      return NextResponse.json({
        success: true,
        data: analytics,
        period: { start_date: startDate, end_date: endDate }
      });
    }

    // Original GET logic for listing invoices
    const status = searchParams.get('status');
    const patientId = searchParams.get('patientId');
    const departmentId = searchParams.get('departmentId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const invoices = await financeService.getInvoicesWithDetails({
      status,
      patientId: patientId ? parseInt(patientId) : null,
      departmentId: departmentId ? parseInt(departmentId) : null,
      limit,
      offset
    });

    return NextResponse.json({
      success: true,
      data: invoices,
      count: invoices.length
    });
  } catch (err) {
    console.error('Error fetching invoices:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/finance/invoices?action=generate
 * Generate invoice using stored procedure (SP3: sp_generate_invoice)
 * Uses: T5 trigger to auto-calculate totals, T9 trigger to validate
 * 
 * Request body:
 * {
 *   encounter_id: number,
 *   patient_id: number
 * }
 */
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'generate') {
      const body = await request.json();
      const { encounter_id, patient_id } = body;

      if (!encounter_id || !patient_id) {
        return NextResponse.json(
          { error: 'encounter_id and patient_id are required' },
          { status: 400 }
        );
      }

      const result = await generateInvoiceFromEncounter(encounter_id, patient_id);

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Invoice generated successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Valid action: generate' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Generate Invoice API Error:', error?.message);

    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      400;

    return NextResponse.json(
      { error: error?.message || 'Failed to generate invoice' },
      { status: statusCode }
    );
  }
}
