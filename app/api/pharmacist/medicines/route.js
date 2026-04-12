import { getPendingMedicineRequests } from '@/services/pharmacist';

/**
 * GET /api/pharmacist/medicines
 * Get all pending medicine requests for pharmacist approval
 */
export async function GET(request) {
  try {
    const requests = await getPendingMedicineRequests();
    return Response.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error in GET /api/pharmacist/medicines:', error);
    return Response.json(
      {
        success: false,
        message: error?.message || 'Failed to fetch pending medicine requests'
      },
      { status: error?.message?.includes('Access Denied') ? 403 : 500 }
    );
  }
}
