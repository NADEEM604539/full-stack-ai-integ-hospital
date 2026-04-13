import { rejectMedicineOrder } from '@/services/pharmacist';

/**
 * POST /api/pharmacist/medicines/[orderId]/reject
 * Reject a medicine order with reason
 * RBAC: Pharmacist (role_id=5) can only reject requests from their department
 * All security checks are performed in the service layer
 */
export async function POST(request, { params }) {
  try {
    const { orderId } = await params;
    const { reason } = await request.json();

    if (!orderId || isNaN(orderId)) {
      return Response.json(
        { success: false, message: 'Invalid order ID' },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return Response.json(
        { success: false, message: 'Rejection reason is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Service function includes all RBAC checks
    const result = await rejectMedicineOrder(Number(orderId), reason.trim());

    return Response.json({
      success: true,
      message: 'Medicine order rejected',
      data: result
    });
  } catch (error) {
    const message = error?.message || 'Failed to reject medicine order';
    
    // Handle specific error types
    if (message.includes('Access Denied') || message.includes('RBAC Check Failed')) {
      return Response.json(
        { success: false, message },
        { status: 403 }
      );
    }
    
    if (message.includes('No user ID') || message.includes('Authentication failed')) {
      return Response.json(
        { success: false, message },
        { status: 401 }
      );
    }

    if (message.includes('not found') || message.includes('not exist')) {
      return Response.json(
        { success: false, message },
        { status: 404 }
      );
    }

    console.error('Error in POST /api/pharmacist/medicines/[orderId]/reject:', error);
    return Response.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
