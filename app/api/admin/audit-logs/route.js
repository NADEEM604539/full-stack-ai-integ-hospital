import { NextResponse } from 'next/server';
import { getAuditLogs } from '@/services/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/audit-logs
 * Get audit logs with optional filtering
 * RBAC: Only admins can access
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const table_name = searchParams.get('table_name');
    const action_type = searchParams.get('action_type');

    const result = await getAuditLogs(table_name, action_type, limit, offset);

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      limit,
      offset,
      page: result.page,
      pageSize: result.pageSize
    }, { status: 200 });
  } catch (error) {
    console.error('Get audit logs API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch audit logs' },
      { status: statusCode }
    );
  }
}
