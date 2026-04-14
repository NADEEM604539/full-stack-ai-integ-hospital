import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req, { params }) {
  try {
    const { invoiceId } = params;

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    const connection = await db.getConnection();
    
    try {
      // Get invoice details with line items
      const [lineItems] = await connection.query(
        `SELECT 
          ili.line_id,
          ili.description,
          ili.item_type,
          ili.quantity,
          ili.unit_price,
          ili.line_total
         FROM invoice_line_items ili
         WHERE ili.invoice_id = ?
         ORDER BY ili.item_type DESC, ili.line_id`,
        [invoiceId]
      );

      const [invoice] = await connection.query(
        `SELECT 
          i.invoice_id,
          i.subtotal,
          i.tax_amount,
          i.discount_amount,
          i.total_amount,
          i.amount_paid,
          (i.total_amount - COALESCE(i.amount_paid, 0)) as outstanding_balance
         FROM invoices i
         WHERE i.invoice_id = ?`,
        [invoiceId]
      );

      connection.release();

      return NextResponse.json({
        success: true,
        data: {
          invoice: invoice[0],
          lineItems: lineItems
        }
      });
    } catch (err) {
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error('Error fetching invoice details:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
