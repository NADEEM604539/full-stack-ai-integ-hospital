import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkDoctorAccess } from '@/services/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/doctor/satisfaction-rating
 * Get doctor's average satisfaction rating and statistics
 * 
 * RBAC:
 * ✓ Doctor can see their own satisfaction stats
 * ✗ Other users: Access Denied
 */
export async function GET(request) {
  let connection;
  try {
    connection = await db.getConnection();
    const { doctorId } = await checkDoctorAccess(connection);
    console.log(`Getting satisfaction rating for doctor ID: ${doctorId}`);

    // Get average satisfaction rating - ONLY include actual ratings (non-NULL, > 0)
    // Example: ratings [5, 3, 2] = (5+3+2)/3 = 3.33 (NOT including NULL/0 values)
    const [satisfactionData] = await connection.query(
      `SELECT 
        AVG(CAST(satisfaction_rating AS DECIMAL(3,2))) as avg_rating,
        COUNT(CASE WHEN satisfaction_rating IS NOT NULL AND satisfaction_rating > 0 THEN 1 END) as total_ratings,
        COUNT(DISTINCT appointment_id) as total_appointments
       FROM appointments 
       WHERE doctor_id = ? AND is_deleted = FALSE`,
      [doctorId]
    );

    console.log('Raw satisfaction data:', satisfactionData);

    // Get rating breakdown (1-5 distribution) - only count non-NULL ratings
    const [ratingBreakdown] = await connection.query(
      `SELECT 
        ROUND(CAST(satisfaction_rating AS DECIMAL(3,1))) as rating,
        COUNT(*) as count
       FROM appointments 
       WHERE doctor_id = ? AND satisfaction_rating IS NOT NULL AND CAST(satisfaction_rating AS DECIMAL(3,1)) > 0 AND is_deleted = FALSE
       GROUP BY ROUND(CAST(satisfaction_rating AS DECIMAL(3,1)))
       ORDER BY rating DESC`,
      [doctorId]
    );

    console.log('Rating breakdown:', ratingBreakdown);

    connection.release();

    // Ensure avg_rating is properly formatted
    const avgRating = satisfactionData[0]?.avg_rating 
      ? parseFloat(satisfactionData[0].avg_rating).toFixed(1)
      : null;

    const totalRatings = satisfactionData[0]?.total_ratings || 0;

    console.log('Processed - avg_rating:', avgRating, 'total_ratings:', totalRatings);

    const breakdown = {};
    if (ratingBreakdown && ratingBreakdown.length > 0) {
      ratingBreakdown.forEach(row => {
        breakdown[Math.round(row.rating)] = row.count;
      });
    }

    const responseData = {
      success: true,
      data: {
        avg_rating: avgRating,
        total_ratings: totalRatings,
        total_appointments: satisfactionData[0]?.total_appointments || 0,
        rating_breakdown: breakdown
      }
    };

    console.log('Final response:', responseData);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Get Doctor Satisfaction Rating Error:', error?.message);
    
    const statusCode =
      error?.message?.includes('Authentication failed') ? 401 :
      error?.message?.includes('Access Denied') ? 403 :
      500;

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch satisfaction rating' },
      { status: statusCode }
    );
  } finally {
    if (connection) connection.release();
  }
}
