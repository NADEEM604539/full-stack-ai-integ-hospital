import { NextResponse } from 'next/server';
import { getAvailableTimeSlots } from '@/services/patient';

export const dynamic = 'force-dynamic';

/**
 * GET /api/patient/[patientId]/time-slots
 * Get available time slots for a doctor on a specific date
 * 
 * Query parameters:
 * - doctor_id: number (required)
 * - date: string in YYYY-MM-DD format (required)
 * 
 * RBAC:
 * ✓ Patient can view time slots (no additional restrictions)
 * ✗ Other users: Access Denied
 */
export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctor_id');
    const appointmentDate = searchParams.get('date');

    if (!doctorId || !appointmentDate) {
      return NextResponse.json(
        { success: false, error: 'doctor_id and date query parameters are required' },
        { status: 400 }
      );
    }

    const slots = await getAvailableTimeSlots(parseInt(doctorId), appointmentDate);

    return NextResponse.json({
      success: true,
      slots: slots,
    });
  } catch (error) {
    console.error('Get Time Slots API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch time slots' },
      { status: statusCode }
    );
  }
}
