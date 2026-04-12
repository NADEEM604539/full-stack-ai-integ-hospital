'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, User, MapPin, AlertCircle, CheckCircle as Check, ChevronLeft, Stethoscope, Phone, Plus } from 'lucide-react';
import PatientAppointmentBookingClient from './PatientAppointmentBookingClient';

const AppointmentsPage = () => {
  const { patientId } = useParams();
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [patientInfo, setPatientInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchPatientInfo();
  }, [patientId]);

  const fetchPatientInfo = async () => {
    try {
      const response = await fetch(`/api/patient/${patientId}/profile`);
      if (response.ok) {
        const data = await response.json();
        setPatientInfo(data.data);
      }
    } catch (err) {
      console.error('Error fetching patient info:', err);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/patient/${patientId}/appointments`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch appointments');
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return { bg: '#E8F8F5', text: '#065F46', border: '#10B981', icon: '#10B981' };
      case 'pending':
        return { bg: '#FFE4F5', text: '#065F46', border: '#059669', icon: '#059669' };
      case 'cancelled':
        return { bg: '#FFD9E8', text: '#065F46', border: '#F59E0B', icon: '#F59E0B' };
      case 'completed':
        return { bg: '#FFE4D6', text: '#065F46', border: '#10B981', icon: '#10B981' };
      default:
        return { bg: '#E8F8F5', text: '#065F46', border: '#10B981', icon: '#10B981' };
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return <Check size={18} />;
      case 'cancelled':
        return <AlertCircle size={18} />;
      case 'completed':
        return <Check size={18} />;
      default:
        return <AlertCircle size={18} />;
    }
  };

  const handleBookingSuccess = () => {
    fetchAppointments();
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF' }} className="min-h-screen">
      {/* Modern Header */}
      <div
        className="shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-emerald-100 hover:text-white transition mb-6 font-semibold"
          >
            <ChevronLeft size={20} />
            Back
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">
                Your Appointments
              </h1>
              <p className="text-emerald-100 text-lg">
                View and manage your scheduled medical visits
              </p>
            </div>
            <button
              onClick={() => setShowBookingModal(true)}
              className="flex items-center gap-2 text-white px-6 py-3 rounded-full font-semibold transition hover:bg-emerald-700 hover:shadow-lg bg-emerald-600"
            >
              <Plus size={20} />
              Book Appointment
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: '#FFD9E8',
              borderLeft: '5px solid #F59E0B',
            }}
            className="rounded-lg p-5 mb-8 flex items-start gap-4"
          >
            <AlertCircle size={24} style={{ color: '#D97706' }} className="flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold" style={{ color: '#065F46' }}>
                Error Loading Appointments
              </h3>
              <p style={{ color: '#065F46' }} className="text-sm mt-1">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  backgroundColor: '#F0F9FF',
                  border: '2px solid #E0E7FF',
                }}
                className="rounded-xl p-8 h-40 animate-pulse"
              >
                <div
                  style={{ backgroundColor: '#E0E7FF' }}
                  className="h-6 w-32 rounded mb-4"
                ></div>
                <div style={{ backgroundColor: '#E0E7FF' }} className="h-4 w-24"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {appointments.length === 0 && !loading && (
          <div
            style={{
              backgroundColor: '#E8F8F5',
              border: '3px solid #10B981',
            }}
            className="rounded-2xl shadow-md p-16 text-center"
          >
            <Calendar
              size={64}
              style={{ color: '#10B981' }}
              className="mx-auto mb-6"
            />
            <h3 className="text-2xl font-bold" style={{ color: '#065F46' }}>
              No Appointments Scheduled
            </h3>
            <p style={{ color: '#10B981' }} className="mt-3 text-lg mb-8">
              You don't have any scheduled appointments yet. Schedule one by contacting a receptionist.
            </p>
          </div>
        )}

        {/* Appointments List */}
        {appointments.length > 0 && (
          <div className="space-y-6">
            {/* Upcoming Appointments Section */}
            <div>
              <h2 className="text-2xl font-bold mb-6" style={{ color: '#065F46' }}>
                <Calendar size={28} className="inline mr-3" style={{ color: '#10B981' }} />
                Scheduled Appointments
              </h2>

              <div className="space-y-6">
                {appointments.map((appointment, idx) => {
                  const statusColors = getStatusColor(appointment.status);
                  const cardColors = [
                    { bg: '#FFFFFF', border: '#10B981', icon: '#10B981' },
                    { bg: '#FFFFFF', border: '#059669', icon: '#059669' },
                    { bg: '#FFFFFF', border: '#F59E0B', icon: '#F59E0B' },
                    { bg: '#FFFFFF', border: '#10B981', icon: '#10B981' },
                  ];
                  const colors = cardColors[idx % cardColors.length];

                  return (
                    <div
                      key={appointment.appointment_id}
                      style={{
                        backgroundColor: colors.bg,
                        border: `3px solid ${colors.border}`,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      }}
                      className="rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 p-8"
                    >
                      <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left - Date and Time */}
                        <div className="lg:w-48 flex-shrink-0">
                          <div
                            style={{
                              backgroundColor: statusColors.bg,
                              borderRadius: '16px',
                              border: `2px solid ${colors.border}`,
                            }}
                            className="p-6 text-center h-full"
                          >
                            <div className="text-sm font-bold" style={{ color: colors.border }}>
                              {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </div>
                            <div className="text-4xl font-boldmt-2" style={{ color: colors.border }} >
                              {new Date(appointment.appointment_date).getDate()}
                            </div>
                            <div className="text-lg font-bold mt-4" style={{ color: colors.border }}>
                              {new Date(`2000-01-01 ${appointment.appointment_time}`).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </div>
                            {appointment.duration_minutes && (
                              <div className="text-xs text-gray-500 mt-2">
                                {appointment.duration_minutes} minutes
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Middle - Doctor and Department Info */}
                        <div className="flex-1">
                          {/* Doctor */}
                          <div className="mb-6">
                            <div className="flex items-center gap-3 mb-2">
                              <User size={22} style={{ color: colors.border }} />
                              <p className="text-sm font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                                Doctor
                              </p>
                            </div>
                            <h3 className="text-2xl font-bold" style={{ color: '#065F46' }}>
                              {appointment.doctor_name}
                            </h3>
                          </div>

                          {/* Department */}
                          {appointment.department_name && (
                            <div className="mb-6">
                              <div className="flex items-center gap-3 mb-2">
                                <Stethoscope size={22} style={{ color: colors.border }} />
                                <p className="text-sm font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                                  Department
                                </p>
                              </div>
                              <p style={{ color: '#065F46' }} className="font-semibold text-lg">
                                {appointment.department_name}
                              </p>
                            </div>
                          )}

                          {/* Reason for Visit */}
                          {appointment.reason_for_visit && (
                            <div className="mb-6">
                              <div className="flex items-center gap-3 mb-2">
                                <AlertCircle size={22} style={{ color: colors.border }} />
                                <p className="text-sm font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                                  Reason for Visit
                                </p>
                              </div>
                              <p style={{ color: '#065F46' }} className="font-semibold">
                                {appointment.reason_for_visit}
                              </p>
                            </div>
                          )}

                          {/* Notes */}
                          {appointment.notes && (
                            <div>
                              <p className="text-sm font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                                Notes
                              </p>
                              <p style={{ color: '#065F46' }}>
                                {appointment.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Right - Status */}
                        <div className="lg:w-48 flex-shrink-0 flex items-center">
                          <div className="w-full">
                            <div
                              style={{
                                backgroundColor: statusColors.bg,
                                borderRadius: '12px',
                                border: `2px solid ${statusColors.border}`,
                              }}
                              className="p-6 text-center"
                            >
                              <div
                                style={{ color: statusColors.icon }}
                                className="flex justify-center mb-3"
                              >
                                {getStatusIcon(appointment.status)}
                              </div>
                              <span
                                className="inline-block font-bold"
                                style={{ color: statusColors.text }}
                              >
                                {appointment.status?.charAt(0).toUpperCase() +
                                  appointment.status?.slice(1).toLowerCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && patientInfo && (
        <PatientAppointmentBookingClient
          patientId={parseInt(patientId)}
          patientInfo={patientInfo}
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default AppointmentsPage;
