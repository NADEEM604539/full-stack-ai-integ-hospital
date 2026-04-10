'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Filter, Clock, User, Stethoscope, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import Link from 'next/link';

const STATUS_CONFIG = {
  Scheduled: { color: '#3B82F6', bgColor: '#DBEAFE', icon: '📅' },
  Completed: { color: '#10B981', bgColor: '#D1FAE5', icon: '✓' },
  Cancelled: { color: '#EF4444', bgColor: '#FEE2E2', icon: '✕' },
  'No Show': { color: '#F59E0B', bgColor: '#FEF3C7', icon: '⏭' },
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/receptionist/appointments', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const result = await response.json();
      setAppointments(result.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = 
      apt.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.mrn?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const aptDate = new Date(apt.appointment_date);
    aptDate.setHours(0, 0, 0, 0);

    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = aptDate.getTime() === today.getTime();
    } else if (dateFilter === 'upcoming') {
      matchesDate = aptDate.getTime() >= today.getTime();
    } else if (dateFilter === 'past') {
      matchesDate = aptDate.getTime() < today.getTime();
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold" style={{ color: '#065F46' }}>
              Appointments
            </h1>
            <p style={{ color: '#10B981' }} className="text-sm mt-2">
              Manage patient appointments and schedules
            </p>
          </div>
          <Link href="/receptionist/appointments/create">
            <button
              className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all hover:shadow-lg"
              style={{
                backgroundColor: '#10B981',
                color: '#FFFFFF',
              }}
            >
              <Plus size={20} />
              Schedule Appointment
            </button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div
            className="rounded-xl p-6"
            style={{
              backgroundColor: '#DBEAFE',
              borderLeft: '4px solid #3B82F6',
            }}
          >
            <p style={{ color: '#1E40AF' }} className="text-sm font-semibold">
              Total Appointments
            </p>
            <p style={{ color: '#1E40AF' }} className="text-3xl font-bold mt-2">
              {appointments.length}
            </p>
          </div>
          <div
            className="rounded-xl p-6"
            style={{
              backgroundColor: '#D1FAE5',
              borderLeft: '4px solid #10B981',
            }}
          >
            <p style={{ color: '#065F46' }} className="text-sm font-semibold">
              Scheduled
            </p>
            <p style={{ color: '#065F46' }} className="text-3xl font-bold mt-2">
              {appointments.filter(a => a.status === 'Scheduled').length}
            </p>
          </div>
          <div
            className="rounded-xl p-6"
            style={{
              backgroundColor: '#FEF3C7',
              borderLeft: '4px solid #F59E0B',
            }}
          >
            <p style={{ color: '#78350F' }} className="text-sm font-semibold">
              Today
            </p>
            <p style={{ color: '#78350F' }} className="text-3xl font-bold mt-2">
              {appointments.filter(a => {
                const today = new Date().toISOString().split('T')[0];
                return new Date(a.appointment_date).toISOString().split('T')[0] === today;
              }).length}
            </p>
          </div>
          <div
            className="rounded-xl p-6"
            style={{
              backgroundColor: '#FEE2E2',
              borderLeft: '4px solid #EF4444',
            }}
          >
            <p style={{ color: '#7F1D1D' }} className="text-sm font-semibold">
              Cancelled
            </p>
            <p style={{ color: '#7F1D1D' }} className="text-3xl font-bold mt-2">
              {appointments.filter(a => a.status === 'Cancelled').length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className="rounded-xl p-6 mb-8"
        style={{
          backgroundColor: '#F0FDF4',
          border: '1.5px solid rgba(16, 185, 129, 0.15)',
        }}
      >
        <h3 className="text-lg font-bold mb-4" style={{ color: '#065F46' }}>
          Filters & Search
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {/* Search */}
          <div className="col-span-1">
            <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
              Search
            </label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3" style={{ color: '#10B981' }} />
              <input
                type="text"
                placeholder="Patient, Doctor, MRN..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 rounded-lg border-2 outline-none"
                style={{
                  borderColor: '#E5E7EB',
                  backgroundColor: '#FFFFFF',
                  color: '#1F2937',
                }}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 rounded-lg border-2 outline-none"
              style={{
                borderColor: '#E5E7EB',
                backgroundColor: '#FFFFFF',
                color: '#1F2937',
              }}
            >
              <option value="all">All Status</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="No Show">No Show</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
              Date
            </label>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 rounded-lg border-2 outline-none"
              style={{
                borderColor: '#E5E7EB',
                backgroundColor: '#FFFFFF',
                color: '#1F2937',
              }}
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>

          {/* Results */}
          <div className="flex items-end">
            <p style={{ color: '#10B981' }} className="text-sm font-semibold">
              {filteredAppointments.length} result{filteredAppointments.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div
          className="mb-8 p-6 rounded-xl flex gap-4 border-l-4"
          style={{
            backgroundColor: '#FFE4D6',
            borderColor: '#E74C3C',
          }}
        >
          <AlertCircle size={28} color="#E74C3C" className="flex-shrink-0" />
          <div>
            <p className="font-bold" style={{ color: '#C0392B' }}>
              Error Loading Appointments
            </p>
            <p style={{ color: '#922B21' }} className="text-sm mt-1">
              {error}
            </p>
            <button
              onClick={fetchAppointments}
              className="mt-3 px-4 py-2 rounded-lg font-semibold transition-all"
              style={{
                backgroundColor: '#E74C3C',
                color: '#FFFFFF',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <Loader size={40} className="animate-spin" style={{ color: '#10B981' }} />
            <p style={{ color: '#10B981' }}>Loading appointments...</p>
          </div>
        </div>
      ) : filteredAppointments.length === 0 ? (
        /* Empty State */
        <div
          className="rounded-xl p-12 text-center"
          style={{
            backgroundColor: '#F0FDF4',
            border: '2px dashed rgba(16, 185, 129, 0.3)',
          }}
        >
          <Calendar size={48} className="mx-auto mb-4 opacity-50" style={{ color: '#10B981' }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: '#065F46' }}>
            No Appointments Found
          </h3>
          <p style={{ color: '#10B981' }} className="mb-6">
            {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Start by scheduling your first appointment'}
          </p>
          <Link href="/receptionist/appointments/create">
            <button
              className="px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg"
              style={{
                backgroundColor: '#10B981',
                color: '#FFFFFF',
              }}
            >
              <Plus size={18} className="inline mr-2" />
              Schedule First Appointment
            </button>
          </Link>
        </div>
      ) : (
        /* Appointments Table */
        <>
          <div
            className="rounded-xl overflow-hidden shadow-lg"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1.5px solid rgba(16, 185, 129, 0.1)',
            }}
          >
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    backgroundColor: '#F0FDF4',
                    borderBottom: '2px solid rgba(16, 185, 129, 0.15)',
                  }}
                >
                  <th className="px-6 py-4 text-left font-bold" style={{ color: '#065F46' }}>
                    Patient
                  </th>
                  <th className="px-6 py-4 text-left font-bold" style={{ color: '#065F46' }}>
                    Doctor
                  </th>
                  <th className="px-6 py-4 text-left font-bold" style={{ color: '#065F46' }}>
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-left font-bold" style={{ color: '#065F46' }}>
                    Status
                  </th>
                  <th className="px-6 py-4 text-left font-bold" style={{ color: '#065F46' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedAppointments.map((apt, idx) => (
                  <tr
                    key={apt.appointment_id}
                    style={{
                      backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                      borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
                    }}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold" style={{ color: '#1F2937' }}>
                          {apt.patient_name}
                        </p>
                        <p className="text-sm" style={{ color: '#6B7280' }}>
                          {apt.mrn}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Stethoscope size={16} style={{ color: '#10B981' }} />
                        <p style={{ color: '#1F2937' }}>{apt.doctor_name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} style={{ color: '#10B981' }} />
                        <div>
                          <p style={{ color: '#1F2937' }}>
                            {new Date(apt.appointment_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm" style={{ color: '#6B7280' }}>
                            {apt.appointment_time}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="px-3 py-1 rounded-full text-sm font-semibold"
                        style={{
                          backgroundColor: STATUS_CONFIG[apt.status]?.bgColor,
                          color: STATUS_CONFIG[apt.status]?.color,
                        }}
                      >
                        {STATUS_CONFIG[apt.status]?.icon} {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/receptionist/appointments/${apt.appointment_id}`}>
                        <button
                          className="px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                          style={{
                            backgroundColor: '#E8F8F5',
                            color: '#10B981',
                          }}
                        >
                          View
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg transition-all disabled:opacity-50"
                style={{
                  backgroundColor: currentPage === 1 ? '#E5E7EB' : '#10B981',
                  color: currentPage === 1 ? '#9CA3AF' : '#FFFFFF',
                }}
              >
                <ChevronLeft size={20} />
              </button>
              <p style={{ color: '#6B7280' }} className="font-semibold">
                Page {currentPage} of {totalPages}
              </p>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg transition-all disabled:opacity-50"
                style={{
                  backgroundColor: currentPage === totalPages ? '#E5E7EB' : '#10B981',
                  color: currentPage === totalPages ? '#9CA3AF' : '#FFFFFF',
                }}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
