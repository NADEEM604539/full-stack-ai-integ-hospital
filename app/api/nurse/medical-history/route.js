import { NextResponse } from 'next/server';
import {
  getPatientMedicalHistory,
  addMedicalHistory,
  updateMedicalHistory,
  deleteMedicalHistory,
} from '@/services/nurse';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    const records = await getPatientMedicalHistory(parseInt(patientId));

    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error('Error fetching medical history:', error);
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch medical history' },
      { status: statusCode }
    );
  }
}

export async function POST(request) {
  try {
    const { patientId, conditionType, description, severity, status } = await request.json();

    if (!patientId || !conditionType) {
      return NextResponse.json(
        { error: 'Patient ID and condition type are required' },
        { status: 400 }
      );
    }

    const recordId = await addMedicalHistory(
      parseInt(patientId),
      conditionType,
      description,
      severity || 'Moderate',
      status || 'Active'
    );

    return NextResponse.json(
      { success: true, id: recordId, message: 'Medical history record added successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating medical history:', error?.message);
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to create medical history record' },
      { status: statusCode }
    );
  }
}

export async function PUT(request) {
  try {
    const { id, conditionType, description, severity, status } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    await updateMedicalHistory(parseInt(id), {
      conditionType,
      description,
      severity,
      status,
    });

    return NextResponse.json({
      success: true,
      message: 'Medical history record updated successfully',
    });
  } catch (error) {
    console.error('Error updating medical history:', error?.message);
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to update medical history record' },
      { status: statusCode }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    await deleteMedicalHistory(parseInt(id));

    return NextResponse.json({
      success: true,
      message: 'Medical history record deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting medical history:', error?.message);
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      error?.message?.includes('not found') ? 404 :
      500;

    return NextResponse.json(
      { error: error?.message || 'Failed to delete medical history record' },
      { status: statusCode }
    );
  }
}
