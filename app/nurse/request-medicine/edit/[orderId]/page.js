'use client';

import React, { useState, useEffect } from 'react';
import {
  Loader,
  AlertCircle,
  ArrowLeft,
  Save,
  Trash2,
  X,
  Package,
  DollarSign,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const EditMedicineOrderPage = () => {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.orderId;

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [availableMedicines, setAvailableMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [newMedicineId, setNewMedicineId] = useState('');
  const [newMedicineQuantity, setNewMedicineQuantity] = useState(1);
  const [addingMedicine, setAddingMedicine] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderData();
      fetchAvailableMedicines();
    }
  }, [orderId]);

  const fetchAvailableMedicines = async () => {
    try {
      const response = await fetch('/api/nurse/inventory');

      if (!response.ok) {
        throw new Error('Failed to fetch medicines');
      }

      const data = await response.json();
      setAvailableMedicines(data.data || []);
    } catch (err) {
      console.error('Error fetching medicines:', err);
      setError('Could not load available medicines');
    }
  };

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/nurse/request-medicine/${orderId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch medicine order');
      }

      const data = await response.json();
      setOrder(data.data.order);
      setItems(data.data.items || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    const quantity = Math.max(1, parseInt(newQuantity) || 1);
    setItems(
      items.map(item =>
        (item.id === itemId || item.item_id === itemId)
          ? { ...item, quantity }
          : item
      )
    );
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Remove this medicine from the order?')) {
      return;
    }

    setDeletingItemId(itemId);
    try {
      // Remove from local state - match both id and item_id fields
      setItems(items.filter(item => item.id !== itemId && item.item_id !== itemId));
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete medicine');
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleAddMedicine = async () => {
    if (!newMedicineId || !newMedicineQuantity) {
      setError('Please select a medicine and enter quantity');
      return;
    }

    // Check if medicine already exists in order
    const medicineExists = items.some(item => item.medicine_id === parseInt(newMedicineId));
    if (medicineExists) {
      setError('This medicine is already in the order. Edit the quantity instead.');
      return;
    }

    setAddingMedicine(true);
    try {
      // Find selected medicine from available list
      const selectedMedicine = availableMedicines.find(
        med => (med.item_id === parseInt(newMedicineId) || med.medicine_id === parseInt(newMedicineId) || med.id === parseInt(newMedicineId))
      );

      if (!selectedMedicine) {
        throw new Error('Medicine not found');
      }

      // Create new item object (without id/item_id as it's new)
      const newItem = {
        medicine_id: selectedMedicine.item_id || selectedMedicine.medicine_id || selectedMedicine.id,
        medicine_name: selectedMedicine.item_name || selectedMedicine.medicine_name || selectedMedicine.name,
        quantity: parseInt(newMedicineQuantity),
        unit_price: selectedMedicine.unit_price || 0,
        unit: selectedMedicine.unit || '',
        notes: ''
      };

      setItems([...items, newItem]);
      setNewMedicineId('');
      setNewMedicineQuantity(1);
      setSuccessMessage('✓ Medicine added to order');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error adding medicine:', err);
      setError(err.message || 'Failed to add medicine');
    } finally {
      setAddingMedicine(false);
    }
  };

  const handleSaveOrder = async () => {
    if (items.length === 0) {
      setError('Order must have at least one medicine');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/nurse/request-medicine/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save order');
      }

      setSuccessMessage('✅ Medicine order updated successfully!');
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err) {
      console.error('Error saving order:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} style={{ color: '#8B5CF6' }} className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading medicine order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }} className="p-8">
        <Link href="/nurse/request-medicine" className="flex items-center gap-2 mb-6" style={{ color: '#8B5CF6' }}>
          <ArrowLeft size={20} />
          Back to Medicines
        </Link>
        <div className="p-6 rounded-2xl flex gap-4 border-l-4" style={{ backgroundColor: '#FFE4D6', borderColor: '#E74C3C' }}>
          <AlertCircle size={24} color="#E74C3C" />
          <div>
            <p className="font-bold" style={{ color: '#C0392B' }}>Order Not Found</p>
            <p style={{ color: '#922B21' }} className="text-sm mt-1">The medicine order you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }} className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/nurse/request-medicine" className="flex items-center gap-2 mb-4" style={{ color: '#8B5CF6' }}>
          <ArrowLeft size={20} />
          Back to Medicines
        </Link>
        <h1 className="text-4xl font-bold" style={{ color: '#1E40AF' }}>Edit Medicine Order #{orderId}</h1>
        <p style={{ color: '#6B7280' }} className="text-lg mt-2">Update medicines and quantities</p>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="mb-6 p-4 rounded-lg flex gap-3 border-l-4"
          style={{ backgroundColor: '#FFE4D6', borderColor: '#E74C3C' }}
        >
          <AlertCircle size={20} color="#E74C3C" />
          <p style={{ color: '#922B21' }}>{error}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div
          className="mb-6 p-4 rounded-lg flex gap-3 border-l-4"
          style={{ backgroundColor: '#D1FAE5', borderColor: '#10B981' }}
        >
          <p style={{ color: '#065F46' }}>{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info */}
          <div className="rounded-2xl overflow-hidden shadow-sm p-8" style={{ backgroundColor: '#FFFFFF' }}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#1E40AF' }}>Order Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm" style={{ color: '#6B7280' }}>Order Status</p>
                <p className="text-lg font-bold mt-1" style={{ color: '#065F46' }}>{order.status}</p>
              </div>
              <div>
                <p className="text-sm" style={{ color: '#6B7280' }}>Order Created</p>
                <p className="text-lg font-bold mt-1" style={{ color: '#065F46' }}>
                  {new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {order.total_amount && (
                <div>
                  <p className="text-sm" style={{ color: '#6B7280' }}>Total Amount</p>
                  <p className="text-lg font-bold mt-1 flex items-center gap-2" style={{ color: '#10B981' }}>
                    <DollarSign size={20} />
                    ${Number(order.total_amount).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Medicines List */}
          <div className="rounded-2xl overflow-hidden shadow-sm p-8" style={{ backgroundColor: '#FFFFFF' }}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#1E40AF' }}>Medicines in Order</h2>

            {items.length === 0 ? (
              <div className="p-6 rounded-lg text-center" style={{ backgroundColor: '#F0FDF4', border: '2px dashed #10B981' }}>
                <Package size={32} color="#10B981" className="mx-auto mb-3" />
                <p className="font-semibold" style={{ color: '#065F46' }}>No medicines in this order</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={item.id || item.item_id || index}
                    className="p-4 rounded-lg border-l-4 flex justify-between items-start gap-4"
                    style={{ backgroundColor: '#EFF6FF', borderColor: '#3B82F6' }}
                  >
                    <div className="flex-1">
                      <p className="font-bold text-lg" style={{ color: '#1E40AF' }}>
                        {item.medicine_name}
                      </p>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-xs" style={{ color: '#6B7280' }}>Quantity</p>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(item.id || item.item_id, e.target.value)}
                              className="mt-1 px-3 py-2 border rounded-lg font-semibold"
                              style={{ borderColor: '#D1D5DB', color: '#1F2937', maxWidth: '100px' }}
                            />
                          </div>
                          {item.unit && (
                            <div>
                              <p className="text-xs" style={{ color: '#6B7280' }}>Unit</p>
                              <p className="mt-1 font-semibold" style={{ color: '#1E40AF' }}>{item.unit}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteItem(item.id || item.item_id)}
                      disabled={deletingItemId === (item.id || item.item_id)}
                      className="p-2 rounded-lg transition-all hover:bg-red-100"
                      title="Remove medicine"
                    >
                      {deletingItemId === (item.id || item.item_id) ? (
                        <Loader size={20} className="animate-spin" color="#EF4444" />
                      ) : (
                        <Trash2 size={20} color="#EF4444" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Medicine Section */}
            <div className="mt-8 p-4 rounded-lg border-2" style={{ backgroundColor: '#F0FDF4', borderColor: '#10B981' }}>
              <p className="text-sm font-bold mb-4" style={{ color: '#065F46' }}>➕ Add Medicine to Order</p>
              {availableMedicines.length === 0 ? (
                <p className="text-xs p-3 rounded" style={{ backgroundColor: '#FED7AA', color: '#92400E' }}>
                  No medicines available in inventory
                </p>
              ) : (
                <div className="space-y-3">
                  {/* Medicine Dropdown */}
                  <div>
                    <label className="text-xs font-semibold" style={{ color: '#6B7280' }}>Select Medicine</label>
                    <select
                      value={newMedicineId}
                      onChange={(e) => setNewMedicineId(e.target.value)}
                      disabled={addingMedicine}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm font-medium"
                      style={{ 
                        borderColor: '#D1D5DB', 
                        color: '#1F2937',
                        backgroundColor: '#FFFFFF'
                      }}
                    >
                      <option value="" style={{ color: '#9CA3AF' }}>-- Choose medicine --</option>
                      {availableMedicines.map((med, index) => (
                        <option 
                          key={med.item_id || `med-${index}`}
                          value={med.item_id}
                          style={{ color: '#1F2937' }}
                        >
                          {med.item_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity Input */}
                  <div>
                    <label className="text-xs font-semibold" style={{ color: '#6B7280' }}>Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={newMedicineQuantity}
                      onChange={(e) => setNewMedicineQuantity(e.target.value)}
                      disabled={addingMedicine}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      style={{ borderColor: '#D1D5DB', color: '#1F2937' }}
                      placeholder="Enter quantity"
                    />
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={handleAddMedicine}
                    disabled={addingMedicine || !newMedicineId}
                    className="w-full mt-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all text-white"
                    style={{
                      backgroundColor: '#10B981',
                      opacity: addingMedicine || !newMedicineId ? 0.6 : 1,
                    }}
                  >
                    {addingMedicine ? 'Adding...' : 'Add Medicine'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          {/* Save Button */}
          <button
            onClick={handleSaveOrder}
            disabled={saving || items.length === 0}
            className="w-full rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all disabled:opacity-50 p-6 flex items-center justify-between"
            style={{ backgroundColor: '#10B981', color: 'white' }}
          >
            <div>
              <p className="text-sm font-semibold">{saving ? 'Saving...' : 'Save Changes'}</p>
              <p className="text-xs mt-1 opacity-90">{items.length} medicines in order</p>
            </div>
            {saving ? (
              <Loader size={24} className="animate-spin" />
            ) : (
              <Save size={24} />
            )}
          </button>

          {/* Cancel Button */}
          <button
            onClick={() => router.back()}
            className="w-full rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all p-6 flex items-center justify-center font-semibold"
            style={{ backgroundColor: '#F3F4F6', color: '#374151' }}
          >
            Cancel
          </button>

          {/* Info Card */}
          <div
            className="rounded-2xl overflow-hidden shadow-sm p-6"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <p className="text-sm font-bold" style={{ color: '#1E40AF' }}>💡 Tips</p>
            <ul className="mt-4 space-y-2 text-xs" style={{ color: '#6B7280' }}>
              <li>✓ Adjust quantities as needed</li>
              <li>✓ Remove medicines with the trash icon</li>
              <li>✓ Add new medicines using the form</li>
              <li>✓ Save to apply all changes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditMedicineOrderPage;
