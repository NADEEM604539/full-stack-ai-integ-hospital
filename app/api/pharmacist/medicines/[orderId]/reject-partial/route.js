import { NextResponse } from 'next/server';
import { getMedicineOrderDetail, checkPharmacistAccess } from '@/services/pharmacist';
import db from '@/lib/db';

/**
 * POST /api/pharmacist/medicines/[orderId]/reject-partial
 * Reject specific medicine items from an order with reasons
 * Body: { itemReasons: { itemId: 'reason', ... } }
 */
export async function POST(request, { params }) {
  let connection;
  try {
    const { orderId } = await params;
    const { itemReasons } = await request.json();

    if (!orderId || !itemReasons || typeof itemReasons !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Order ID and item rejection reasons required' },
        { status: 400 }
      );
    }

    connection = await db.getConnection();

    // Get pharmacist access info (validates role and gets staff_id)
    const access = await checkPharmacistAccess(connection);
    const { pharmacistId } = access;

    try {
      // Get full order details to verify access
      const orderDetail = await getMedicineOrderDetail(parseInt(orderId));

      if (!orderDetail) {
        throw new Error('Order not found');
      }

      // Update rejection status for each item
      const rejectedItemIds = Object.keys(itemReasons);
      let rejectedCount = 0;

      for (const itemIdStr of rejectedItemIds) {
        const itemId = parseInt(itemIdStr);
        const reason = itemReasons[itemIdStr];

        // Verify item exists in order
        const itemExists = orderDetail.items.some(item => item.item_id === itemId);
        if (!itemExists) continue;

        // Insert rejection record (create a simple audit trail)
        // Since order_medicine_items doesn't have rejection tracking,
        // we'll add a note to indicate rejection
        await connection.query(
          `UPDATE order_medicine_items
           SET notes = CONCAT(IFNULL(notes, ''), ' [REJECTED: ', ?, ']')
           WHERE item_id = ? AND order_id = ?`,
          [reason || 'No reason provided', itemId, orderId]
        );

        rejectedCount++;
      }

      return NextResponse.json({
        success: true,
        message: `${rejectedCount} medicine item(s) marked as rejected`,
        data: {
          orderId: orderId,
          rejectedItemCount: rejectedCount
        }
      });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error in reject-partial:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to reject medicines' },
      { status: error?.message?.includes('Unauthorized') ? 403 : 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
