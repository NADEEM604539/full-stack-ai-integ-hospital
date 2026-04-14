import { NextRequest, NextResponse } from 'next/server';
import financeService from '@/services/finance';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
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
