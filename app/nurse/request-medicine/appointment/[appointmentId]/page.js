'use client';

import React, { useState, useEffect } from 'react';
import {
  Loader,
  AlertCircle,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  X,
  Package,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const AppointmentMedicineDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params?.appointmentId;

  const [appointment, setAppointment] = useState(null);
  const [medicineOrders, setMedicineOrders] = useState([]);
  const [availableMedicines, setAvailableMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [newOrderItems, setNewOrderItems] = useState([]);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentData();
      fetchAvailableMedicines();
    }
  }, [appointmentId]);

  const fetchAppointmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/nurse/request-medicine/appointment/${appointmentId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch appointment data');
      }

      const data = await response.json();
      setAppointment(data.data.appointment);
      setMedicineOrders(data.data.medicineOrders);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching appointment:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableMedicines = async () => {
    try {
      const response = await fetch('/api/nurse/inventory');

      if (response.ok) {
        const data = await response.json();
        setAvailableMedicines(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching medicines:', err);
    }
  };

  const addMedicineToOrder = () => {
    setNewOrderItems([
      ...newOrderItems,
      { medicine_id: 0, medicine_name: '', quantity: 1, unit_price: 0, notes: '' },
    ]);
  };

  const updateOrderItem = (index, field, value) => {
    const updated = [...newOrderItems];
    
    if (field === 'medicine_id') {
      const medicine = availableMedicines.find(m => m.item_id === parseInt(value));
      if (medicine) {
        updated[index] = {
          ...updated[index],
          medicine_id: medicine.item_id,
          medicine_name: medicine.item_name,
          unit_price: parseFloat(medicine.unit_price),
        };
      }
    } else {
      updated[index][field] = value;
    }
    
    setNewOrderItems(updated);
  };

  const removeOrderItem = (index) => {
    setNewOrderItems(newOrderItems.filter((_, i) => i !== index));
  };

  const submitMedicineOrder = async () => {
    if (newOrderItems.length === 0) {
      setError('Please add at least one medicine');
      return;
    }

    // Validate all items have medicine_id and quantity
    const isValid = newOrderItems.every(
      item => item.medicine_id > 0 && item.quantity > 0
    );
    if (!isValid) {
      setError('Please fill in all medicine details');
      return;
    }

    setSavingOrder(true);
    try {
      const response = await fetch(`/api/nurse/request-medicine/appointment/${appointmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicines: newOrderItems.map(item => ({
            medicineId: item.medicine_id,
            medicineName: item.medicine_name,
            quantity: parseInt(item.quantity),
            unitPrice: parseFloat(item.unit_price),
            notes: item.notes || null,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create medicine order');
      }

      const data = await response.json();
      setSuccessMessage('Medicine order created successfully!');
      setNewOrderItems([]);
      setShowNewOrderForm(false);
      
      // Refresh data
      setTimeout(() => {
        fetchAppointmentData();
        setSuccessMessage('');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingOrder(false);
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this medicine order?')) {
      return;
    }

    try {
      const response = await fetch(`/api/nurse/request-medicine/${orderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete medicine order');
      }

      setSuccessMessage('Medicine order deleted successfully!');
      setTimeout(() => {
        fetchAppointmentData();
        setSuccessMessage('');
      }, 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  const calculateOrderTotal = () => {
    return newOrderItems.reduce(
      (total, item) => total + (item.quantity * item.unit_price),
      0
    ).toFixed(2);
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} style={{ color: '#8B5CF6' }} className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading appointment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      {/* Header */}
      <div
        className="shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <ArrowLeft size={24} className="text-white" />
            </button>
            <div>
              <p className="text-purple-100 text-sm font-semibold">MANAGE MEDICINES</p>
              <h1 className="text-3xl font-bold text-white">
                {appointment?.patient_name}
              </h1>
              <p className="text-purple-100 text-sm mt-1">
                MRN: {appointment?.mrn}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Success Message */}
        {successMessage && (
          <div
            style={{
              backgroundColor: '#D1FAE5',
              border: '1px solid #6EE7B7',
              color: '#065F46',
            }}
            className="rounded-lg p-4 mb-6 flex gap-3 items-center"
          >
            <CheckCircle size={20} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #FECACA',
              color: '#991B1B',
            }}
            className="rounded-lg p-4 mb-6 flex gap-3 items-center"
          >
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Appointment Info Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid #E5E7EB',
          }}
          className="rounded-xl p-6 mb-8"
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: '#1F2937' }}>
            Appointment Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p style={{ color: '#9CA3AF' }} className="text-xs uppercase font-semibold mb-1">
                Date & Time
              </p>
              <p className="font-semibold" style={{ color: '#1F2937' }}>
                {new Date(appointment?.appointment_date).toLocaleDateString()} at {appointment?.appointment_time}
              </p>
            </div>
            <div>
              <p style={{ color: '#9CA3AF' }} className="text-xs uppercase font-semibold mb-1">
                Doctor
              </p>
              <p className="font-semibold" style={{ color: '#1F2937' }}>
                {appointment?.doctor_name || 'Unassigned'}
              </p>
            </div>
            <div>
              <p style={{ color: '#9CA3AF' }} className="text-xs uppercase font-semibold mb-1">
                Reason for Visit
              </p>
              <p className="font-semibold" style={{ color: '#1F2937' }}>
                {appointment?.reason_for_visit || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Existing Medicine Orders */}
        {medicineOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#1F2937' }}>
              Medicine Orders
            </h2>
            <div className="space-y-4">
              {medicineOrders.map((order) => {
                const statusColor = {
                  'Pending': { bg: '#FEF3C7', text: '#92400E', icon: '⏳' },
                  'Accepted': { bg: '#D1FAE5', text: '#047857', icon: '✅' },
                  'Rejected': { bg: '#FEE2E2', text: '#991B1B', icon: '❌' },
                };
                const color = statusColor[order.status] || statusColor['Pending'];

                return (
                  <div
                    key={order.order_id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      border: '1px solid #E5E7EB',
                    }}
                    className="rounded-xl p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span
                          style={{
                            backgroundColor: color.bg,
                            color: color.text,
                          }}
                          className="text-xs font-bold px-3 py-1 rounded-full inline-block"
                        >
                          {color.icon} {order.status}
                        </span>
                        <p style={{ color: '#6B7280' }} className="text-sm mt-2">
                          Order ID: {order.order_id} | {order.item_count} items
                        </p>
                      </div>
                      <div className="text-right">
                        <p style={{ color: '#1F2937' }} className="font-bold text-lg">
                          PKR {parseFloat(order.total_amount).toFixed(2)}
                        </p>
                        <p style={{ color: '#9CA3AF' }} className="text-xs">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {order.status === 'Pending' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => router.push(`/nurse/request-medicine/edit/${order.order_id}`)}
                          className="px-3 py-1 text-sm rounded-lg hover:shadow-md transition"
                          style={{
                            backgroundColor: '#E0E7FF',
                            color: '#4F46E5',
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => deleteOrder(order.order_id)}
                          className="px-3 py-1 text-sm rounded-lg hover:shadow-md transition flex items-center gap-1"
                          style={{
                            backgroundColor: '#FEE2E2',
                            color: '#991B1B',
                          }}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* New Medicine Order Form */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid #E5E7EB',
          }}
          className="rounded-xl p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold" style={{ color: '#1F2937' }}>
              {showNewOrderForm ? 'Add New Medicine Order' : 'Create New Order'}
            </h2>
            {!showNewOrderForm && (
              <button
                onClick={() => setShowNewOrderForm(true)}
                className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition hover:shadow-lg"
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                }}
              >
                <Plus size={18} />
                New Order
              </button>
            )}
          </div>

          {showNewOrderForm && (
            <div className="space-y-6">
              {/* Encounter Selection */}
              <div>
                <label style={{ color: '#6B7280' }} className="block text-sm font-semibold mb-2">
                  Select Encounter *
                </label>
                {appointment?.encounters && appointment.encounters.length > 0 ? (
                  <div className="space-y-2">
                    {appointment.encounters.map((enc) => (
                      <button
                        key={enc.encounter_id}
                        onClick={() => setSelectedEncounter(enc)}
                        style={{
                          backgroundColor:
                            selectedEncounter?.encounter_id === enc.encounter_id
                              ? '#8B5CF6'
                              : '#F3F4F6',
                          color:
                            selectedEncounter?.encounter_id === enc.encounter_id
                              ? '#FFFFFF'
                              : '#1F2937',
                        }}
                        className="w-full text-left px-4 py-3 rounded-lg font-semibold transition hover:shadow-md"
                      >
                        {enc.encounter_type} - {new Date(enc.admission_date).toLocaleString()}
                        {enc.chief_complaint && ` (${enc.chief_complaint})`}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      backgroundColor: '#FEF3C7',
                      border: '1px solid #FCD34D',
                      color: '#92400E',
                    }}
                    className="rounded-lg p-4 flex gap-3"
                  >
                    <AlertTriangle size={18} className="flex-shrink-0" />
                    <span>No encounters available for this appointment</span>
                  </div>
                )}
              </div>

              {/* Medicine Items */}
              <div>
                <label style={{ color: '#6B7280' }} className="block text-sm font-semibold mb-3">
                  Medicines *
                </label>
                <div className="space-y-3">
                  {newOrderItems.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                      }}
                      className="rounded-lg p-4 space-y-3"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p style={{ color: '#6B7280' }} className="text-sm font-semibold">
                          Medicine {index + 1}
                        </p>
                        <button
                          onClick={() => removeOrderItem(index)}
                          className="p-1 hover:bg-red-100 rounded transition"
                          style={{ color: '#EF4444' }}
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Medicine Select */}
                        <div>
                          <label style={{ color: '#6B7280' }} className="block text-xs uppercase font-semibold mb-2">
                            Medicine
                          </label>
                          <select
                            value={item.medicine_id}
                            onChange={(e) => updateOrderItem(index, 'medicine_id', e.target.value)}
                            style={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #D1D5DB',
                              color: '#1F2937',
                            }}
                            className="w-full px-3 py-2 rounded-lg font-semibold focus:outline-none focus:border-purple-400"
                          >
                            <option value={0}>-- Select Medicine --</option>
                            {availableMedicines.map((med) => (
                              <option key={med.item_id} value={med.item_id}>
                                {med.item_name} - PKR {med.unit_price}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div>
                          <label style={{ color: '#6B7280' }} className="block text-xs uppercase font-semibold mb-2">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            style={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #D1D5DB',
                              color: '#1F2937',
                            }}
                            className="w-full px-3 py-2 rounded-lg font-semibold focus:outline-none focus:border-purple-400"
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label style={{ color: '#6B7280' }} className="block text-xs uppercase font-semibold mb-2">
                          Notes (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Take with food, Morning dose only"
                          value={item.notes}
                          onChange={(e) => updateOrderItem(index, 'notes', e.target.value)}
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #D1D5DB',
                            color: '#1F2937',
                          }}
                          className="w-full px-3 py-2 rounded-lg font-semibold focus:outline-none focus:border-purple-400"
                        />
                      </div>

                      {/* Price Summary */}
                      <div
                        style={{
                          backgroundColor: '#EDE9FE',
                          border: '1px solid #D8B4FE',
                        }}
                        className="rounded-lg p-2 flex justify-between items-center"
                      >
                        <span style={{ color: '#6B7280' }} className="text-sm font-semibold">
                          Subtotal
                        </span>
                        <span style={{ color: '#7C3AED' }} className="font-bold">
                          PKR {(item.quantity * item.unit_price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Medicine Button */}
                <button
                  onClick={addMedicineToOrder}
                  className="w-full mt-4 px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition hover:shadow-lg"
                  style={{
                    backgroundColor: '#F3F4F6',
                    color: '#8B5CF6',
                  }}
                >
                  <Plus size={18} />
                  Add Another Medicine
                </button>
              </div>

              {/* Order Total */}
              {newOrderItems.length > 0 && (
                <div
                  style={{
                    backgroundColor: '#EDE9FE',
                    border: '2px solid #D8B4FE',
                  }}
                  className="rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <span style={{ color: '#6B7280' }} className="text-sm font-semibold flex items-center gap-2">
                      <DollarSign size={18} />
                      Total Order Amount
                    </span>
                    <span style={{ color: '#7C3AED' }} className="text-3xl font-bold">
                      PKR {calculateOrderTotal()}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={submitMedicineOrder}
                  disabled={savingOrder || newOrderItems.length === 0}
                  className="flex-1 px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition hover:shadow-lg disabled:opacity-50"
                  style={{
                    backgroundColor: '#8B5CF6',
                    color: '#FFFFFF',
                  }}
                >
                  {savingOrder ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Submit Order
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowNewOrderForm(false);
                    setNewOrderItems([]);
                    setError('');
                  }}
                  className="flex-1 px-4 py-3 rounded-lg font-bold transition hover:shadow-lg"
                  style={{
                    backgroundColor: '#F3F4F6',
                    color: '#6B7280',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentMedicineDetailPage;
