import { requestMedicines, getNurseMedicineRequests } from '@/services/nurse';

/**
 * POST /api/nurse/medicines/request
 * Nurse requests medicines for an encounter
 */
export async function POST(request) {
  try {
    const { encounterId, appointmentId, medicines } = await request.json();

    if (!encounterId || !medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return Response.json(
        {
          success: false,
          message: 'Invalid request: encounterId and medicines array required'
        },
        { status: 400 }
      );
    }

    const result = await requestMedicines(encounterId, appointmentId, medicines);

    return Response.json({
      success: true,
      message: 'Medicine order created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in POST /api/nurse/medicines/request:', error);
    return Response.json(
      {
        success: false,
        message: error?.message || 'Failed to create medicine order'
      },
      { status: error?.message?.includes('Access Denied') ? 403 : 500 }
    );
  }
}

/**
 * GET /api/nurse/medicines
 * Get all medicine requests by current nurse
 */
export async function GET(request) {
  try {
    const requests = await getNurseMedicineRequests();
    return Response.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error in GET /api/nurse/medicines:', error);
    return Response.json(
      {
        success: false,
        message: error?.message || 'Failed to fetch medicine requests'
      },
      { status: error?.message?.includes('Access Denied') ? 403 : 500 }
    );
  }
}
