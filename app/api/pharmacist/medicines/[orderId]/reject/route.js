import { rejectMedicineOrder } from '@/services/pharmacist';
import { getUserId } from '@/services/auth';
import pool from '@/lib/db';

/**
 * POST /api/pharmacist/medicines/[orderId]/reject
 * Reject a medicine order with reason
 */
export async function POST(request, { params }) {
  let connection;
  try {
    const { orderId } = params;
    const { reason } = await request.json();

    if (!orderId || isNaN(orderId)) {
      return Response.json(
        {
          success: false,
          message: 'Invalid order ID'
        },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return Response.json(
        {
          success: false,
          message: 'Rejection reason is required'
        },
        { status: 400 }
      );
    }

    // Get pharmacist ID from user
    const userId = await getUserId();
    if (!userId) {
      return Response.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get pharmacist staff_id
    connection = await pool.getConnection();
    const [staff] = await connection.query(
      `SELECT staff_id FROM staff s WHERE s.user_id = ?`,
      [userId]
    );

    if (!staff.length) {
      return Response.json(
        { success: false, message: 'Pharmacist not found' },
        { status: 404 }
      );
    }

    const pharmacistId = staff[0].staff_id;
    connection.release();

    const result = await rejectMedicineOrder(orderId, reason, pharmacistId);

    return Response.json({
      success: true,
      message: 'Medicine order rejected',
      data: result
    });
  } catch (error) {
    console.error('Error in POST /api/pharmacist/medicines/[orderId]/reject:', error);
    return Response.json(
      {
        success: false,
        message: error?.message || 'Failed to reject medicine order'
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
