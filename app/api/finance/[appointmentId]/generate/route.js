import { NextRequest, NextResponse } from 'next/server';
import financeService from '@/services/finance';

export async function POST(req, { params }) {
  try {
    const { appointmentId } = params;
    const { userId } = await req.json();

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const invoice = await financeService.generateInvoiceForAppointment(
      parseInt(appointmentId),
      parseInt(userId)
    );

    return NextResponse.json({
      success: true,
      message: 'Invoice generated successfully',
      data: invoice
    });
  } catch (err) {
    console.error('Error generating invoice:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: err.message.includes('already exists') ? 409 : 500 }
    );
  }
}
