import { NextResponse } from 'next/server';
import { getAllInvoices } from '@/services/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/payments
 * Retrieve all invoices with payment information
 * RBAC: Only admins can access
 */
export async function GET() {
  try {
    const invoices = await getAllInvoices();
    return NextResponse.json({ data: invoices });
  } catch (error) {
    console.error('Get invoices API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch invoices' },
      { status: statusCode }
    );
  }
}
