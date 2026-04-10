'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, FileText, Loader, AlertCircle, 
  CheckCircle, Plus, Edit, ArrowRight, ChevronRight 
} from 'lucide-react';
import Link from 'next/link';

export default function AppointmentDetailClient({ appointmentId }) {
  const [appointment, setAppointment] = useState(null);
  const [encounter, setEncounter] = useState(null);
  const [soapStatus, setSoapStatus] = useState({
    subjective: false,
    objective: false,
    assessment: false,
    plan: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatingEncounter, setCreatingEncounter] = useState(false);

  useEffect(() => {
    fetchAppointmentDetails();
  }, [appointmentId]);

  const handleCreateEncounter = async () => {
    try {
      setCreatingEncounter(true);
      const res = await fetch('/api/doctor/encounters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointmentId,
          encounterType: 'Outpatient',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create encounter');
      }

      const data = await res.json();
      setEncounter({
        encounter_id: data.encounter_id,
        status: 'Active',
        encounter_type: 'Outpatient',
      });
      setSoapStatus({
        subjective: false,
        objective: false,
        assessment: false,
        plan: false,
      });
    } catch (err) {
      console.error('Error creating encounter:', err);
      alert(`Failed to create encounter: ${err.message}`);
    } finally {
      setCreatingEncounter(false);
    }
  };

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch appointment details
      const aptRes = await fetch(`/api/doctor/appointments/${appointmentId}`);
      if (!aptRes.ok) {
        throw new Error('Failed to fetch appointment details');
      }
      const aptData = await aptRes.json();
      setAppointment(aptData.appointment);

      // Fetch encounter and SOAP status if appointment exists
      if (aptData.appointment?.appointment_id) {
        const encRes = await fetch(`/api/doctor/encounters?appointmentId=${appointmentId}`);
        if (encRes.ok) {
          const encData = await encRes.json();
          if (encData.encounter) {
            setEncounter(encData.encounter);
            setSoapStatus(encData.soapStatus || {});
          }
        }
      }
    } catch (err) {
      console.error('Error fetching appointment details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Scheduled': return { color: '#3B82F6', bgColor: '#DBEAFE' };
      case 'Completed': return { color: '#10B981', bgColor: '#D1FAE5' };
      case 'Cancelled': return { color: '#EF4444', bgColor: '#FEE2E2' };
      case 'No Show': return { color: '#F59E0B', bgColor: '#FEF3C7' };
      default: return { color: '#6B7280', bgColor: '#F3F4F6' };
    }
  };

  const soapCompletion = () => {
    const completed = Object.values(soapStatus).filter(v => v).length;
    return Math.round((completed / 4) * 100);
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} color="#3B82F6" className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8">
        <div className="p-6 rounded-2xl flex gap-4 border-l-4" style={{ backgroundColor: '#FFE4D6', borderColor: '#E74C3C' }}>
          <AlertCircle size={24} color="#E74C3C" />
          <div>
            <p className="font-bold" style={{ color: '#C0392B' }}>Error</p>
            <p style={{ color: '#922B21' }} className="text-sm mt-1">{error || 'Appointment not found'}</p>
          </div>
        </div>
        <Link
          href="/doctor/appointments"
          className="mt-6 inline-block px-4 py-2 rounded-lg font-semibold"
          style={{ backgroundColor: '#3B82F6', color: 'white' }}
        >
          ← Back to Appointments
        </Link>
      </div>
    );
  }

  const statusConfig = getStatusColor(appointment.status);
  const appointmentDate = new Date(appointment.appointment_date);
  const endTime = (() => {
    const [h, m] = appointment.appointment_time.split(':').map(Number);
    const totalMin = h * 60 + m + (appointment.duration_minutes || 30);
    const endH = Math.floor(totalMin / 60);
    const endM = totalMin % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  })();

  return (
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }} className="p-8">
      {/* Header with Back Button */}
      <div className="mb-8">
        <Link
          href="/doctor/appointments"
          className="inline-flex items-center gap-2 text-sm font-semibold mb-4"
          style={{ color: '#3B82F6' }}
        >
          ← Back to Appointments
        </Link>
        <h1 className="text-4xl font-bold" style={{ color: '#1E40AF' }}>
          Appointment Details
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Appointment Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment Card */}
          <div
            className="rounded-2xl overflow-hidden shadow-sm p-8"
            style={{ backgroundColor: '#FFFFFF', borderTop: `4px solid ${statusConfig.color}` }}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>Status</p>
                <span
                  className="inline-block px-4 py-2 rounded-lg text-sm font-bold mt-2"
                  style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
                >
                  {appointment.status}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>Appointment Date</p>
                <p className="text-2xl font-bold mt-2" style={{ color: '#1E40AF' }}>
                  {appointmentDate.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {/* Time */}
            <div className="mb-6 p-4 rounded-lg flex items-center gap-3" style={{ backgroundColor: '#F0FDF4', borderLeft: '3px solid #10B981' }}>
              <Clock size={20} color="#10B981" />
              <div>
                <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>Time</p>
                <p className="text-lg font-bold" style={{ color: '#065F46' }}>
                  {appointment.appointment_time} - {endTime} ({appointment.duration_minutes} minutes)
                </p>
              </div>
            </div>

            {/* Patient Info */}
            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#EFF6FF', borderLeft: '3px solid #3B82F6' }}>
              <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>Patient</p>
              <p className="text-xl font-bold mt-2" style={{ color: '#1E40AF' }}>
                {appointment.patient_first_name} {appointment.patient_last_name}
              </p>
              <div className="mt-3 space-y-2">
                <p><span style={{ color: '#6B7280' }} className="text-sm">MRN:</span> <span style={{ color: '#1E40AF' }} className="font-semibold">{appointment.mrn}</span></p>
                <p><span style={{ color: '#6B7280' }} className="text-sm">Department:</span> <span style={{ color: '#1E40AF' }} className="font-semibold">{appointment.department_name}</span></p>
              </div>
            </div>

            {/* Reason for Visit */}
            {appointment.reason_for_visit && (
              <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#FFFBF0', borderLeft: '3px solid #F59E0B' }}>
                <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>Reason for Visit</p>
                <p className="text-base mt-2" style={{ color: '#92400E' }}>{appointment.reason_for_visit}</p>
              </div>
            )}

            {/* Notes */}
            {appointment.notes && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#F3F4F6' }}>
                <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>Notes</p>
                <p className="text-sm mt-2" style={{ color: '#374151' }}>{appointment.notes}</p>
              </div>
            )}
          </div>

          {/* SOAP Notes Progress */}
          <div
            className="rounded-2xl overflow-hidden shadow-sm p-8"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#1E40AF' }}>
              SOAP Notes Status
            </h2>

            {!encounter ? (
              <div className="p-6 rounded-lg text-center" style={{ backgroundColor: '#F0FDF4', border: '2px dashed #10B981' }}>
                <FileText size={32} color="#10B981" className="mx-auto mb-3" />
                <p className="font-semibold" style={{ color: '#065F46' }}>No encounter created yet</p>
                <p className="text-sm mt-2" style={{ color: '#059669' }}>Create an encounter to begin documenting SOAP notes</p>
              </div>
            ) : (
              <>
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold" style={{ color: '#1E40AF' }}>Overall Progress</p>
                    <p className="text-sm font-bold" style={{ color: '#3B82F6' }}>{soapCompletion()}%</p>
                  </div>
                  <div className="w-full h-3 rounded-full" style={{ backgroundColor: '#E5E7EB' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        backgroundColor: '#10B981',
                        width: `${soapCompletion()}%`,
                      }}
                    />
                  </div>
                </div>

                {/* SOAP Components */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'subjective', label: 'Subjective', icon: User, description: 'Patient complaints and symptoms' },
                    { key: 'objective', label: 'Objective', icon: FileText, description: 'Physical exam, vitals, lab results' },
                    { key: 'assessment', label: 'Assessment', icon: CheckCircle, description: 'Diagnosis and clinical reasoning' },
                    { key: 'plan', label: 'Plan', icon: Plus, description: 'Treatment, medications, follow-up' },
                  ].map(section => {
                    const Icon = section.icon;
                    const isComplete = soapStatus[section.key];
                    return (
                      <Link
                        key={section.key}
                        href={`/doctor/encounters/${encounter.encounter_id}?section=${section.key}`}
                        className="p-4 rounded-lg transition-all hover:shadow-md cursor-pointer group"
                        style={{
                          backgroundColor: isComplete ? '#F0FDF4' : '#FEF3C7',
                          borderLeft: `4px solid ${isComplete ? '#10B981' : '#F59E0B'}`,
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-bold text-lg" style={{ color: '#1E40AF' }}>
                              {section.label}
                            </p>
                            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                              {section.description}
                            </p>
                          </div>
                          {isComplete ? (
                            <CheckCircle size={20} color="#10B981" className="flex-shrink-0" />
                          ) : (
                            <Edit size={20} color="#F59E0B" className="flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sidebar - Quick Actions */}
        <div className="space-y-6">
          {/* Action Button */}
          {!encounter ? (
            <button
              onClick={handleCreateEncounter}
              disabled={creatingEncounter}
              className="w-full rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all disabled:opacity-50"
              style={{ backgroundColor: '#10B981', color: 'white', display: 'block' }}
            >
              <div className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{creatingEncounter ? 'Creating...' : 'Create Encounter'}</p>
                  <p className="text-xs mt-1 opacity-90">Start documenting SOAP notes</p>
                </div>
                {creatingEncounter ? (
                  <Loader size={24} className="animate-spin" />
                ) : (
                  <Plus size={24} />
                )}
              </div>
            </button>
          ) : (
            <Link
              href={`/doctor/encounters/${encounter.encounter_id}`}
              className="w-full rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
              style={{ backgroundColor: '#3B82F6', color: 'white', display: 'block' }}
            >
              <div className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Continue Encounter</p>
                  <p className="text-xs mt-1 opacity-90">Edit SOAP notes</p>
                </div>
                <ArrowRight size={24} />
              </div>
            </Link>
          )}

          {/* Quick Info Card */}
          <div
            className="rounded-2xl overflow-hidden shadow-sm p-6"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <h3 className="font-bold mb-4" style={{ color: '#1E40AF' }}>Encounter Info</h3>
            {encounter ? (
              <>
                <div className="mb-3">
                  <p className="text-xs" style={{ color: '#6B7280' }}>Encounter ID</p>
                  <p className="text-sm font-semibold mt-1" style={{ color: '#1E40AF' }}>{encounter.encounter_id}</p>
                </div>
                <div className="mb-3">
                  <p className="text-xs" style={{ color: '#6B7280' }}>Type</p>
                  <p className="text-sm font-semibold mt-1" style={{ color: '#1E40AF' }}>{encounter.encounter_type}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Status</p>
                  <span
                    className="inline-block text-xs font-bold px-3 py-1.5 rounded mt-1"
                    style={{
                      backgroundColor: encounter.status === 'Active' ? '#D1FAE5' : '#E5E7EB',
                      color: encounter.status === 'Active' ? '#065F46' : '#374151',
                    }}
                  >
                    {encounter.status}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm" style={{ color: '#6B7280' }}>No encounter created</p>
            )}
          </div>

          {/* Department Card */}
          <div
            className="rounded-2xl overflow-hidden shadow-sm p-6"
            style={{ backgroundColor: '#EFF6FF', borderLeft: '4px solid #3B82F6' }}
          >
            <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>Department</p>
            <p className="text-lg font-bold mt-2" style={{ color: '#1E40AF' }}>
              {appointment.department_name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
