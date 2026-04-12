import { getNurseMedicineOrderDetail } from '@/services/nurse';

/**
 * GET /api/nurse/medicines/[orderId]
 * Get details of a specific medicine order requested by nurse
 */
export async function GET(request, { params }) {
  try {
    const { orderId } = params;

    if (!orderId || isNaN(orderId)) {
      return Response.json(
        {
          success: false,
          message: 'Invalid order ID'
        },
        { status: 400 }
      );
    }

    const orderDetail = await getNurseMedicineOrderDetail(parseInt(orderId));

    if (!orderDetail) {
      return Response.json(
        {
          success: false,
          message: 'Medicine order not found'
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: orderDetail
    });
  } catch (error) {
    console.error('Error in GET /api/nurse/medicines/[orderId]:', error);
    return Response.json(
      {
        success: false,
        message: error?.message || 'Failed to fetch medicine order'
      },
      { status: error?.message?.includes('Access Denied') ? 403 : 500 }
    );
  }
}
