import { NextResponse } from 'next/server';
import { getCurrentAdminUserId } from '@/services/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/current-user
 * Get current authenticated admin's user ID
 */
export async function GET() {
  try {
    const userId = await getCurrentAdminUserId();
    return NextResponse.json({ user_id: userId });
  } catch (error) {
    console.error('Current user API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to get current user' },
      { status: statusCode }
    );
  }
}
