import { NextRequest, NextResponse } from 'next/server';
import financeService from '@/services/finance';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const departmentId = searchParams.get('departmentId');
    const status = searchParams.get('status');

    const summary = await financeService.getFinancialSummary({
      startDate,
      endDate,
      departmentId: departmentId ? parseInt(departmentId) : null,
      status
    });

    return NextResponse.json({
      success: true,
      data: summary
    });
  } catch (err) {
    console.error('Error fetching financial summary:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
