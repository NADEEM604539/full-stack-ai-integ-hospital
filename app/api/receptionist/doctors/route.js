import { getAvailableDoctors, getDoctorAvailability } from '@/services/receptionist';

// GET available doctors or specific doctor availability
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const dayOfWeek = searchParams.get('dayOfWeek');

    // Get specific doctor's availability for a day
    if (doctorId && dayOfWeek) {
      const availability = await getDoctorAvailability(parseInt(doctorId, 10), dayOfWeek);

      return new Response(
        JSON.stringify({
          success: true,
          data: availability,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get all available doctors
    const doctors = await getAvailableDoctors();

    return new Response(
      JSON.stringify({
        success: true,
        data: doctors,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Doctors GET Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
