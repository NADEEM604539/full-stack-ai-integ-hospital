'use client';

import React, { useState, useEffect } from 'react';
import {
  Loader,
  AlertCircle,
  Calendar,
  User,
  Phone,
  Search,
  ChevronRight,
  Clock,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const RequestMedicinePage = () => {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchTerm]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/nurse/appointments');

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      setAppointments(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    const filtered = appointments.filter(apt =>
      apt.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.mrn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.reason_for_visit?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAppointments(filtered);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Scheduled': { bg: '#DDD6FE', text: '#4F46E5', icon: '📅' },
      'Completed': { bg: '#D1FAE5', text: '#047857', icon: '✅' },
      'Cancelled': { bg: '#FEE2E2', text: '#991B1B', icon: '❌' },
      'No Show': { bg: '#FED7AA', text: '#92400E', icon: '⏸️' },
    };
    return colors[status] || colors['Scheduled'];
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} style={{ color: '#8B5CF6' }} className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading appointments...</p>
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
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-4xl font-bold text-white mb-2">Request Medicines</h1>
          <p className="text-purple-100 text-lg">Select an appointment to manage medicine requests</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search size={20} style={{ color: '#9CA3AF' }} className="absolute left-4 top-3" />
            <input
              type="text"
              placeholder="Search by patient name, MRN, doctor, or reason for visit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                backgroundColor: '#FFFFFF',
                border: '2px solid #E5E7EB',
              }}
              className="w-full pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>

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

        {/* Appointments Grid */}
        {filteredAppointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAppointments.map((apt) => {
              const statusColor = getStatusColor(apt.status);

              return (
                <div
                  key={apt.appointment_id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    border: '1px solid #E5E7EB',
                  }}
                  className="rounded-xl overflow-hidden hover:shadow-lg transition"
                >
                  {/* Card Header */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #F3F0FF 0%, #EDE9FE 100%)',
                      borderBottom: '1px solid #E5E7EB',
                    }}
                    className="p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p style={{ color: '#8B5CF6' }} className="text-sm font-semibold">
                          APPOINTMENT
                        </p>
                        <h3 className="text-lg font-bold" style={{ color: '#1F2937' }}>
                          {apt.patient_name}
                        </h3>
                        <p style={{ color: '#6B7280' }} className="text-sm mt-1">
                          MRN: {apt.mrn}
                        </p>
                      </div>
                      <span
                        style={{
                          backgroundColor: statusColor.bg,
                          color: statusColor.text,
                        }}
                        className="text-xs font-bold px-3 py-1 rounded-full"
                      >
                        {statusColor.icon} {apt.status}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    {/* Date & Time */}
                    <div className="flex items-start gap-3">
                      <Calendar size={18} style={{ color: '#8B5CF6' }} className="flex-shrink-0 mt-1" />
                      <div>
                        <p style={{ color: '#9CA3AF' }} className="text-xs uppercase font-semibold">
                          Date & Time
                        </p>
                        <p className="font-semibold" style={{ color: '#1F2937' }}>
                          {new Date(apt.appointment_date).toLocaleDateString()} at {apt.appointment_time}
                        </p>
                        <p style={{ color: '#6B7280' }} className="text-sm">
                          Duration: {apt.duration_minutes} minutes
                        </p>
                      </div>
                    </div>

                    {/* Doctor */}
                    <div className="flex items-start gap-3">
                      <User size={18} style={{ color: '#8B5CF6' }} className="flex-shrink-0 mt-1" />
                      <div>
                        <p style={{ color: '#9CA3AF' }} className="text-xs uppercase font-semibold">
                          Doctor
                        </p>
                        <p className="font-semibold" style={{ color: '#1F2937' }}>
                          {apt.doctor_name || 'Unassigned'}
                        </p>
                      </div>
                    </div>

                    {/* Reason for Visit */}
                    {apt.reason_for_visit && (
                      <div className="flex items-start gap-3">
                        <Clock size={18} style={{ color: '#8B5CF6' }} className="flex-shrink-0 mt-1" />
                        <div>
                          <p style={{ color: '#9CA3AF' }} className="text-xs uppercase font-semibold">
                            Reason for Visit
                          </p>
                          <p className="font-semibold" style={{ color: '#1F2937' }}>
                            {apt.reason_for_visit}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Encounter & Medicine Count */}
                    <div className="flex gap-4 pt-2">
                      <div className="flex items-center gap-2" style={{ color: '#6B7280' }}>
                        <Users size={16} />
                        <span className="text-sm font-semibold">
                          {apt.encounter_count} {apt.encounter_count === 1 ? 'Encounter' : 'Encounters'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2" style={{ color: '#6B7280' }}>
                        <span className="text-sm font-semibold">
                          {apt.medicine_order_count} {apt.medicine_order_count === 1 ? 'Order' : 'Orders'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer - Action Button */}
                  <div
                    style={{
                      borderTop: '1px solid #E5E7EB',
                      backgroundColor: '#F9FAFB',
                    }}
                    className="p-4"
                  >
                    <button
                      onClick={() => router.push(`/nurse/request-medicine/appointment/${apt.appointment_id}`)}
                      style={{
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                      }}
                      className="w-full px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2 text-sm"
                    >
                      💊 Manage Medicines
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              backgroundColor: '#F3F0FF',
              border: '3px solid #8B5CF6',
            }}
            className="rounded-2xl shadow-md p-16 text-center"
          >
            <Calendar
              size={64}
              style={{ color: '#8B5CF6' }}
              className="mx-auto mb-6 opacity-50"
            />
            <h3 className="text-2xl font-bold" style={{ color: '#5B21B6' }}>
              No Appointments Found
            </h3>
            <p style={{ color: '#8B5CF6' }} className="mt-3 text-lg">
              {searchTerm
                ? 'Try adjusting your search criteria'
                : 'No appointments available in your department'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestMedicinePage;
