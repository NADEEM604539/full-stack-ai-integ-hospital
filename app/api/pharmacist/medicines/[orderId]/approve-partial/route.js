import { NextResponse } from 'next/server';
import { getMedicineOrderDetail, checkPharmacistAccess } from '@/services/pharmacist';
import db from '@/lib/db';

/**
 * POST /api/pharmacist/medicines/[orderId]/approve-partial
 * Approve specific medicine items from an order (partial approval)
 * Body: { itemIds: [1, 2, 3] }
 */
export async function POST(request, { params }) {
  let connection;
  try {
    const { orderId } = await params;
    const { itemIds } = await request.json();

    if (!orderId || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Order ID and item IDs array required' },
        { status: 400 }
      );
    }

    connection = await db.getConnection();

    // Get pharmacist access info (validates role and gets staff_id)
    const access = await checkPharmacistAccess(connection);
    const { pharmacistId } = access;
    await connection.beginTransaction();

    try {
      // Get full order details to verify access and get item data
      const orderDetail = await getMedicineOrderDetail(parseInt(orderId));

      if (!orderDetail) {
        throw new Error('Order not found');
      }

      // Verify items exist in this order
      const approvedItems = itemIds.map(id => parseInt(id));
      const validItems = orderDetail.items.filter(item => approvedItems.includes(item.item_id));

      if (validItems.length === 0) {
        throw new Error('No valid items found to approve in this order');
      }

      // Calculate total for approved items only
      let approvedTotal = 0;
      validItems.forEach(item => {
        approvedTotal += (item.quantity * Number(item.unit_price));
      });

      // Find or create encounter for this appointment
      let encounterId;
      const [encounters] = await connection.query(
        `SELECT encounter_id FROM encounters WHERE appointment_id = ? LIMIT 1`,
        [orderDetail.appointment_id]
      );

      if (encounters.length > 0) {
        encounterId = encounters[0].encounter_id;
      } else {
        // Create new encounter
        const [apptData] = await connection.query(
          `SELECT patient_id, doctor_id FROM appointments WHERE appointment_id = ?`,
          [orderDetail.appointment_id]
        );

        const [encounterResult] = await connection.query(
          `INSERT INTO encounters (patient_id, doctor_id, appointment_id, encounter_type, admission_date, chief_complaint, status, created_by)
           VALUES (?, ?, ?, 'Outpatient', NOW(), 'Medicine Order Approval', 'Active', ?)`,
          [apptData[0].patient_id, apptData[0].doctor_id, orderDetail.appointment_id, pharmacistId]
        );
        encounterId = encounterResult.insertId;
      }

      // Create or get invoice
      const [invoices] = await connection.query(
        `SELECT invoice_id FROM invoices WHERE encounter_id = ? LIMIT 1`,
        [encounterId]
      );

      let invoiceId;
      if (invoices.length > 0) {
        invoiceId = invoices[0].invoice_id;
      } else {
        const [invoiceResult] = await connection.query(
          `INSERT INTO invoices (encounter_id, patient_id, invoice_date, due_date, subtotal, tax_amount, total_amount, status, created_by)
           VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 0, 0, 0, 'Unpaid', ?)`,
          [encounterId, orderDetail.patient_id, pharmacistId]
        );
        invoiceId = invoiceResult.insertId;
      }

      // Add line items for approved medicines
      for (const item of validItems) {
        await connection.query(
          `INSERT INTO invoice_line_items (invoice_id, description, item_type, quantity, unit_price)
           VALUES (?, ?, 'Medication', ?, ?)`,
          [invoiceId, `${item.medicine_name} (Order #${orderId})`, item.quantity, item.unit_price]
        );
      }

      // Update invoice totals
      const [lineTotals] = await connection.query(
        `SELECT SUM(quantity * unit_price) as subtotal FROM invoice_line_items WHERE invoice_id = ?`,
        [invoiceId]
      );

      const subtotal = Number(lineTotals[0]?.subtotal) || 0;
      const tax = Number(subtotal) * 0.10;
      const total = Number(subtotal) + Number(tax);

      await connection.query(
        `UPDATE invoices SET subtotal = ?, tax_amount = ?, total_amount = ?, updated_at = NOW() WHERE invoice_id = ?`,
        [subtotal, tax, total, invoiceId]
      );

      // Update order status if all items approved
      if (validItems.length === orderDetail.items.length) {
        // All items approved - mark order as Accepted
        await connection.query(
          `UPDATE order_medicine SET status = 'Accepted', approved_by = ?, updated_at = NOW() WHERE order_id = ?`,
          [pharmacistId, orderId]
        );
      } else {
        // Partial approval - keep status as Pending
        await connection.query(
          `UPDATE order_medicine SET updated_at = NOW() WHERE order_id = ?`,
          [orderId]
        );
      }

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: `${validItems.length} medicine item(s) approved`,
        data: {
          orderId: orderId,
          approvedItemCount: validItems.length,
          totalApprovedAmount: approvedTotal,
          invoiceId: invoiceId,
          allApproved: validItems.length === orderDetail.items.length
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error in approve-partial:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to approve medicines' },
      { status: error?.message?.includes('Unauthorized') ? 403 : 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
