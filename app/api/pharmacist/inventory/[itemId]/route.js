import { NextResponse } from 'next/server';
import { checkPharmacistAccess } from '@/services/pharmacist';
import db from '@/lib/db';

/**
 * PUT /api/pharmacist/inventory/[itemId]
 * Edit an existing medicine
 */
export async function PUT(request, { params }) {
  let connection;
  try {
    const { itemId } = await params;
    connection = await db.getConnection();
    
    // Verify pharmacist access
    const access = await checkPharmacistAccess(connection);
    
    const body = await request.json();
    const { item_name, unit_price, quantity_in_stock, reorder_level, manufacturer, expiration_date } = body;

    // Validation
    if (!item_name?.trim() || unit_price === '' || quantity_in_stock === '' || reorder_level === '') {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure numeric values
    const numericUnitPrice = Number(unit_price);
    const numericQuantity = Number(quantity_in_stock);
    const numericReorderLevel = Number(reorder_level);

    if (isNaN(numericUnitPrice) || isNaN(numericQuantity) || isNaN(numericReorderLevel)) {
      return NextResponse.json(
        { success: false, message: 'Invalid numeric values' },
        { status: 400 }
      );
    }

    // Update medicine
    await connection.query(
      `UPDATE inventory_items 
       SET item_name = ?, unit_price = ?, quantity_in_stock = ?, reorder_level = ?, manufacturer = ?, expiration_date = ?
       WHERE item_id = ?`,
      [item_name.trim(), numericUnitPrice, numericQuantity, numericReorderLevel, manufacturer?.trim() || null, expiration_date || null, itemId]
    );

    return NextResponse.json({
      success: true,
      message: 'Medicine updated successfully'
    });
  } catch (error) {
    console.error('Error updating medicine:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to update medicine' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

/**
 * DELETE /api/pharmacist/inventory/[itemId]
 * Delete a medicine from inventory
 */
export async function DELETE(request, { params }) {
  let connection;
  try {
    const { itemId } = await params;
    connection = await db.getConnection();
    
    // Verify pharmacist access
    const access = await checkPharmacistAccess(connection);
    
    // Delete medicine
    await connection.query(
      `DELETE FROM inventory_items WHERE item_id = ?`,
      [itemId]
    );

    return NextResponse.json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to delete medicine' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
