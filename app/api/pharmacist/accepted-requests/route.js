import { NextResponse } from 'next/server';
import { checkPharmacistAccess } from '@/services/pharmacist';
import db from '@/lib/db';

/**
 * GET /api/pharmacist/accepted-requests
 * Get all accepted (approved) medicine orders for pharmacist's department
 */
export async function GET(request) {
  let connection;
  try {
    connection = await db.getConnection();
    const access = await checkPharmacistAccess(connection);
    const { departmentId } = access;

    // Get appointments in this department, then get accepted medicine orders for those appointments
    const [appointments] = await connection.query(`
      SELECT a.appointment_id
      FROM appointments a
      WHERE a.department_id = ? AND a.is_deleted = FALSE
      ORDER BY a.appointment_date DESC
    `, [departmentId]);

    if (appointments.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    const appointmentIds = appointments.map(apt => apt.appointment_id);

    // Get accepted medicine orders
    const [requests] = await connection.query(`
      SELECT 
        om.order_id,
        om.appointment_id,
        om.patient_id,
        om.status,
        om.total_amount,
        om.requested_by,
        om.approved_by,
        om.created_at,
        om.updated_at,
        p.mrn,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        a.appointment_date,
        a.appointment_time,
        CONCAT(pharma_staff.first_name, ' ', pharma_staff.last_name) as approval_name,
        COUNT(omi.item_id) as item_count
      FROM order_medicine om
      LEFT JOIN patients p ON om.patient_id = p.patient_id
      LEFT JOIN appointments a ON om.appointment_id = a.appointment_id
      LEFT JOIN staff pharma_staff ON om.approved_by = pharma_staff.staff_id
      LEFT JOIN order_medicine_items omi ON om.order_id = omi.order_id
      WHERE om.status = 'Accepted' AND om.appointment_id IN (${appointmentIds.map(() => '?').join(',')})
      GROUP BY om.order_id
      ORDER BY om.updated_at DESC
    `, appointmentIds);

    // Fetch items for each order
    const ordersWithItems = await Promise.all(requests.map(async (req) => {
      const [items] = await connection.query(`
        SELECT 
          omi.item_id,
          omi.medicine_name,
          omi.quantity,
          omi.unit_price
        FROM order_medicine_items omi
        WHERE omi.order_id = ?
        ORDER BY omi.item_id ASC
      `, [req.order_id]);
      
      return { ...req, items };
    }));

    return NextResponse.json({
      success: true,
      data: ordersWithItems
    });
  } catch (error) {
    console.error('Error fetching accepted requests:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch accepted requests' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
