'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, User, FileText, Loader, AlertCircle, Eye } from 'lucide-react';
import Link from 'next/link';

export default function DoctorAppointmentsClient() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('Scheduled');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/doctor/appointments');
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const result = await response.json();
      setAppointments(result.data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(apt => 
    selectedStatus === 'All' || apt.status === selectedStatus
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'Scheduled': return { color: '#3B82F6', bgColor: '#DBEAFE' };
      case 'Completed': return { color: '#10B981', bgColor: '#D1FAE5' };
      case 'Cancelled': return { color: '#EF4444', bgColor: '#FEE2E2' };
      case 'No Show': return { color: '#F59E0B', bgColor: '#FEF3C7' };
      default: return { color: '#6B7280', bgColor: '#F3F4F6' };
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} color="#3B82F6" className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }} className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold" style={{ color: '#1E40AF' }}>
          My Appointments
        </h1>
        <p style={{ color: '#3B82F6' }} className="text-sm mt-2">
          Manage your patient appointments and consultations
        </p>
      </div>

      {error && (
        <div className="mb-8 p-6 rounded-2xl flex gap-4 border-l-4" style={{ backgroundColor: '#FFE4D6', borderColor: '#E74C3C' }}>
          <AlertCircle size={24} color="#E74C3C" />
          <div>
            <p className="font-bold" style={{ color: '#C0392B' }}>Error</p>
            <p style={{ color: '#922B21' }} className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="mb-8 flex gap-3">
        {['All', 'Scheduled', 'Completed', 'Cancelled', 'No Show'].map(status => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className="px-4 py-2 rounded-lg font-semibold transition-all"
            style={{
              backgroundColor: selectedStatus === status ? '#3B82F6' : '#E5E7EB',
              color: selectedStatus === status ? '#FFFFFF' : '#1F2937',
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: '#FFFFFF' }}>
          <Calendar size={48} color="#D1D5DB" className="mx-auto mb-4" />
          <p style={{ color: '#6B7280' }} className="text-lg font-semibold">No appointments found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map(apt => {
            const statusConfig = getStatusColor(apt.status);
            const endTime = (() => {
              const [h, m] = apt.appointment_time.split(':').map(Number);
              const totalMin = h * 60 + m + (apt.duration_minutes || 30);
              const endH = Math.floor(totalMin / 60);
              const endM = totalMin % 60;
              return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
            })();

            return (
              <div
                key={apt.appointment_id}
                className="rounded-xl overflow-hidden transition-all hover:shadow-lg"
                style={{
                  backgroundColor: statusConfig.bgColor,
                  border: `2px solid ${statusConfig.color}`,
                }}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Clock size={18} color={statusConfig.color} />
                      <span className="font-bold text-lg" style={{ color: statusConfig.color }}>
                        {apt.appointment_time} - {endTime}
                      </span>
                    </div>
                    <span
                      className="px-3 py-1.5 rounded-lg text-sm font-bold"
                      style={{ backgroundColor: statusConfig.color, color: 'white' }}
                    >
                      {apt.status}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>Patient</p>
                    <p className="text-lg font-bold mt-1" style={{ color: '#1E40AF' }}>
                      {apt.patient_first_name} {apt.patient_last_name}
                    </p>
                    <p className="text-sm" style={{ color: '#6B7280' }}>MRN: {apt.mrn}</p>
                  </div>

                  {apt.reason_for_visit && (
                    <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: '#EFF6FF', borderLeft: '3px solid #3B82F6' }}>
                      <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>Reason for Visit</p>
                      <p className="text-sm mt-1" style={{ color: '#1E40AF' }}>{apt.reason_for_visit}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-4 pt-3" style={{ borderTop: `1px dashed ${statusConfig.color}` }}>
                    <p className="text-xs" style={{ color: '#6B7280' }}>
                      {new Date(apt.appointment_date).toLocaleDateString()}
                    </p>
                    <Link
                      href={`/doctor/appointments/${apt.appointment_id}`}
                      className="text-xs font-semibold px-3 py-2 rounded transition-all"
                      style={{ backgroundColor: statusConfig.color, color: 'white' }}
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
