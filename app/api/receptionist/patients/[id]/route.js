import {
  getPatientById,
  updatePatient,
} from '@/services/receptionist';

// GET specific patient by ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Patient ID is required',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const patient = await getPatientById(parseInt(id, 10));

    if (!patient) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Patient not found',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: patient,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Patients GET [id] Error:', {
      message: error?.message,
      name: error?.name,
    });

    const statusCode =
      error?.message?.includes('not found') ? 404 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Failed to fetch patient',
      }),
      { status: statusCode, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT to update patient
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Patient ID is required',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate at least one required field is provided
    if (!body.first_name && !body.last_name && !body.email && !body.phone_number) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'At least one field (first_name, last_name, email, or phone_number) must be provided',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updatedPatient = await updatePatient(parseInt(id, 10), body);

    if (!updatedPatient) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to update patient',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: updatedPatient,
        message: 'Patient updated successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Patients PUT [id] Error:', {
      message: error?.message,
      name: error?.name,
    });

    const statusCode =
      error?.message?.includes('not in your department') ? 403 :
      error?.message?.includes('not found') ? 404 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Failed to update patient',
      }),
      { status: statusCode, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
