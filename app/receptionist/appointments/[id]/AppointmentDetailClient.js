'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Stethoscope, Phone, Mail, AlertCircle, Loader, ArrowLeft, Edit2, Save, X, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function AppointmentDetailClient({ appointmentId }) {
  // Appointment data
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    doctor_id: null,
    appointment_date: '',
    appointment_time: '',
    reason_for_visit: '',
    status: '',
  });

  // Editable fields
  const [doctors, setDoctors] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch appointment details
  useEffect(() => {
    if (!appointmentId) {
      setError('No appointment ID provided');
      setLoading(false);
      return;
    }
    fetchAppointmentDetail();
  }, [appointmentId]);

  const fetchAppointmentDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = `/api/receptionist/appointments/${appointmentId}`;      
      const response = await fetch(url);
            
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch appointment`);
      }

      const result = await response.json();      
      const apt = result.appointment || result.data;
      
      if (!apt) {
        throw new Error('Appointment not found in response');
      }

      setAppointment(apt);
      setEditData({
        doctor_id: apt.doctor_id,
        appointment_date: apt.appointment_date,
        appointment_time: apt.appointment_time,
        reason_for_visit: apt.reason_for_visit || '',
        status: apt.status,
      });

      // Fetch available doctors for this appointment
      if (apt.department_id) {
        fetchDoctorsForDepartment(apt.department_id);
      }
    } catch (err) {
      console.error('Error fetching appointment:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorsForDepartment = async (departmentId) => {
    try {
      const url = `/api/receptionist/doctors?department_id=${departmentId}`;      
      const response = await fetch(url);
      const data = await response.json();      
      setDoctors(data.data || []);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  };

  const handleDateChange = async (date) => {
    setEditData(prev => ({ ...prev, appointment_date: date, appointment_time: '' }));
    
    if (date && editData.doctor_id) {
      await fetchTimeSlots(editData.doctor_id, date);
    }
  };

  const fetchTimeSlots = async (doctorId, date) => {
    try {
      const response = await fetch(`/api/receptionist/doctor-slots?doctor_id=${doctorId}&date=${date}`);
      const data = await response.json();
      setTimeSlots(data.slots || []);
    } catch (err) {
      console.error('Failed to fetch time slots:', err);
      setTimeSlots([]);
    }
  };

  const handleDoctorChange = async (doctorId) => {
    setEditData(prev => ({ ...prev, doctor_id: doctorId, appointment_time: '' }));
    
    // Only fetch time slots if a doctor is selected
    if (doctorId && editData.appointment_date) {
      await fetchTimeSlots(doctorId, editData.appointment_date);
    } else {
      setTimeSlots([]);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/receptionist/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update appointment');
      }

      setSuccess(true);
      setIsEditing(false);
      
      // Refresh data
      setTimeout(() => {
        fetchAppointmentDetail();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} color="#10B981" className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8">
        <Link href="/receptionist/appointments" className="flex items-center gap-2 text-sm font-semibold mb-8" style={{ color: '#10B981', textDecoration: 'none' }}>
          <ArrowLeft size={18} />
          Back to Appointments
        </Link>
        <div className="p-6 rounded-2xl flex gap-4 border-l-4" style={{ backgroundColor: '#FFE4D6', borderColor: '#E74C3C' }}>
          <AlertCircle size={24} color="#E74C3C" />
          <div>
            <p className="font-bold" style={{ color: '#C0392B' }}>Error</p>
            <p style={{ color: '#922B21' }} className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8">
        <Link href="/receptionist/appointments" className="flex items-center gap-2 text-sm font-semibold mb-8" style={{ color: '#10B981', textDecoration: 'none' }}>
          <ArrowLeft size={18} />
          Back to Appointments
        </Link>
        <p style={{ color: '#6B7280' }}>Appointment not found</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'Scheduled': return { color: '#3B82F6', bgColor: '#DBEAFE', icon: '📅' };
      case 'Completed': return { color: '#10B981', bgColor: '#D1FAE5', icon: '✓' };
      case 'Cancelled': return { color: '#EF4444', bgColor: '#FEE2E2', icon: '✕' };
      case 'No Show': return { color: '#F59E0B', bgColor: '#FEF3C7', icon: '⏭' };
      default: return { color: '#6B7280', bgColor: '#F3F4F6', icon: '?' };
    }
  };

  const calculateEndTime = (startTime, durationMinutes) => {
    if (!startTime || !durationMinutes) return null;
    
    const [hours, minutes, seconds] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const statusConfig = getStatusColor(appointment.status);

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8">
      {/* Header */}
      <Link href="/receptionist/appointments" className="flex items-center gap-2 text-sm font-semibold mb-8 transition-all hover:gap-3" style={{ color: '#10B981', textDecoration: 'none' }}>
        <ArrowLeft size={18} />
        Back to Appointments
      </Link>

      {/* Success Message */}
      {success && (
        <div className="mb-8 p-6 rounded-2xl flex gap-4 border-l-4" style={{ backgroundColor: '#E8F8F5', borderColor: '#10B981' }}>
          <CheckCircle2 size={28} color="#10B981" />
          <div>
            <p className="font-bold" style={{ color: '#065F46' }}>Changes Saved!</p>
            <p style={{ color: '#10B981' }} className="text-sm mt-1">Appointment updated successfully</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-8 p-6 rounded-2xl flex gap-4 border-l-4" style={{ backgroundColor: '#FFE4D6', borderColor: '#E74C3C' }}>
          <AlertCircle size={28} color="#E74C3C" />
          <div>
            <p className="font-bold" style={{ color: '#C0392B' }}>Error</p>
            <p style={{ color: '#922B21' }} className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Title Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold" style={{ color: '#065F46' }}>
            Appointment Details
          </h1>
          <p style={{ color: '#10B981' }} className="text-sm mt-2">
            Appointment ID: {appointment.appointment_id}
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all hover:shadow-lg"
            style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
          >
            <Edit2 size={20} />
            Edit Appointment
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-8">
        {/* Left Column - Patient Info */}
        <div className="col-span-2">
          {/* Patient Details Card */}
          <div className="rounded-2xl p-8 mb-8" style={{ backgroundColor: '#F9FAFB', border: '2px solid #E5E7EB' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#E8F8F5' }}>
                <User size={24} color="#10B981" />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: '#065F46' }}>Patient Information</h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>Name</p>
                <p className="text-lg font-bold mt-1" style={{ color: '#065F46' }}>
                  {appointment.patient_first_name} {appointment.patient_last_name}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>MRN</p>
                <p className="text-lg font-bold mt-1" style={{ color: '#065F46' }}>
                  {appointment.mrn || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>Phone</p>
                <p className="text-lg font-bold mt-1 flex items-center gap-2" style={{ color: '#065F46' }}>
                  <Phone size={18} />
                  {appointment.patient_phone}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>Status</p>
                <div className="mt-2">
                  <span
                    className="px-4 py-2 rounded-lg font-semibold text-sm"
                    style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
                  >
                    {statusConfig.icon} {appointment.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Doctor & Appointment Details */}
          <div className="rounded-2xl p-8 mb-8" style={{ backgroundColor: '#F9FAFB', border: '2px solid #E5E7EB' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#FEF3C7' }}>
                <Stethoscope size={24} color="#F59E0B" />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: '#065F46' }}>Doctor & Appointment Details</h2>
            </div>

            {isEditing ? (
              <div className="space-y-6">
                {/* Doctor Selection */}
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: '#065F46' }}>Doctor</label>
                  <select
                    value={editData.doctor_id || ''}
                    onChange={(e) => handleDoctorChange(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-3 rounded-lg border-2 outline-none"
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                    }}
                  >
                    <option value="">No doctor assigned (Click to assign)</option>
                    {doctors.map(doc => (
                      <option key={doc.doctor_id} value={doc.doctor_id}>
                        {doc.staff_first_name} {doc.staff_last_name} - {doc.specialization}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: '#065F46' }}>Date</label>
                  <input
                    type="date"
                    value={editData.appointment_date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 outline-none"
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                    }}
                  />
                </div>

                {/* Time Selection */}
                {editData.appointment_date && (
                  <div>
                    <label className="block text-sm font-semibold mb-3" style={{ color: '#065F46' }}>Time</label>
                    {timeSlots.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2">
                        {timeSlots.map(slot => (
                          <button
                            key={slot}
                            onClick={() => setEditData(prev => ({ ...prev, appointment_time: slot }))}
                            className="px-3 py-2 rounded-lg font-semibold text-sm transition-all"
                            style={{
                              backgroundColor: editData.appointment_time === slot ? '#10B981' : '#E5E7EB',
                              color: editData.appointment_time === slot ? '#FFFFFF' : '#1F2937',
                              border: editData.appointment_time === slot ? '2px solid #10B981' : '2px solid #E5E7EB',
                            }}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: '#6B7280' }} className="text-sm">No available slots for this date</p>
                    )}
                  </div>
                )}

                {/* Reason for Visit */}
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: '#065F46' }}>Reason for Visit</label>
                  <textarea
                    value={editData.reason_for_visit}
                    onChange={(e) => setEditData(prev => ({ ...prev, reason_for_visit: e.target.value }))}
                    placeholder="Enter reason for visit..."
                    rows="4"
                    className="w-full px-4 py-3 rounded-lg border-2 outline-none resize-none"
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                    }}
                  />
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: '#065F46' }}>Appointment Status</label>
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border-2 outline-none"
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                    }}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="No Show">No Show</option>
                  </select>
                </div>

                {/* Edit Actions */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleSaveChanges}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-lg disabled:opacity-50"
                    style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                  >
                    {submitting ? <Loader size={20} className="animate-spin" /> : <Save size={20} />}
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({
                        doctor_id: appointment.doctor_id,
                        appointment_date: appointment.appointment_date,
                        appointment_time: appointment.appointment_time,
                        reason_for_visit: appointment.reason_for_visit || '',
                        status: appointment.status,
                      });
                    }}
                    className="flex-1 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
                    style={{ backgroundColor: '#E5E7EB', color: '#1F2937' }}
                  >
                    <X size={20} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>Doctor</p>
                  <p className="text-lg font-bold mt-1" style={{ color: '#065F46' }}>
                    {appointment.doctor_first_name && appointment.doctor_last_name 
                      ? `${appointment.doctor_first_name} ${appointment.doctor_last_name}`
                      : 'No doctor assigned'}
                  </p>
                  <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
                    {appointment.specialization || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>Consultation Fee</p>
                  <p className="text-lg font-bold mt-1" style={{ color: '#065F46' }}>
                    {appointment.consultation_fee ? `Rs. ${appointment.consultation_fee}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>Date & Time</p>
                  <p className="text-lg font-bold mt-1 flex items-center gap-2" style={{ color: '#065F46' }}>
                    <Calendar size={18} />
                    {new Date(appointment.appointment_date).toLocaleDateString()} {appointment.appointment_time} - {calculateEndTime(appointment.appointment_time, appointment.duration_minutes)}
                  </p>
                  <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
                    Duration: {appointment.duration_minutes} minutes
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>Status</p>
                  <div className="mt-2">
                    <span
                      className="px-4 py-2 rounded-lg font-semibold text-sm"
                      style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
                    >
                      {statusConfig.icon} {appointment.status}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>Reason for Visit</p>
                  <p className="text-sm mt-1" style={{ color: '#065F46' }}>
                    {appointment.reason_for_visit || 'Not specified'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Quick Stats */}
        <div>
          <div className="rounded-2xl p-8" style={{ backgroundColor: '#F9FAFB', border: '2px solid #E5E7EB' }}>
            <h3 className="text-xl font-bold mb-6" style={{ color: '#065F46' }}>Quick Info</h3>
            
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>Appointment ID</p>
                <p className="text-lg font-mono font-bold mt-2" style={{ color: '#065F46' }}>
                  #{appointment.appointment_id}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>Department</p>
                <p className="text-lg font-bold mt-2" style={{ color: '#065F46' }}>
                  {appointment.department_name || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>Created Date</p>
                <p className="text-sm font-bold mt-2" style={{ color: '#065F46' }}>
                  {appointment.created_at ? new Date(appointment.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>

              <div className="pt-4 border-t-2" style={{ borderColor: '#E5E7EB' }}>
                <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>Overall Status</p>
                <div className="mt-3">
                  <span
                    className="px-4 py-2 rounded-lg font-semibold text-sm block text-center"
                    style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
                  >
                    {statusConfig.icon} {appointment.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
