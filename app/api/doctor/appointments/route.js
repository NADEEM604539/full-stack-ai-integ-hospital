import { NextResponse } from 'next/server';
import { getDoctorAppointments } from '@/services/doctor';

export const dynamic = 'force-dynamic';

/**
 * GET /api/doctor/appointments
 * Get all appointments for authenticated doctor
 * 
 * RBAC:
 * ✓ Doctor (role_id = 2) can access only their own appointments
 * ✓ Admin (role_id = 1) can access any doctor's appointments
 * ✗ Other roles: Access Denied
 * 
 * Features:
 * ✓ Role-based access control (doctor only - role_id = 2)
 * ✓ Doctor isolation (can only see own appointments)
 * ✓ Parameterized queries (SQL injection prevention)
 */
export async function GET(request) {
  try {
    // getDoctorAppointments performs RBAC check internally
    // Documented below: function enforces doctor can only access own appointments
    const appointments = await getDoctorAppointments();

    return NextResponse.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error('Doctor Appointments API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch appointments' },
      { status: statusCode }
    );
  }
}
