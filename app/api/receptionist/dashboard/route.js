import { getDashboardStats, getTodayAppointments } from '@/services/receptionist';

export async function GET(request) {
  try {
    const stats = await getDashboardStats();
    const appointments = await getTodayAppointments();

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          stats,
          appointments: appointments.slice(0, 4), // Show only first 4 for dashboard
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Dashboard API Error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });

    // Determine appropriate status code
    const statusCode = 
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('not found in database') ? 404 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Unknown error occurred',
        status: statusCode,
      }),
      { status: statusCode, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
