import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let connection;
    try {
      connection = await db.getConnection();

      // Count active doctors (doctors linked to active staff)
      const [doctorsResult] = await connection.query(
        `SELECT COUNT(d.doctor_id) as count 
         FROM doctors d 
         JOIN staff s ON d.staff_id = s.staff_id 
         WHERE s.status = 'Active'`
      );
      const doctorsCount = doctorsResult[0]?.count || 0;

      // Count active departments
      const [deptResult] = await connection.query(
        `SELECT COUNT(*) as count FROM departments WHERE is_active = TRUE`
      );
      const departmentsCount = deptResult[0]?.count || 0;

      // Count active nurses (staff with role_id = 4)
      const [nursesResult] = await connection.query(
        `SELECT COUNT(s.staff_id) as count FROM staff s 
         JOIN users u ON s.user_id = u.user_id 
         WHERE u.role_id = 4 AND s.status = 'Active'`
      );
      const nursesCount = nursesResult[0]?.count || 0;

      // Count active pharmacists (staff with role_id = 5)
      const [pharmacistsResult] = await connection.query(
        `SELECT COUNT(s.staff_id) as count FROM staff s 
         JOIN users u ON s.user_id = u.user_id 
         WHERE u.role_id = 5 AND s.status = 'Active'`
      );
      const pharmacistsCount = pharmacistsResult[0]?.count || 0;

      // Count medicines
      let medicinesCount = 0;
      try {
        const [medsResult] = await connection.query(
          `SELECT COUNT(*) as count FROM medicines`
        );
        medicinesCount = medsResult[0]?.count || 0;
      } catch (err) {      }

      const stats = {
        success: true,
        data: {
          doctors: doctorsCount,
          departments: departmentsCount,
          nurses: nursesCount,
          pharmacists: pharmacistsCount,
          medicines: medicinesCount,
        },
      };
      return NextResponse.json(stats, { 
        headers: { 'Content-Type': 'application/json' }
      });
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error('[HOSPITAL/STATS] Error:', error.message);
    return NextResponse.json(
      {
        success: true,
        data: {
          doctors: 0,
          departments: 0,
          nurses: 0,
          pharmacists: 0,
          medicines: 0,
        },
      },
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

