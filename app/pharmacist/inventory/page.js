'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

/**
 * Pharmacist Inventory Management Page
 * Pharmacist can:
 * - View all medicines in inventory
 * - Add new medicines
 * - Edit existing medicines (name, quantity, price, reorder level, expiry)
 * - See stock levels and reorder points
 */
export default function PharmacistInventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    item_name: '',
    sku: '',
    item_type: '',
    unit_price: '',
    quantity_in_stock: '',
    reorder_level: '',
    manufacturer: '',
    expiration_date: '',
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    try {
      setLoading(true);
      const response = await fetch('/api/pharmacist/inventory');
      if (!response.ok) {
        throw new Error(`Failed to fetch inventory (${response.status})`);
      }
      const data = await response.json();
      setInventory(data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }

  // Filter medicines based on status and search term
  const filteredMedicines = inventory.filter((med) => {
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'LOW_STOCK' && med.stock_status === 'LOW_STOCK') ||
      (filterStatus === 'EXPIRING_SOON' && med.stock_status === 'EXPIRING_SOON') ||
      (filterStatus === 'EXPIRED' && med.stock_status === 'EXPIRED');

    const matchesSearch =
      med.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.sku.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Calculate statistics
  const stats = {
    total: inventory.length,
    lowStock: inventory.filter((m) => m.stock_status === 'LOW_STOCK').length,
    expiring: inventory.filter((m) => m.stock_status === 'EXPIRING_SOON').length,
    expired: inventory.filter((m) => m.stock_status === 'EXPIRED').length,
    totalValue: inventory.reduce((sum, m) => sum + (Number(m.quantity_in_stock) * Number(m.unit_price)), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-6">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Loading inventory...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">📦 Inventory Management</h1>
            <p className="text-gray-600 mt-1">View and manage medicines and medical supplies</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchInventory}
              className="bg-white px-4 py-2 rounded-lg shadow hover:shadow-lg transition-all text-sm font-semibold text-gray-700"
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow-lg font-semibold transition-all"
            >
              ➕ Add Medicine
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Total Medicines */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <p className="text-gray-700 text-sm font-bold uppercase">Total Medicines</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total}</p>
          <p className="text-xs text-gray-600 mt-1">In stock</p>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
          <p className="text-gray-700 text-sm font-bold uppercase">Low Stock</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.lowStock}</p>
          <p className="text-xs text-gray-600 mt-1">Need reordering</p>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
          <p className="text-gray-700 text-sm font-bold uppercase">Expiring Soon</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{stats.expiring}</p>
          <p className="text-xs text-gray-600 mt-1">Within 30 days</p>
        </div>

        {/* Expired */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
          <p className="text-gray-700 text-sm font-bold uppercase">Expired</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{stats.expired}</p>
          <p className="text-xs text-gray-600 mt-1">Past expiry date</p>
        </div>

        {/* Total Value */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <p className="text-gray-700 text-sm font-bold uppercase">Total Value</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            ${Number(stats.totalValue).toFixed(2)}
          </p>
          <p className="text-xs text-gray-600 mt-1">Inventory value</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              🔍 Search by Medicine Name or SKU
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g., Aspirin, MED-001"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            />
          </div>

          {/* Filter */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            >
              <option value="ALL">📦 All Medicines ({stats.total})</option>
              <option value="LOW_STOCK">⚠️ Low Stock ({stats.lowStock})</option>
              <option value="EXPIRING_SOON">⏰ Expiring Soon ({stats.expiring})</option>
              <option value="EXPIRED">❌ Expired ({stats.expired})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Medicines List */}
      {filteredMedicines.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-gray-600 text-lg">
            {searchTerm ? 'No medicines found matching your search' : 'No medicines in this category'}
          </p>
          <p className="text-gray-500 mt-2">
            {searchTerm && 'Try adjusting your search terms'}
          </p>
          <Link
            href="/pharmacist/dashboard"
            className="inline-block mt-4 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
          >
            Back to Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredMedicines.map((medicine) => {
            const statusColor =
              medicine.stock_status === 'LOW_STOCK'
                ? 'border-red-500 bg-red-50'
                : medicine.stock_status === 'EXPIRING_SOON'
                ? 'border-orange-500 bg-orange-50'
                : medicine.stock_status === 'EXPIRED'
                ? 'border-purple-500 bg-purple-50'
                : 'border-green-500 bg-green-50';

            const statusEmoji =
              medicine.stock_status === 'LOW_STOCK'
                ? '⚠️'
                : medicine.stock_status === 'EXPIRING_SOON'
                ? '⏰'
                : medicine.stock_status === 'EXPIRED'
                ? '❌'
                : '✅';

            return (
              <div
                key={medicine.item_id}
                className={`rounded-lg shadow-lg p-6 border-l-4 ${statusColor} hover:shadow-xl transition-shadow`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {medicine.item_name}
                    </h3>
                    <p className="text-sm text-gray-600">SKU: {medicine.sku}</p>
                  </div>
                  <span className="text-2xl">{statusEmoji}</span>
                </div>

                  {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  {/* Stock Information */}
                  <div>
                    <p className="text-gray-700 font-semibold text-xs uppercase">Current Stock</p>
                    <p className="font-bold text-gray-900 text-lg">
                      {medicine.quantity_in_stock}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-700 font-semibold text-xs uppercase">Reorder Level</p>
                    <p className="font-bold text-gray-900 text-lg">
                      {medicine.reorder_level}
                    </p>
                  </div>

                  {/* Price Information */}
                  <div>
                    <p className="text-gray-700 font-semibold text-xs uppercase">Unit Price</p>
                    <p className="font-bold text-gray-900">
                      ${Number(medicine.unit_price).toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-700 font-semibold text-xs uppercase">Total Value</p>
                    <p className="font-bold text-green-700 text-lg">
                      ${(Number(medicine.quantity_in_stock) * Number(medicine.unit_price)).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Status Info */}
                <div className="pt-4 border-t border-gray-200">
                  {medicine.stock_status === 'LOW_STOCK' && (
                    <p className="text-red-700 text-sm font-semibold">
                      ⚠️ Stock below reorder level. {medicine.reorder_level - medicine.quantity_in_stock} units short.
                    </p>
                  )}

                  {medicine.stock_status === 'EXPIRING_SOON' && medicine.expiration_date && (
                    <p className="text-orange-700 text-sm font-semibold">
                      ⏰ Expires on {format(new Date(medicine.expiration_date), 'MMM dd, yyyy')}
                    </p>
                  )}

                  {medicine.stock_status === 'EXPIRED' && medicine.expiration_date && (
                    <p className="text-purple-700 text-sm font-semibold">
                      ❌ Expired on {format(new Date(medicine.expiration_date), 'MMM dd, yyyy')}
                    </p>
                  )}

                  {medicine.stock_status === 'OK' && medicine.expiration_date && (
                    <p className="text-green-700 text-sm font-semibold">
                      ✅ Expires on {format(new Date(medicine.expiration_date), 'MMM dd, yyyy')}
                    </p>
                  )}

                  {medicine.stock_status === 'OK' && !medicine.expiration_date && (
                    <p className="text-green-700 text-sm font-semibold">
                      ✅ No expiration date - Non-perishable item
                    </p>
                  )}
                </div>

                {/* Additional Info */}
                {medicine.manufacturer && (
                  <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
                    <p className="text-gray-700 font-semibold text-xs uppercase">Manufacturer</p>
                    <p className="font-semibold text-gray-900">{medicine.manufacturer}</p>
                  </div>
                )}

                {/* Orders Info */}
                {(medicine.total_ordered || medicine.pending_orders) && (
                  <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
                    <p className="text-gray-700 font-semibold">Total ordered: <span className="text-gray-900">{medicine.total_ordered || 0}</span> units</p>
                    <p className="text-gray-700 font-semibold">Pending orders: <span className="text-red-700 font-bold">{medicine.pending_orders || 0}</span> units</p>
                  </div>
                )}

                {/* Edit Button */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setEditingItem(medicine);
                      setFormData({
                        item_name: medicine.item_name,
                        sku: medicine.sku,
                        item_type: medicine.item_type || '',
                        unit_price: medicine.unit_price,
                        quantity_in_stock: medicine.quantity_in_stock,
                        reorder_level: medicine.reorder_level,
                        manufacturer: medicine.manufacturer || '',
                        expiration_date: medicine.expiration_date ? medicine.expiration_date.split('T')[0] : '',
                      });
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                  >
                    ✏️ Edit Medicine
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-screen overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-green-600 text-white p-6 sticky top-0">
              <h2 className="text-2xl font-bold">➕ Add New Medicine</h2>
              <p className="text-green-100 text-sm mt-1">Fill in the details below</p>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setProcessingId('adding');
                try {
                  const response = await fetch('/api/pharmacist/inventory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                  });
                  const data = await response.json();
                  if (!response.ok) throw new Error(data.message);
                  
                  setMessage('✅ Medicine added successfully');
                  setMessageType('success');
                  setShowAddModal(false);
                  setFormData({
                    item_name: '',
                    sku: '',
                    item_type: '',
                    unit_price: '',
                    quantity_in_stock: '',
                    reorder_level: '',
                    manufacturer: '',
                    expiration_date: '',
                  });
                  setTimeout(() => {
                    setMessage(null);
                    fetchInventory();
                  }, 2000);
                } catch (err) {
                  setMessage('❌ ' + (err.message || 'Failed to add medicine'));
                  setMessageType('error');
                } finally {
                  setProcessingId(null);
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Medicine Name *</label>
                <input
                  type="text"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  placeholder="e.g., Aspirin 500mg"
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">SKU *</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g., MED-001"
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Type *</label>
                  <select
                    value={formData.item_type || ''}
                    onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  >
                    <option value="">Select Type</option>
                    <option value="Medication">💊 Medication</option>
                    <option value="Medical Supply">🏥 Medical Supply</option>
                    <option value="Equipment">⚙️ Equipment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Unit Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    placeholder="0.00"
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Quantity *</label>
                  <input
                    type="number"
                    value={formData.quantity_in_stock}
                    onChange={(e) => setFormData({ ...formData, quantity_in_stock: e.target.value })}
                    placeholder="0"
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Reorder Level *</label>
                <input
                  type="number"
                  value={formData.reorder_level}
                  onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                  placeholder="Minimum stock level"
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g., Pharma Co."
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Expiration Date</label>
                  <input
                    type="date"
                    value={formData.expiration_date}
                    onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === 'adding'}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 transition"
                >
                  {processingId === 'adding' ? '⏳ Adding...' : '✅ Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Medicine Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-screen overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-blue-600 text-white p-6 sticky top-0">
              <h2 className="text-2xl font-bold">✏️ Edit Medicine</h2>
              <p className="text-blue-100 text-sm mt-1">Update medicine details below</p>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setProcessingId(`editing-${editingItem.item_id}`);
                try {
                  const response = await fetch(`/api/pharmacist/inventory/${editingItem.item_id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                  });
                  const data = await response.json();
                  if (!response.ok) throw new Error(data.message);
                  
                  setMessage('✅ Medicine updated successfully');
                  setMessageType('success');
                  setEditingItem(null);
                  setTimeout(() => {
                    setMessage(null);
                    fetchInventory();
                  }, 2000);
                } catch (err) {
                  setMessage('❌ ' + (err.message || 'Failed to update medicine'));
                  setMessageType('error');
                } finally {
                  setProcessingId(null);
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Medicine Name *</label>
                <input
                  type="text"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  placeholder="e.g., Aspirin 500mg"
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">SKU *</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g., MED-001"
                    required
                    disabled
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-500 bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Type</label>
                  <select
                    value={formData.item_type || ''}
                    onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">Select Type</option>
                    <option value="Medication">💊 Medication</option>
                    <option value="Medical Supply">🏥 Medical Supply</option>
                    <option value="Equipment">⚙️ Equipment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Unit Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    placeholder="0.00"
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Quantity *</label>
                  <input
                    type="number"
                    value={formData.quantity_in_stock}
                    onChange={(e) => setFormData({ ...formData, quantity_in_stock: e.target.value })}
                    placeholder="0"
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Reorder Level *</label>
                <input
                  type="number"
                  value={formData.reorder_level}
                  onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                  placeholder="Minimum stock level"
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g., Pharma Co."
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Expiration Date</label>
                  <input
                    type="date"
                    value={formData.expiration_date}
                    onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === `editing-${editingItem?.item_id}`}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 transition"
                >
                  {processingId === `editing-${editingItem?.item_id}` ? '⏳ Updating...' : '💾 Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
