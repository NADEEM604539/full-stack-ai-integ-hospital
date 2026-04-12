'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * GET: /pharmacist/medicines
 * Pharmacist view pending medicine requests and approve/reject
 */
export default function PharmacistMedicinesPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingOrderId, setProcessingOrderId] = useState(null);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  async function fetchPendingRequests() {
    try {
      const response = await fetch('/api/pharmacist/medicines');
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      setRequests(data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching:', error);
      setMessage(error.message || 'Failed to load medicine requests');
      setMessageType('error');
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

      setMessage(`Order #${orderId} approved! Added to patient invoice.`);
      setMessageType('success');

      // Refresh list
      setTimeout(() => {
        setMessage(null);
        fetchPendingRequests();
      }, 2000);
    } catch (error) {
      console.error('Error approving:', error);
      setMessage(error.message || 'Failed to approve order');
      setMessageType('error');
    } finally {
      setProcessingOrderId(null);
    }
  }

  async function handleReject(orderId, reason) {
    if (!reason.trim()) {
      setMessage('Rejection reason is required');
      setMessageType('error');
      return;
    }

    setProcessingOrderId(orderId);
    try {
      const response = await fetch(`/api/pharmacist/medicines/${orderId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to reject');

      setMessage(`Order #${orderId} rejected.`);
      setMessageType('success');
      setSelectedOrder(null);
      setRejectionReason('');

      // Refresh list
      setTimeout(() => {
        setMessage(null);
        fetchPendingRequests();
      }, 2000);
    } catch (error) {
      console.error('Error rejecting:', error);
      setMessage(error.message || 'Failed to reject order');
      setMessageType('error');
    } finally {
      setProcessingOrderId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading medicine requests...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Medicine Request Management</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-600 font-semibold">Pending</p>
          <p className="text-2xl font-bold text-yellow-900">{requests.length}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-gray-600 font-semibold">Total Value</p>
          <p className="text-2xl font-bold text-gray-900">
            PKR {requests.reduce((sum, r) => sum + (r.total_amount || 0), 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-600 font-semibold">Items</p>
          <p className="text-2xl font-bold text-blue-900">
            {requests.reduce((sum, r) => sum + (r.item_count || 0), 0)}
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-lg p-4 mb-6 ${messageType === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={messageType === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message}
          </p>
        </div>
      )}

      {/* No Requests */}
      {requests.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <p className="text-blue-800 text-lg">No pending medicine requests</p>
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {requests.map((request) => (
          <div key={request.order_id} className="bg-white border rounded-lg shadow-md p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Order #{request.order_id} - {request.first_name} {request.last_name}
                </h3>
                <p className="text-sm text-gray-600">
                  MRN: {request.mrn} | Requested by: {request.nurse_first_name} {request.nurse_last_name}
                </p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                PENDING
              </span>
            </div>

            {/* Request Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm bg-gray-50 p-3 rounded">
              <div>
                <p className="text-gray-600">Encounter Type</p>
                <p className="font-semibold text-gray-900">{request.encounter_type}</p>
              </div>
              <div>
                <p className="text-gray-600">Items</p>
                <p className="font-semibold text-gray-900">{request.item_count}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Amount</p>
                <p className="font-semibold text-gray-900">PKR {(request.total_amount || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Requested</p>
                <p className="font-semibold text-gray-900">
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* View Details Button */}
            <div className="mb-4">
              <Link
                href={`/pharmacist/medicines/${request.order_id}`}
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                View full order details →
              </Link>
            </div>

            {/* Action Buttons */}
            {selectedOrder === request.order_id ? (
              // Rejection Modal
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-gray-900 mb-3">Reason for Rejection</p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Medicine out of stock, require different dosage..."
                  className="w-full p-2 border rounded mb-3 text-sm"
                  rows="3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReject(request.order_id, rejectionReason)}
                    disabled={processingOrderId === request.order_id}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-2 rounded text-sm"
                  >
                    {processingOrderId === request.order_id ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOrder(null);
                      setRejectionReason('');
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(request.order_id)}
                  disabled={processingOrderId === request.order_id}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 rounded"
                >
                  {processingOrderId === request.order_id ? 'Approving...' : '✓ Approve & Add to Invoice'}
                </button>
                <button
                  onClick={() => setSelectedOrder(request.order_id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded"
                >
                  ✗ Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
