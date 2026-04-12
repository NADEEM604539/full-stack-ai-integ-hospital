'use client';

import { useState, useEffect } from 'react';
import { Star, Loader, AlertCircle, Search, Filter } from 'lucide-react';

export default function AdminAppointmentsSatisfaction() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const [order, setOrder] = useState('DESC');
  const [searchDoctor, setSearchDoctor] = useState('');
  const [minRating, setMinRating] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, [page, limit, sortBy, order, minRating]);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page,
        limit,
        sortBy,
        order,
        ...(minRating && { minRating })
      });

      const response = await fetch(`/api/admin/appointments/satisfaction?${params}`);
      if (!response.ok) throw new Error('Failed to fetch appointments');

      const data = await response.json();
      setAppointments(data.data?.appointments || []);
      setTotalPages(data.data?.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    if (!rating) return <span style={{ color: '#6B7280' }}>Not rated</span>;
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              size={14}
              fill={i <= rating ? '#FBBF24' : '#E5E7EB'}
              color={i <= rating ? '#FBBF24' : '#D1D5DB'}
            />
          ))}
        </div>
        <span style={{ color: '#065F46', fontWeight: 'bold' }}>
          {rating.toFixed(1)}/5.0
        </span>
      </div>
    );
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return { bg: '#E8F8F5', color: '#065F46', border: '#10B981' };
      case 'scheduled':
        return { bg: '#E0E7FF ', color: '#065F46', border: '#4F46E5' };
      case 'cancelled':
        return { bg: '#FFD9E8', color: '#065F46', border: '#F59E0B' };
      case 'no show':
        return { bg: '#FFE4D6', color: '#065F46', border: '#EF4444' };
      default:
        return { bg: '#F3F4F6', color: '#6B7280', border: '#D1D5DB' };
    }
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF' }} className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ color: '#065F46' }}>
          Appointments Satisfaction
        </h1>
        <p style={{ color: '#6B7280' }}>
          View and manage appointment satisfaction ratings across the hospital
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 p-6 rounded-xl border-2" style={{ backgroundColor: '#F0FDF4', borderColor: '#E0E7FF' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
              <Filter size={16} className="inline mr-2" />
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E5E7EB',
                color: '#065F46'
              }}
              className="w-full p-2 border rounded-lg"
            >
              <option value="date">Date</option>
              <option value="rating">Rating</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
              Order
            </label>
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E5E7EB',
                color: '#065F46'
              }}
              className="w-full p-2 border rounded-lg"
            >
              <option value="DESC">Descending</option>
              <option value="ASC">Ascending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
              Min Rating
            </label>
            <select
              value={minRating}
              onChange={(e) => {
                setMinRating(e.target.value);
                setPage(1);
              }}
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E5E7EB',
                color: '#065F46'
              }}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">All Ratings</option>
              <option value="1">1+ Stars</option>
              <option value="2">2+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="4">4+ Stars</option>
              <option value="5">5 Stars Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
              Items per page
            </label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value));
                setPage(1);
              }}
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E5E7EB',
                color: '#065F46'
              }}
              className="w-full p-2 border rounded-lg"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="mb-8 p-4 rounded-lg flex gap-3"
          style={{
            backgroundColor: '#FFD9E8',
            borderLeft: '4px solid #F59E0B'
          }}
        >
          <AlertCircle size={20} color="#D97706" className="flex-shrink-0 mt-1" />
          <div>
            <p className="font-bold" style={{ color: '#065F46' }}>Error</p>
            <p style={{ color: '#065F46' }} className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader size={40} color="#10B981" className="animate-spin mr-4" />
          <p style={{ color: '#6B7280' }}>Loading appointments...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{
            backgroundColor: '#E8F8F5',
            borderColor: '#10B981',
            border: '2px solid'
          }}
        >
          <p style={{ color: '#6B7280' }}>No appointments found</p>
        </div>
      ) : (
        <div>
          {/* Table */}
          <div className="overflow-x-auto rounded-xl border-2" style={{ borderColor: '#E5E7EB' }}>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#F0FDF4', borderBottom: '2px solid #E5E7EB' }}>
                  <th className="px-6 py-4 text-left" style={{ color: '#065F46', fontWeight: 'bold' }}>Date</th>
                  <th className="px-6 py-4 text-left" style={{ color: '#065F46', fontWeight: 'bold' }}>Patient</th>
                  <th className="px-6 py-4 text-left" style={{ color: '#065F46', fontWeight: 'bold' }}>Doctor</th>
                  <th className="px-6 py-4 text-left" style={{ color: '#065F46', fontWeight: 'bold' }}>Satisfaction</th>
                  <th className="px-6 py-4 text-left" style={{ color: '#065F46', fontWeight: 'bold' }}>Status</th>
                  <th className="px-6 py-4 text-left" style={{ color: '#065F46', fontWeight: 'bold' }}>Specialization</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt, idx) => {
                  const statusColors = getStatusColor(apt.status);
                  return (
                    <tr
                      key={apt.appointment_id}
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                        borderBottom: '1px solid #E5E7EB'
                      }}
                    >
                      <td className="px-6 py-4" style={{ color: '#065F46', fontWeight: '500' }}>
                        {formatDate(apt.appointment_date)}
                      </td>
                      <td className="px-6 py-4" style={{ color: '#1F2937' }}>
                        <div>
                          <p style={{ fontWeight: 'bold', margin: 0 }}>
                            {apt.patient_name}
                          </p>
                          <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
                            {apt.mrn}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4" style={{ color: '#1F2937' }}>
                        <div>
                          <p style={{ fontWeight: 'bold', margin: 0 }}>
                            Dr. {apt.doctor_name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {renderStars(apt.satisfaction_rating)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: statusColors.bg,
                            color: statusColors.color,
                            border: `1px solid ${statusColors.border}`
                          }}
                        >
                          {apt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4" style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                        {apt.specialization}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-8 flex justify-between items-center">
            <p style={{ color: '#6B7280' }}>
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg font-semibold transition"
                style={{
                  backgroundColor: page === 1 ? '#E5E7EB' : '#10B981',
                  color: page === 1 ? '#9CA3AF' : 'white',
                  cursor: page === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg font-semibold transition"
                style={{
                  backgroundColor: page === totalPages ? '#E5E7EB' : '#10B981',
                  color: page === totalPages ? '#9CA3AF' : 'white',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
