import { NextResponse } from 'next/server';
import { getUserRoleId } from '@/services/auth';

/**
 * GET /api/auth/check-role
 * Check current user's role (for RBAC verification)
 */
export async function GET(request) {
  try {
    const roleId = await getUserRoleId();
    
    return NextResponse.json({
      success: true,
      role_id: roleId
    }, { status: 200 });
  } catch (error) {
    console.error('Error checking role:', error);
    return NextResponse.json({
      success: false,
      error: 'Unauthorized - Please log in'
    }, { status: 401 });
  }
}
