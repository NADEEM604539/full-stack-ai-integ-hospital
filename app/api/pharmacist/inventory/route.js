import { getInventory } from '@/services/pharmacist';

/**
 * GET /api/pharmacist/inventory
 * Get inventory/medicines for pharmacist
 * RBAC: Pharmacist (role_id=5) can only see inventory
 * All security checks are performed in the service layer
 */
export async function GET(request) {
  try {
    const inventory = await getInventory();

    return Response.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    const message = error?.message || 'Failed to fetch inventory';
    
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

    console.error('Error in GET /api/pharmacist/inventory:', error);
    return Response.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
