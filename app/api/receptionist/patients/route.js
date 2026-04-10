import {
  getPatientsList,
  searchPatients,
  getPatientById,
  createPatient,
} from '@/services/receptionist';

// GET patients list or specific patient
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('id');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit'), 10) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset'), 10) : 0;

    // Get specific patient by ID
    if (patientId) {
      const patient = await getPatientById(parseInt(patientId, 10));
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
    }

    // Search patients
    if (search && search.length >= 2) {
      const results = await searchPatients(search);
      return new Response(
        JSON.stringify({
          success: true,
          data: results,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get patients list with pagination
    const patients = await getPatientsList(limit, offset);

    return new Response(
      JSON.stringify({
        success: true,
        data: patients,
        pagination: {
          limit,
          offset,
          count: patients.length,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Patients GET Error:', {
      message: error?.message,
      name: error?.name,
    });
    
    const statusCode = 
      error?.message?.includes('not found in database') ? 404 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Failed to fetch patients',
      }),
      { status: statusCode, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST to register new patient
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.first_name || !body.last_name || !body.phone_number || !body.date_of_birth || !body.gender) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: first_name, last_name, phone_number, date_of_birth, gender',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await createPatient(body);

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        message: `Patient registered successfully with MRN: ${result.mrn}`,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Patients POST Error:', {
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
        error: error?.message || 'Failed to register patient',
      }),
      { status: statusCode, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
