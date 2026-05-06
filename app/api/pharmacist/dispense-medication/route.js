import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { dispenseMedication } from '@/services/pharmacist';
import { getUserId } from '@/services/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pharmacist/dispense-medication
 * Dispense medication using stored procedure (SP2: sp_dispense_medication)
 * Uses: T3 trigger to auto-deduct inventory
 * 
 * RBAC:
 * ✓ Pharmacist (role_id = 5) can dispense medications from their department
 * ✓ Admin (role_id = 1) can dispense any medication
 * ✗ Other roles: Access Denied
 * 
 * Request body:
 * {
 *   prescription_detail_id: number,
 *   quantity: number
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { prescription_detail_id, quantity } = body;

    // Validate required fields
    if (!prescription_detail_id || !quantity) {
      return NextResponse.json(
        { error: 'prescription_detail_id and quantity are required' },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'quantity must be greater than 0' },
        { status: 400 }
      );
    }

    // Call service function which calls stored procedure
    const result = await dispenseMedication(prescription_detail_id, quantity);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Medication dispensed successfully'
    });
  } catch (error) {
    console.error('Dispense Medication API Error:', error?.message);

    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      error?.message?.includes('Insufficient') ? 409 :
      400;

    return NextResponse.json(
      { error: error?.message || 'Failed to dispense medication' },
      { status: statusCode }
    );
  }
}

/**
 * GET /api/pharmacist/dispense-medication/dispensable
 * Get all dispensable prescriptions (pending) for pharmacist's department
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'dispensable') {
      const { getDispensablePrescriptions } = await import('@/services/pharmacist');
      const prescriptions = await getDispensablePrescriptions();

      return NextResponse.json({
        success: true,
        data: prescriptions,
        count: prescriptions.length
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Get Dispensable Prescriptions API Error:', error?.message);

    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      400;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch dispensable prescriptions' },
      { status: statusCode }
    );
  }
}
