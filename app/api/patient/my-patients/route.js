import { NextResponse } from 'next/server';
import { getManagedPatients } from '@/services/patient';

export const dynamic = 'force-dynamic';

/**
 * GET /api/patient/my-patients
 * Fetch all patient profiles managed by the authenticated user
 * 
 * RBAC:
 * ✓ Patient (role_id = 7) can access only their own patients
 * ✗ Other roles: Access Denied
 * 
 * Features:
 * ✓ Role-based access control (patient only - role_id = 7)
 * ✓ User isolation (can only see their own patients)
 * ✓ Supports family members (one user, multiple patients)
 * ✓ Parameterized queries (SQL injection prevention)
 * ✓ Soft delete support (is_deleted = FALSE)
 */
export async function GET(request) {
  try {
    const patients = await getManagedPatients();

    return NextResponse.json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    console.error('My Patients API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch patients' },
      { status: statusCode }
    );
  }
}
