import { getAvailableTimeSlots } from '@/services/receptionist';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctor_id');
    const date = searchParams.get('date');

    if (!doctorId || !date) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Doctor ID and date are required',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const slots = await getAvailableTimeSlots(parseInt(doctorId, 10), date);

    return new Response(
      JSON.stringify({
        success: true,
        slots: slots,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('GET /api/receptionist/doctor-slots error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Failed to fetch available slots',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
