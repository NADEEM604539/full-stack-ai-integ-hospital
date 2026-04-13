import { NextResponse } from 'next/server';
import { 
  requestMedicines, 
  getMedicineOrderWithItems,
  updateMedicineOrderItems,
  deleteMedicineOrder
} from '@/services/nurse';

export const dynamic = 'force-dynamic';

/**
 * GET /api/nurse/request-medicine/[orderId]
 * Get medicine order details for editing
 */
export async function GET(request, { params }) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID required' },
        { status: 400 }
      );
    }

    const orderData = await getMedicineOrderWithItems(parseInt(orderId));

    return NextResponse.json({
      success: true,
      data: orderData,
    });
  } catch (error) {
    console.error('Medicine Order Detail API Error:', error?.message);

    const statusCode =
      error?.message?.includes('not found') ? 404 :
      error?.message?.includes('cannot be edited') ? 400 :
      500;

    return NextResponse.json(
      { error: error.message || 'Failed to fetch medicine order' },
      { status: statusCode }
    );
  }
}

/**
 * PUT /api/nurse/request-medicine/[orderId]
 * Update medicine order items
 */
export async function PUT(request, { params }) {
  try {
    const { orderId } = await params;
    const { items } = await request.json();

    if (!orderId || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Order ID and items array required' },
        { status: 400 }
      );
    }

    const result = await updateMedicineOrderItems(parseInt(orderId), items);

    return NextResponse.json({
      success: true,
      message: 'Medicine order updated successfully',
      data: result,
    });
  } catch (error) {
    console.error('Medicine Order Update API Error:', error?.message);

    const statusCode =
      error?.message?.includes('not found') ? 404 :
      error?.message?.includes('cannot be edited') ? 400 :
      500;

    return NextResponse.json(
      { error: error.message || 'Failed to update medicine order' },
      { status: statusCode }
    );
  }
}

/**
 * DELETE /api/nurse/request-medicine/[orderId]
 * Delete medicine order
 */
export async function DELETE(request, { params }) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID required' },
        { status: 400 }
      );
    }

    const result = await deleteMedicineOrder(parseInt(orderId));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Medicine Order Delete API Error:', error?.message);

    const statusCode =
      error?.message?.includes('not found') ? 404 :
      error?.message?.includes('cannot be deleted') ? 400 :
      500;

    return NextResponse.json(
      { error: error.message || 'Failed to delete medicine order' },
      { status: statusCode }
    );
  }
}
