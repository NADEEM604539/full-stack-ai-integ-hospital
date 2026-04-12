import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/doctor/[doctorId]/average-satisfaction
 * Get a doctor's average satisfaction rating (for booking flow)
 * Public endpoint - anyone can see doctor ratings
 */
export async function GET(request, { params }) {
  let connection;
  try {
    const { doctorId } = await params;

    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    connection = await db.getConnection();

    // Get average satisfaction rating
    const [satisfactionData] = await connection.query(
      `SELECT 
        AVG(CAST(satisfaction_rating AS DECIMAL(3,1))) as avg_rating,
        COUNT(CASE WHEN satisfaction_rating IS NOT NULL THEN 1 END) as total_ratings
       FROM appointments 
       WHERE doctor_id = ? AND satisfaction_rating IS NOT NULL AND is_deleted = FALSE`,
      [parseInt(doctorId)]
    );

    connection.release();

    const avgRating = satisfactionData[0]?.avg_rating 
      ? parseFloat(satisfactionData[0].avg_rating).toFixed(1) 
      : null;

    const totalRatings = satisfactionData[0]?.total_ratings || 0;

    return NextResponse.json({
      success: true,
      data: {
        doctor_id: doctorId,
        avg_rating: avgRating,
        total_ratings: totalRatings
      }
    });
  } catch (error) {
    console.error('Get Doctor Average Satisfaction Error:', error?.message);
    
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch doctor rating' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
