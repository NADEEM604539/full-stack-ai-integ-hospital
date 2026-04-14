import { NextRequest, NextResponse } from 'next/server';
import financeService from '@/services/finance';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId');
    const status = searchParams.get('status') || 'Completed';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const appointments = await financeService.getCompletedAppointments({
      departmentId: departmentId ? parseInt(departmentId) : null,
      status,
      limit,
      offset
    });

    return NextResponse.json({
      success: true,
      data: appointments,
      count: appointments.length
    });
  } catch (err) {
    console.error('Error fetching completed appointments:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
