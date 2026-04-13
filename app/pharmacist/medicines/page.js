'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

/**
 * Pharmacist Medicines - Request Approval Page
 * Pharmacist can:
 * - View all pending medicine requests from their department
 * - Review detailed order information
 * - Approve or reject requests
 */
export default function PharmacistMedicinesPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

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
      setShowModal(false);

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
                    ${request.total_amount.toFixed(2)}
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
                    {processingOrderId === request.order_id ? '⏳' : '✅'} Approve
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOrder(request);
                      setShowModal(true);
                    }}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-semibold text-sm"
                  >
                    ❌ Reject
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
      {selectedOrder && !showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Order #{selectedOrder.order_id}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {selectedOrder.patient_name} (MRN: {selectedOrder.mrn})
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Medicine Items Table */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Medicine Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-2 px-2">Medicine</th>
                        <th className="text-left py-2 px-2">Qty</th>
                        <th className="text-left py-2 px-2">Unit Price</th>
                        <th className="text-right py-2 px-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items && selectedOrder.items.map((item) => (
                        <tr key={item.item_id} className="border-b border-gray-100">
                          <td className="py-2 px-2">{item.medicine_name}</td>
                          <td className="py-2 px-2">{item.quantity}</td>
                          <td className="py-2 px-2">${item.unit_price.toFixed(2)}</td>
                          <td className="py-2 px-2 text-right font-semibold">
                            ${(item.quantity * item.unit_price).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-200 font-bold">
                        <td colSpan="3" className="py-2 px-2 text-right">Total:</td>
                        <td className="py-2 px-2 text-right text-green-600">
                          ${selectedOrder.total_amount.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={() => handleApprove(selectedOrder.order_id)}
                  disabled={processingOrderId === selectedOrder.order_id}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 font-semibold disabled:opacity-50"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => {
                    setShowModal(true);
                  }}
                  className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 font-semibold"
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {selectedOrder && showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Reject Order #{selectedOrder.order_id}?
              </h2>
              
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejection (required)"
                className="w-full border border-gray-300 rounded-lg p-3 mb-4 h-24 focus:outline-none focus:ring-2 focus:ring-red-500"
              />

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setRejectionReason('');
                  }}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedOrder.order_id)}
                  disabled={processingOrderId === selectedOrder.order_id || !rejectionReason.trim()}
                  className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 font-semibold disabled:opacity-50"
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