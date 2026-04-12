'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * GET: /pharmacist/medicines/[orderId]
 * View full details of a medicine order for pharmacist
 */
export default function MedicineOrderDetailPage({ params }) {
  const router = useRouter();
  const { orderId } = params;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!orderId || isNaN(orderId)) {
      setMessage('Invalid order ID');
      setMessageType('error');
      setLoading(false);
      return;
    }

    fetchOrderDetail();
  }, [orderId]);

  async function fetchOrderDetail() {
    try {
      const response = await fetch(`/api/pharmacist/medicines/${orderId}`);
      if (!response.ok) throw new Error('Failed to fetch order');
      const data = await response.json();
      setOrder(data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching:', error);
      setMessage(error.message || 'Failed to load order');
      setMessageType('error');
      setLoading(false);
    }
  }

  async function handleApprove() {
    setProcessing(true);
    try {
      const response = await fetch(`/api/pharmacist/medicines/${orderId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to approve');

      setMessage('Order approved! Added to patient invoice.');
      setMessageType('success');

      setTimeout(() => {
        router.push('/pharmacist/medicines');
      }, 2000);
    } catch (error) {
      console.error('Error approving:', error);
      setMessage(error.message || 'Failed to approve order');
      setMessageType('error');
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    if (!rejectionReason.trim()) {
      setMessage('Rejection reason is required');
      setMessageType('error');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/pharmacist/medicines/${orderId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to reject');

      setMessage('Order rejected.');
      setMessageType('success');

      setTimeout(() => {
        router.push('/pharmacist/medicines');
      }, 2000);
    } catch (error) {
      console.error('Error rejecting:', error);
      setMessage(error.message || 'Failed to reject order');
      setMessageType('error');
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{message || 'Order not found'}</p>
          <Link href="/pharmacist/medicines" className="text-red-600 hover:underline mt-2">
            Back to Medicine Requests
          </Link>
        </div>
      </div>
    );
  }

  const requestedDate = new Date(order.created_at).toLocaleDateString();
  const totalAfterTax = order.total_amount * 1.1;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link href="/pharmacist/medicines" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to All Requests
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Order #{order.order_id} Details</h1>

      {/* Message */}
      {message && (
        <div className={`rounded-lg p-4 mb-6 ${messageType === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={messageType === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message}
          </p>
        </div>
      )}

      {/* Patient Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4 text-lg">Patient Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-600 text-sm">Name</p>
            <p className="font-semibold text-gray-900">{order.patient_first_name} {order.patient_last_name}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">MRN</p>
            <p className="font-semibold text-gray-900">{order.mrn}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Encounter Type</p>
            <p className="font-semibold text-gray-900">{order.encounter_type}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Chief Complaint</p>
            <p className="font-semibold text-gray-900 text-sm">{order.chief_complaint || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Request Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4 text-lg">Request Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-600 text-sm">Requested By</p>
            <p className="font-semibold text-gray-900">{order.nurse_first_name} {order.nurse_last_name}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Requested Date</p>
            <p className="font-semibold text-gray-900">{requestedDate}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Status</p>
            <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
              {order.status}
            </span>
          </div>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white border rounded-lg shadow-md p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4 text-lg">Requested Medicines</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="text-left p-3 font-semibold">Medicine Name</th>
                <th className="text-center p-3 font-semibold">Quantity</th>
                <th className="text-right p-3 font-semibold">Unit Price</th>
                <th className="text-right p-3 font-semibold">Total</th>
                <th className="text-left p-3 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.item_id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-semibold text-gray-900">{item.medicine_name}</td>
                  <td className="p-3 text-center text-gray-900">{item.quantity}</td>
                  <td className="p-3 text-right font-mono text-gray-900">PKR {item.unit_price.toFixed(2)}</td>
                  <td className="p-3 text-right font-mono font-semibold text-gray-900">
                    PKR {item.total_price.toFixed(2)}
                  </td>
                  <td className="p-3 text-gray-600">{item.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost Summary */}
      <div className="bg-white border rounded-lg shadow-md p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4 text-lg">Cost Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-gray-900">
            <span>Subtotal</span>
            <span>PKR {order.total_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-900">
            <span>Tax (10%)</span>
            <span>PKR {(order.total_amount * 0.1).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-3">
            <span>Total (with tax)</span>
            <span>PKR {totalAfterTax.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!showRejectModal ? (
        <div className="flex gap-4">
          <button
            onClick={handleApprove}
            disabled={processing}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 rounded"
          >
            {processing ? 'Processing...' : '✓ Approve & Add to Invoice'}
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded"
          >
            ✗ Reject
          </button>
        </div>
      ) : (
        // Rejection Modal
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-bold text-gray-900 mb-4">Reason for Rejection</h3>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g., Medicine out of stock, require different dosage, patient allergies noted..."
            className="w-full p-3 border rounded mb-4 text-sm"
            rows="4"
          />
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-2 rounded"
            >
              {processing ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
            <button
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason('');
              }}
              className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
