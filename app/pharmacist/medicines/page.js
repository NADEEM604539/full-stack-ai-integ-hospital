'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

/**
 * Pharmacist Medicines - Request Approval Page
 * Pharmacist can:
 * - View all pending medicine requests from their department
 * - Review detailed order information and edit/delete individual medicines
 * - Set approval status per medicine (Approved, Rejected, Pending)
 * - Approve or reject entire orders
 */
export default function PharmacistMedicinesPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [medicineStatuses, setMedicineStatuses] = useState({}); // Track status per medicine item
  const [editingItemId, setEditingItemId] = useState(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionReasons, setRejectionReasons] = useState({}); // Track reason per medicine
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectMode, setRejectMode] = useState('whole'); // 'whole' or 'selected'
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  // Fetch detailed order data when selectedOrder changes
  useEffect(() => {
    if (selectedOrder) {
      if (!selectedOrder.items) {
        fetchOrderDetails(selectedOrder.order_id);
      } else {
        // Initialize medicine statuses as 'Pending' for new selections
        const newStatuses = {};
        selectedOrder.items.forEach(item => {
          if (!medicineStatuses[item.item_id]) {
            newStatuses[item.item_id] = 'Pending';
          }
        });
        if (Object.keys(newStatuses).length > 0) {
          setMedicineStatuses(prev => ({ ...prev, ...newStatuses }));
        }
      }
    }
  }, [selectedOrder?.order_id]);

  async function fetchPendingRequests() {
    try {
      setLoading(true);
      const response = await fetch('/api/pharmacist/medicines');
      if (!response.ok) {
        throw new Error(`Failed to fetch requests (${response.status})`);
      }
      const data = await response.json();
      setRequests(data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching:', err);
      setError(err.message || 'Failed to load medicine requests');
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrderDetails(orderId) {
    try {
      setLoadingOrderDetails(true);
      const response = await fetch(`/api/pharmacist/medicines/${orderId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch order details`);
      }
      const data = await response.json();
      
      if (!data.data) {
        throw new Error('No data in response');
      }
      
      setSelectedOrder(data.data);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoadingOrderDetails(false);
    }
  }

  async function handleApprove(orderId) {
    setProcessingOrderId(orderId);
    try {
      const response = await fetch(`/api/pharmacist/medicines/${orderId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to approve');

      setMessage(`✅ Order #${orderId} approved! Added to patient invoice.`);
      setMessageType('success');

      // Refresh list after 2 seconds
      setTimeout(() => {
        setMessage(null);
        fetchPendingRequests();
        setSelectedOrder(null);
      }, 2000);
    } catch (err) {
      console.error('Error approving:', err);
      setMessage(err.message || 'Failed to approve order');
      setMessageType('error');
    } finally {
      setProcessingOrderId(null);
    }
  }

  async function handleReject(orderId) {
    if (!rejectionReason.trim()) {
      setMessage('⚠️ Rejection reason is required');
      setMessageType('error');
      return;
    }

    setProcessingOrderId(orderId);
    try {
      const response = await fetch(`/api/pharmacist/medicines/${orderId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason.trim() })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to reject');

      setMessage(`❌ Order #${orderId} rejected.`);
      setMessageType('success');
      setSelectedOrder(null);
      setRejectionReason('');
      setShowRejectModal(false);

      // Refresh list after 2 seconds
      setTimeout(() => {
        setMessage(null);
        fetchPendingRequests();
      }, 2000);
    } catch (err) {
      console.error('Error rejecting:', err);
      setMessage(err.message || 'Failed to reject order');
      setMessageType('error');
    } finally {
      setProcessingOrderId(null);
    }
  }

  // Edit medicine quantity or price
  function handleEditMedicine(item) {
    setEditingItemId(item.item_id);
    setEditQuantity(item.quantity.toString());
    setEditPrice(item.unit_price.toString());
  }

  // Save edited medicine
  function handleSaveEditMedicine(itemId) {
    if (!editQuantity || !editPrice || isNaN(editQuantity) || isNaN(editPrice)) {
      setMessage('⚠️ Please enter valid quantity and price');
      setMessageType('error');
      return;
    }

    // Update the item in state
    setSelectedOrder(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.item_id === itemId 
          ? { 
              ...item, 
              quantity: parseInt(editQuantity),
              unit_price: parseFloat(editPrice),
              total_price: parseInt(editQuantity) * parseFloat(editPrice)
            }
          : item
      )
    }));

    setEditingItemId(null);
    setMessage(`✏️ Medicine updated. New total: $${(parseInt(editQuantity) * parseFloat(editPrice)).toFixed(2)}`);
    setMessageType('success');
  }

  // Delete medicine from order
  function handleDeleteMedicine(itemId) {
    if (confirm('Are you sure you want to remove this medicine?')) {
      setSelectedOrder(prev => ({
        ...prev,
        items: prev.items.filter(item => item.item_id !== itemId)
      }));
      
      setMedicineStatuses(prev => {
        const newStatuses = { ...prev };
        delete newStatuses[itemId];
        return newStatuses;
      });

      setMessage('🗑️ Medicine removed from order');
      setMessageType('success');
    }
  }

  // Set status for individual medicine
  function handleSetMedicineStatus(itemId, status, reason = '') {
    setMedicineStatuses(prev => ({
      ...prev,
      [itemId]: status
    }));

    if (status === 'Rejected') {
      setRejectionReasons(prev => ({
        ...prev,
        [itemId]: reason
      }));
    }
  }

  // Approve only selected medicines
  async function handleApproveSelected(orderId) {
    const approvedItems = Object.entries(medicineStatuses)
      .filter(([_, status]) => status === 'Approved')
      .map(([itemId, _]) => parseInt(itemId));

    if (approvedItems.length === 0) {
      setMessage('⚠️ Please mark at least one medicine as Approved');
      setMessageType('error');
      return;
    }

    setProcessingOrderId(orderId);
    try {
      const response = await fetch(`/api/pharmacist/medicines/${orderId}/approve-partial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: approvedItems })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to approve');

      setMessage(`✅ Selected medicines approved! (${approvedItems.length} items)`);
      setMessageType('success');

      setTimeout(() => {
        setMessage(null);
        setSelectedOrder(null);
        fetchPendingRequests();
      }, 2000);
    } catch (err) {
      console.error('Error approving:', err);
      setMessage(err.message || 'Failed to approve selected medicines');
      setMessageType('error');
    } finally {
      setProcessingOrderId(null);
    }
  }

  // Reject only selected medicines
  async function handleRejectSelected(orderId) {
    const rejectedItems = Object.entries(medicineStatuses)
      .filter(([_, status]) => status === 'Rejected')
      .map(([itemId, _]) => parseInt(itemId));

    if (rejectedItems.length === 0) {
      setMessage('⚠️ Please mark at least one medicine as Rejected');
      setMessageType('error');
      return;
    }

    // Build itemReasons object from rejectionReasons
    const itemReasons = {};
    rejectedItems.forEach(itemId => {
      itemReasons[itemId] = rejectionReasons[itemId] || 'No reason provided';
    });

    setProcessingOrderId(orderId);
    try {
      const response = await fetch(`/api/pharmacist/medicines/${orderId}/reject-partial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemReasons })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to reject');

      setMessage(`❌ Selected medicines rejected (${rejectedItems.length} items)`);
      setMessageType('success');
      setShowRejectModal(false);
      setRejectionReason('');

      setTimeout(() => {
        setMessage(null);
        fetchPendingRequests();
        setSelectedOrder(null);
      }, 2000);
    } catch (err) {
      console.error('Error rejecting:', err);
      setMessage(err.message || 'Failed to reject selected medicines');
      setMessageType('error');
    } finally {
      setProcessingOrderId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Loading medicine requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Medicine Requests</h1>
            <p className="text-gray-600 mt-1">Review and approve/reject pending medicine orders</p>
          </div>
          <button
            onClick={fetchPendingRequests}
            className="bg-white px-4 py-2 rounded-lg shadow hover:shadow-lg transition-all text-sm font-semibold text-gray-700"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {message && (
        <div
          className={`border-l-4 p-4 mb-6 rounded ${
            messageType === 'success'
              ? 'bg-green-100 border-green-500 text-green-700'
              : 'bg-yellow-100 border-yellow-500 text-yellow-700'
          }`}
        >
          <p>{message}</p>
        </div>
      )}

      {/* Requests Display */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <p className="text-5xl mb-4">✅</p>
          <p className="text-gray-600 text-lg">No pending medicine requests</p>
          <p className="text-gray-500 mt-2">All requests have been reviewed</p>
          <Link
            href="/pharmacist/dashboard"
            className="inline-block mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Back to Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {requests.map((request) => (
            <div
              key={request.order_id}
              className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-shadow"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Patient Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Patient</p>
                  <p className="text-lg font-bold text-gray-800 mt-1">
                    {request.patient_name}
                  </p>
                  <p className="text-sm text-gray-600">MRN: {request.mrn}</p>
                </div>

                {/* Request Details */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Order Details</p>
                  <p className="text-lg font-bold text-gray-800 mt-1">
                    Order #{request.order_id}
                  </p>
                  <p className="text-sm text-gray-600">
                    Items: {request.item_count}
                  </p>
                </div>

                {/* Amount Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Amount</p>
                  <p className="text-lg font-bold text-green-600 mt-1">
                    ${(Number(request.total_amount) || 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    By: {request.nurse_name}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setSelectedOrder(request);
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-semibold text-sm"
                  >
                    👁️ View Details
                  </button>
                  <button
                    onClick={() => handleApprove(request.order_id)}
                    disabled={processingOrderId === request.order_id}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-semibold text-sm disabled:opacity-50"
                  >
                    {processingOrderId === request.order_id ? '⏳' : '✅'} Approve All
                  </button>
                </div>
              </div>

              {/* Encounter Info */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">{request.encounter_type}</span> - {request.chief_complaint}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Created: {format(new Date(request.created_at), 'MMM dd, yyyy hh:mm a')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedOrder && !showRejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto border border-gray-200">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Order #{selectedOrder.order_id}
                  </h2>
                  <p className="text-gray-700 mt-1 font-medium">
                    {selectedOrder.patient_name} (MRN: {selectedOrder.mrn})
                  </p>
                </div>
                <div className="flex gap-2 items-start">
                  <button
                    onClick={() => fetchOrderDetails(selectedOrder.order_id)}
                    disabled={loadingOrderDetails}
                    className="text-blue-600 hover:text-blue-800 text-2xl disabled:opacity-50"
                    title="Refresh medicines"
                  >
                    {loadingOrderDetails ? '⏳' : '🔄'}
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Medicine Items Table */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">📋 Medicine Items (Editable)</h3>
                <div className="overflow-x-auto border border-gray-300 rounded-lg">
                  <table className="w-full bg-white text-sm">
                    <thead>
                      <tr className="bg-blue-600 border-b-2 border-blue-700">
                        <th className="text-left py-3 px-3 font-bold text-white">Medicine</th>
                        <th className="text-center py-3 px-3 font-bold text-white">Qty</th>
                        <th className="text-center py-3 px-3 font-bold text-white">Price</th>
                        <th className="text-center py-3 px-3 font-bold text-white">Total</th>
                        <th className="text-center py-3 px-3 font-bold text-white">Status</th>
                        <th className="text-center py-3 px-3 font-bold text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder?.items && Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item) => (
                          <tr key={item.item_id} className="border-b border-gray-300 hover:bg-blue-50">
                            <td className="py-3 px-3 text-gray-900 font-semibold border-r border-gray-200">
                              {item.medicine_name || 'Unknown'}
                            </td>
                            <td className="py-3 px-3 text-center text-gray-900 font-bold border-r border-gray-200">
                              {editingItemId === item.item_id ? (
                                <input
                                  type="number"
                                  value={editQuantity}
                                  onChange={(e) => setEditQuantity(e.target.value)}
                                  className="w-12 text-center border border-gray-300 rounded px-1"
                                  min="1"
                                />
                              ) : (
                                item.quantity
                              )}
                            </td>
                            <td className="py-3 px-3 text-center text-gray-900 font-medium border-r border-gray-200">
                              {editingItemId === item.item_id ? (
                                <input
                                  type="number"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  className="w-16 text-center border border-gray-300 rounded px-1"
                                  step="0.01"
                                  min="0"
                                />
                              ) : (
                                `$${Number(item.unit_price || 0).toFixed(2)}`
                              )}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-green-700 border-r border-gray-200">
                              ${((item.quantity || 0) * Number(item.unit_price || 0)).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-center border-r border-gray-200">
                              <select
                                value={medicineStatuses[item.item_id] || 'Pending'}
                                onChange={(e) => handleSetMedicineStatus(item.item_id, e.target.value)}
                                className={`px-2 py-1 rounded font-semibold text-xs ${
                                  medicineStatuses[item.item_id] === 'Approved'
                                    ? 'bg-green-200 text-green-800'
                                    : medicineStatuses[item.item_id] === 'Rejected'
                                    ? 'bg-red-200 text-red-800'
                                    : 'bg-yellow-200 text-yellow-800'
                                }`}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                            </td>
                            <td className="py-3 px-3 text-center text-xs">
                              {editingItemId === item.item_id ? (
                                <div className="flex gap-1 justify-center">
                                  <button
                                    onClick={() => handleSaveEditMedicine(item.item_id)}
                                    className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 text-xs"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingItemId(null)}
                                    className="bg-gray-400 text-white px-2 py-1 rounded hover:bg-gray-500 text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-1 justify-center">
                                  <button
                                    onClick={() => handleEditMedicine(item)}
                                    className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-xs"
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMedicine(item.item_id)}
                                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                                  >
                                    🗑️ Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-6 px-4 text-center text-gray-500 italic">
                            {selectedOrder?.items === undefined ? '⏳ Loading medicines...' : 'No medicine items found'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {selectedOrder?.items && Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 && (
                      <tfoot>
                        <tr className="bg-amber-100 border-t-2 border-amber-400 font-bold">
                          <td colSpan="3" className="py-3 px-3 text-right text-gray-900 text-base">💰 Total Amount:</td>
                          <td colSpan="3" className="py-3 px-3 text-center text-green-700 text-lg font-bold">
                            ${(Number(selectedOrder.total_amount) || 0).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end p-4 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 font-semibold transition"
                >
                  Close
                </button>
                <button
                  onClick={() => handleApproveSelected(selectedOrder.order_id)}
                  disabled={processingOrderId === selectedOrder.order_id || !Object.values(medicineStatuses).includes('Approved')}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 transition"
                >
                  {processingOrderId === selectedOrder.order_id ? '⏳' : '✅'} Approve Selected
                </button>
                <button
                  onClick={() => {
                    if (!Object.values(medicineStatuses).includes('Rejected')) {
                      setMessage('⚠️ Mark at least one medicine as "Rejected" first');
                      setMessageType('error');
                      return;
                    }
                    setShowRejectModal(true);
                  }}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 font-semibold transition"
                >
                  ❌ Reject Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {selectedOrder && showRejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full border border-gray-200">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ❌ Reject Medicines
              </h2>
              
              {/* Mode selector */}
              {selectedOrder?.items && Array.isArray(selectedOrder.items) && Object.values(medicineStatuses).includes('Rejected') && (
                <div className="flex gap-4 mb-6 p-3 bg-gray-100 rounded-lg">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="selected"
                      checked={rejectMode === 'selected'}
                      onChange={(e) => setRejectMode(e.target.value)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-gray-800">Reject Selected Items</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="whole"
                      checked={rejectMode === 'whole'}
                      onChange={(e) => setRejectMode(e.target.value)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-gray-800">Reject Entire Order</span>
                  </label>
                </div>
              )}
              
              {rejectMode === 'selected' ? (
                // Selected medicines rejection
                <div className="mb-6 max-h-48 overflow-y-auto">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Provide rejection reasons for:</p>
                  <div className="space-y-3">
                    {selectedOrder?.items?.map(item => {
                      if (medicineStatuses[item.item_id] === 'Rejected') {
                        return (
                          <div key={item.item_id} className="bg-red-50 p-3 rounded-lg border border-red-200">
                            <label className="block mb-2">
                              <span className="font-semibold text-gray-800">{item.medicine_name}</span>
                              <span className="text-gray-600 text-sm ml-2">(Qty: {item.quantity})</span>
                            </label>
                            <textarea
                              value={rejectionReasons[item.item_id] || ''}
                              onChange={(e) => {
                                setRejectionReasons(prev => ({
                                  ...prev,
                                  [item.item_id]: e.target.value
                                }));
                              }}
                              placeholder="Reason for rejection (required)"
                              className="w-full border-2 border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-800 placeholder-gray-500"
                              rows="2"
                            />
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              ) : (
                // Whole order rejection
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Reason for rejecting entire order:</p>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason for rejection (required)"
                    className="w-full border-2 border-gray-300 rounded-lg p-3 h-24 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-800 placeholder-gray-500"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                    setRejectionReasons({});
                    setRejectMode('whole');
                  }}
                  className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (rejectMode === 'selected') {
                      handleRejectSelected(selectedOrder.order_id);
                    } else {
                      handleReject(selectedOrder.order_id);
                    }
                  }}
                  disabled={
                    processingOrderId === selectedOrder.order_id || 
                    (rejectMode === 'whole' && !rejectionReason.trim())
                  }
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50 transition"
                >
                  {processingOrderId === selectedOrder.order_id ? '⏳' : '❌'} Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}