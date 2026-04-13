import { getInventory, checkPharmacistAccess } from '@/services/pharmacist';
import db from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * GET /api/pharmacist/inventory
 * Get inventory/medicines for pharmacist
 * RBAC: Pharmacist (role_id=5) can only see inventory
 * All security checks are performed in the service layer
 */
export async function GET(request) {
  try {
    const inventory = await getInventory();

    return Response.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    const message = error?.message || 'Failed to fetch inventory';
    
    // Handle specific error types
    if (message.includes('Access Denied') || message.includes('RBAC Check Failed')) {
      return Response.json(
        { success: false, message },
        { status: 403 }
      );
    }
    
    if (message.includes('No user ID') || message.includes('Authentication failed')) {
      return Response.json(
        { success: false, message },
        { status: 401 }
      );
    }

    console.error('Error in GET /api/pharmacist/inventory:', error);
    return Response.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pharmacist/inventory
 * Add a new medicine to inventory
 */
export async function POST(request) {
  let connection;
  try {
    connection = await db.getConnection();
    
    // Verify pharmacist access
    const access = await checkPharmacistAccess(connection);
    
    const body = await request.json();
    const { item_name, sku, unit_price, quantity_in_stock, reorder_level, manufacturer, expiration_date, category } = body;

    // Validation
    if (!item_name?.trim() || !sku?.trim() || !unit_price || quantity_in_stock === '' || !reorder_level) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert new medicine
    const [result] = await connection.query(
      `INSERT INTO inventory_items (item_name, sku, category, unit_price, quantity_in_stock, reorder_level, manufacturer, expiration_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [item_name, sku, category || null, unit_price, quantity_in_stock, reorder_level, manufacturer || null, expiration_date || null]
    );

    return NextResponse.json({
      success: true,
      message: 'Medicine added successfully',
      data: { item_id: result.insertId }
    });
  } catch (error) {
    console.error('Error adding medicine:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to add medicine' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
