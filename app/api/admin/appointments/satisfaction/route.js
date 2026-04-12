import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkAdminAccess } from '@/services/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/appointments/satisfaction
 * Get all appointments with satisfaction ratings (admin view)
 * 
 * RBAC:
 * ✓ Admin can view all appointments with satisfaction scores
 * ✗ Other users: Access Denied
 * 
 * Query Params:
 * - page: pagination (default 1)
 * - limit: items per page (default 20)
 * - sortBy: 'rating' | 'date' | 'doctor' (default date)
 * - order: 'ASC' | 'DESC'
 * - minRating: filter by minimum rating
 * - doctorId: filter by doctor
 * - status: filter by appointment status
 */
export async function GET(request) {
  let connection;
  try {
    await checkAdminAccess();
    connection = await db.getConnection();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const sortBy = url.searchParams.get('sortBy') || 'date';
    const order = url.searchParams.get('order') || 'DESC';
    const minRating = url.searchParams.get('minRating');
    const doctorId = url.searchParams.get('doctorId');
    const status = url.searchParams.get('status');

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = ['a.is_deleted = FALSE'];
    const params = [];

    if (minRating) {
      whereConditions.push('a.satisfaction_rating >= ?');
      params.push(parseFloat(minRating));
    }

    if (doctorId) {
      whereConditions.push('a.doctor_id = ?');
      params.push(parseInt(doctorId));
    }

    if (status) {
      whereConditions.push('a.status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Build ORDER BY clause
    let orderByClause = 'a.appointment_date DESC';
    if (sortBy === 'rating') {
      orderByClause = 'a.satisfaction_rating DESC';
    } else if (sortBy === 'doctor') {
      orderByClause = 's.first_name, s.last_name';
    }

    // Get total count
    const [countResult] = await connection.query(
      `SELECT COUNT(*) as total FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       JOIN doctors d ON a.doctor_id = d.doctor_id
       JOIN staff s ON d.staff_id = s.staff_id
       ${whereClause}`,
      params
    );

    const total = countResult[0]?.total || 0;

    // Get paginated results
    const [appointments] = await connection.query(
      `SELECT 
        a.appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.satisfaction_rating,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.mrn,
        CONCAT(s.first_name, ' ', s.last_name) as doctor_name,
        d.specialization,
        a.reason_for_visit
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       JOIN doctors d ON a.doctor_id = d.doctor_id
       JOIN staff s ON d.staff_id = s.staff_id
       ${whereClause}
       ORDER BY ${orderByClause}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    connection.release();

    return NextResponse.json({
      success: true,
      data: {
        appointments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get Appointments Satisfaction API Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch appointments' },
      { status: statusCode }
    );
  } finally {
    if (connection) connection.release();
  }
}
