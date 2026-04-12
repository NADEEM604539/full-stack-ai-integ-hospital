import pool from '@/lib/db';

/**
 * GET /api/nurse/inventory
 * Get available medicines from inventory for nurse to request
 */
export async function GET(request) {
  let connection;
  try {
    connection = await pool.getConnection();

    const [medicines] = await connection.query(`
      SELECT 
        ii.item_id,
        ii.item_name,
        ii.sku,
        ii.manufacturer,
        ii.unit_price,
        ii.quantity_in_stock,
        ii.reorder_level,
        ii.expiration_date
      FROM inventory_items ii
      WHERE ii.item_type = 'Medication' AND ii.reorder_level < ii.quantity_in_stock
      ORDER BY ii.item_name ASC
    `);

    return Response.json({
      success: true,
      data: medicines
    });
  } catch (error) {
    console.error('Error in GET /api/nurse/inventory:', error);
    return Response.json(
      {
        success: false,
        message: error?.message || 'Failed to fetch inventory'
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
