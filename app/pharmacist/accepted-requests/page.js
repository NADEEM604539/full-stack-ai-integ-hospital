'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

/**
 * Pharmacist - Accepted Medicine Requests
 * Shows all approved/accepted medicine orders
 */
export default function AcceptedRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);

  useEffect(() => {
    fetchAcceptedRequests();
  }, []);

  async function fetchAcceptedRequests() {
    try {
      setLoading(true);
      const response = await fetch('/api/pharmacist/accepted-requests');
      if (!response.ok) {
        throw new Error(`Failed to fetch accepted requests (${response.status})`);
      }
      const data = await response.json();
      setRequests(data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching:', err);
      setError(err.message || 'Failed to load accepted requests');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading accepted requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">✅ Accepted Medicine Requests</h1>
        <p className="text-gray-600 mt-1">All approved medicine orders ready for dispensing</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Empty State */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <p className="text-5xl mb-4">✨</p>
          <p className="text-gray-600 text-lg">No accepted medicine requests</p>
          <p className="text-gray-500 mt-2">All requests are pending or rejected</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {requests.map((request) => (
            <div
              key={request.order_id}
              className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Patient Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Patient</p>
                  <p className="text-lg font-bold text-gray-800 mt-1">
                    {request.patient_name}
                  </p>
                  <p className="text-sm text-gray-600">MRN: {request.mrn}</p>
                </div>

                {/* Order Details */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Order #</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {request.order_id}
                  </p>
                  <p className="text-sm text-gray-600">
                    {request.item_count} items
                  </p>
                </div>

                {/* Amount */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Amount</p>
                  <p className="text-lg font-bold text-green-600 mt-1">
                    ${(Number(request.total_amount) || 0).toFixed(2)}
                  </p>
                </div>

                {/* Approval Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Approved By</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {request.approval_name || 'Pharmacist'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {format(new Date(request.updated_at), 'MMM dd, yyyy')}
                  </p>
                </div>

                {/* Status */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
                  <div className="mt-1 inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                    ✅ {request.status}
                  </div>
                </div>
              </div>

              {/* Expandable Details */}
              <button
                onClick={() => setExpandedItem(expandedItem === request.order_id ? null : request.order_id)}
                className="mt-4 text-blue-900 hover:text-blue-950 font-bold text-sm"
              >
                {expandedItem === request.order_id ? '▼' : '▶'} View Items
              </button>

              {expandedItem === request.order_id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="font-semibold text-gray-800 mb-3">Medicines:</p>
                  <div className="bg-gray-50 rounded p-3 text-sm space-y-2">
                    {request.items && request.items.length > 0 ? (
                      request.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{item.medicine_name}</span>
                          <span className="text-gray-600">
                            {item.quantity} × ${Number(item.unit_price).toFixed(2)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No items specified</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
