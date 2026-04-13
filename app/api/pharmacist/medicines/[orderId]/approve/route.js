import { approveMedicineOrder } from '@/services/pharmacist';

/**
 * POST /api/pharmacist/medicines/[orderId]/approve
 * Approve a medicine order and add to invoice
 * RBAC: Pharmacist (role_id=5) can only approve requests from their department
 * All security checks are performed in the service layer
 */
export async function POST(request, { params }) {
  try {
    const { orderId } = await params;

    if (!orderId || isNaN(orderId)) {
      return Response.json(
        { success: false, message: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Service function includes all RBAC checks
    const result = await approveMedicineOrder(Number(orderId));

    return Response.json({
      success: true,
      message: 'Medicine order approved and added to invoice',
      data: result
    });
  } catch (error) {
    const message = error?.message || 'Failed to approve medicine order';
    
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

    console.error('Error in POST /api/pharmacist/medicines/[orderId]/approve:', error);
    return Response.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
