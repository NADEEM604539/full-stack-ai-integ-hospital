import { getPharmacistDashboard, getLowStockMedicines, getExpiringMedicines } from '@/services/pharmacist';

/**
 * GET /api/pharmacist/dashboard
 * Get pharmacist dashboard statistics
 * RBAC: Pharmacist (role_id=5) can only see data from their department
 * All security checks are performed in the service layer
 */
export async function GET(request) {
  try {
    // Fetch all dashboard data in parallel
    const [stats, lowStock, expiring] = await Promise.all([
      getPharmacistDashboard(),
      getLowStockMedicines(),
      getExpiringMedicines()
    ]);

    return Response.json({
      success: true,
      data: {
        stats,
        alerts: {
          lowStock: lowStock || [],
          expiring: expiring || []
        }
      }
    });
  } catch (error) {
    const message = error?.message || 'Failed to fetch dashboard data';
    
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

    console.error('Error in GET /api/pharmacist/dashboard:', error);
    return Response.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
