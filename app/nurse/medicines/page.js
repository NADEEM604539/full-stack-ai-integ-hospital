'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * GET: /nurse/medicines
 * Nurse view their own medicine requests with status and approval details
 */
export default function NurseMedicinesPage() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // All, Pending, Accepted, Rejected

  useEffect(() => {
    fetchMedicineRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, statusFilter]);

  async function fetchMedicineRequests() {
    try {
      const response = await fetch('/api/nurse/medicines');
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

  function filterRequests() {
    let filtered = requests;
    if (statusFilter !== 'All') {
      filtered = requests.filter(r => r.status === statusFilter);
    }
    setFilteredRequests(filtered);
  }

  function getStatusColor(status) {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Accepted': 'bg-green-100 text-green-800 border-green-300',
      'Rejected': 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  function getStatusIcon(status) {
    const icons = {
      'Pending': '⏳',
      'Accepted': '✓',
      'Rejected': '✗'
    };
    return icons[status] || '○';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading your medicine requests...</p>
      </div>
    );
  }

  const stats = {
    pending: requests.filter(r => r.status === 'Pending').length,
    accepted: requests.filter(r => r.status === 'Accepted').length,
    rejected: requests.filter(r => r.status === 'Rejected').length
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Medicine Requests</h1>
        <button
          onClick={() => router.push('/nurse/medicines/request')}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          + New Request
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-600 font-semibold text-sm">Total Requests</p>
          <p className="text-2xl font-bold text-blue-900">{requests.length}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-600 font-semibold text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-600 font-semibold text-sm">Accepted</p>
          <p className="text-2xl font-bold text-green-900">{stats.accepted}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 font-semibold text-sm">Rejected</p>
          <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
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

      {/* Status Filter */}
      <div className="flex gap-2 mb-6">
        {['All', 'Pending', 'Accepted', 'Rejected'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded font-medium text-sm transition ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* No Requests */}
      {filteredRequests.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-800 text-lg mb-4">
            {statusFilter === 'All' ? 'No medicine requests yet' : `No ${statusFilter.toLowerCase()} requests`}
          </p>
          <button
            onClick={() => router.push('/nurse/medicines/request')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded inline-block"
          >
            Create Your First Request
          </button>
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <div key={request.order_id} className="bg-white border rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Order #{request.order_id} - {request.first_name} {request.last_name}
                </h3>
                <p className="text-sm text-gray-600">
                  {request.encounter_type} | MRN: {request.mrn}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)} {request.status}
              </span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 text-sm bg-gray-50 p-3 rounded">
              <div>
                <p className="text-gray-600">Items</p>
                <p className="font-semibold text-gray-900">{request.item_count}</p>
              </div>
              <div>
                <p className="text-gray-600">Amount</p>
                <p className="font-semibold text-gray-900">PKR {(request.total_amount || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Requested</p>
                <p className="font-semibold text-gray-900">
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
              {request.status !== 'Pending' && (
                <>
                  <div>
                    <p className="text-gray-600">Reviewed By</p>
                    <p className="font-semibold text-gray-900">
                      {request.approval_first_name} {request.approval_last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status Updated</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(request.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Rejection Reason */}
            {request.status === 'Rejected' && request.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <p className="text-sm font-semibold text-red-900">Rejection Reason:</p>
                <p className="text-sm text-red-800">{request.rejection_reason}</p>
              </div>
            )}

            {/* View Details Link */}
            <Link
              href={`/nurse/medicines/${request.order_id}`}
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              View full details →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
