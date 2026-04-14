import { NextRequest, NextResponse } from 'next/server';
import financeService from '@/services/finance';

export async function GET(req, { params }) {
  try {
    const { appointmentId } = params;
    
    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    const invoiceDetails = await financeService.getAppointmentInvoiceDetails(parseInt(appointmentId));

    if (!invoiceDetails) {
      return NextResponse.json(
        { success: false, error: 'Completed appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: invoiceDetails
    });
  } catch (err) {
    console.error('Error fetching appointment invoice details:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
