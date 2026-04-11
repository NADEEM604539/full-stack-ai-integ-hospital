import { NextResponse } from 'next/server';
import { getAllRoles } from '@/services/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/roles
 * Get all available roles
 * Public endpoint - no RBAC check
 */
export async function GET(request) {
  try {
    const roles = await getAllRoles();
    return NextResponse.json({ success: true, data: roles }, { status: 200 });
  } catch (error) {
    console.error('Get roles API Error:', error?.message);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}
