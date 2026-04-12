'use client';

import { useState, useEffect } from 'react';
import { Search, Calendar, Clock, User, Stethoscope, CheckCircle2, AlertCircle, Loader, X } from 'lucide-react';

export default function PatientAppointmentBookingClient({ patientId, patientInfo, onClose, onSuccess }) {
  // Doctor and time selection
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [reasonForVisit, setReasonForVisit] = useState('');

  // Status
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch doctors on component mount
  useEffect(() => {
    fetchDoctors();
  }, [patientId]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/patient/${patientId}/doctors`);
      const data = await response.json();
      if (response.ok) {
        setDoctors(data.data || []);
      } else {
        setError(data.error || 'Failed to load doctors');
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
      setError('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedDate('');
    setTimeSlots([]);
    setSelectedTime(null);
  };

  const handleDateChange = async (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setSelectedTime(null);
    
    if (date && selectedDoctor) {
      await fetchAvailableTimeSlots(selectedDoctor.doctor_id, date);
    }
  };

  const fetchAvailableTimeSlots = async (doctorId, date) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/patient/${patientId}/time-slots?doctor_id=${doctorId}&date=${date}`);
      const data = await response.json();
      if (response.ok) {
        setTimeSlots(data.slots || []);
      } else {
        setError(data.error || 'Failed to load time slots');
      }
    } catch (err) {
      console.error('Failed to fetch time slots:', err);
      setError('Failed to load available time slots');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      setError('Please select doctor, date, and time');
      return;
    }

    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/patient/${patientId}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: selectedDoctor.doctor_id,
          appointment_date: selectedDate,
          appointment_time: selectedTime + ':00',
          reason_for_visit: reasonForVisit,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to book appointment');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getDoctorFullName = (doctor) => {
    return `${doctor.staff_first_name} ${doctor.staff_last_name}`;
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-12 max-w-md">
          <div className="flex items-center justify-center gap-3">
            <Loader size={24} className="animate-spin" style={{ color: '#10B981' }} />
            <p className="text-lg" style={{ color: '#065F46' }}>Loading available doctors...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div style={{ backgroundColor: '#FFFFFF' }} className="rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div
          className="sticky top-0 shadow-md px-8 py-6 flex justify-between items-center"
          style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            zIndex: 10
          }}
        >
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Book an Appointment</h2>
            <p className="text-emerald-100">Schedule your visit with a doctor from {patientInfo?.department_name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-emerald-700 p-2 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Success Message */}
          {success && (
            <div
              style={{
                backgroundColor: '#E8F8F5',
                borderLeft: '5px solid #10B981',
              }}
              className="rounded-lg p-5 mb-8 flex items-start gap-4"
            >
              <CheckCircle2 size={24} style={{ color: '#10B981' }} className="flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold" style={{ color: '#065F46' }}>
                  Success!
                </h3>
                <p style={{ color: '#065F46' }} className="text-sm mt-1">
                  Your appointment has been booked successfully. Redirecting...
                </p>
              </div>
            </div>
          )}

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
                  Error
                </h3>
                <p style={{ color: '#065F46' }} className="text-sm mt-1">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Patient Info Section */}
          <div
            style={{
              backgroundColor: '#F0FDF4',
              border: '2px solid #10B981',
            }}
            className="rounded-lg p-6 mb-8"
          >
            <div className="flex items-center gap-4">
              <div
                style={{
                  backgroundColor: '#10B981',
                  width: '50px',
                  height: '50px',
                }}
                className="rounded-full flex items-center justify-center flex-shrink-0"
              >
                <User size={28} style={{ color: 'white' }} />
              </div>
              <div>
                <p style={{ color: '#10B981' }} className="text-sm font-semibold uppercase">Booking for</p>
                <p className="text-xl font-bold" style={{ color: '#065F46' }}>
                  {patientInfo?.first_name} {patientInfo?.last_name}
                </p>
                <p style={{ color: '#059669' }} className="text-sm">
                  {patientInfo?.department_name}
                </p>
              </div>
            </div>
          </div>

          {/* Two Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left Column - Doctor Selection */}
            <div>
              <label className="block text-lg font-semibold mb-4" style={{ color: '#065F46' }}>
                <Stethoscope size={20} className="inline mr-2" />
                Select a Doctor
              </label>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {doctors.length === 0 ? (
                  <p style={{ color: '#6B7280' }} className="text-center py-8">
                    No doctors available in your department
                  </p>
                ) : (
                  doctors.map((doctor) => (
                    <button
                      key={doctor.doctor_id}
                      onClick={() => handleSelectDoctor(doctor)}
                      style={{
                        backgroundColor: selectedDoctor?.doctor_id === doctor.doctor_id ? '#10B981' : '#F3F4F6',
                        color: selectedDoctor?.doctor_id === doctor.doctor_id ? 'white' : '#065F46',
                        borderColor: selectedDoctor?.doctor_id === doctor.doctor_id ? '#10B981' : '#E5E7EB',
                      }}
                      className="w-full text-left p-4 rounded-lg border-2 transition hover:shadow-md"
                    >
                      <p className="font-semibold">Dr. {getDoctorFullName(doctor)}</p>
                      <p
                        style={{
                          color: selectedDoctor?.doctor_id === doctor.doctor_id ? '#D1FAE5' : '#6B7280',
                        }}
                        className="text-sm"
                      >
                        {doctor.specialization}
                      </p>
                      {doctor.consultation_fee && (
                        <p
                          style={{
                            color: selectedDoctor?.doctor_id === doctor.doctor_id ? '#D1FAE5' : '#059669',
                          }}
                          className="text-sm font-medium mt-1"
                        >
                          Rs. {doctor.consultation_fee}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right Column - Date & Time Selection */}
            <div>
              <label className="block text-lg font-semibold mb-4" style={{ color: '#065F46' }}>
                <Calendar size={20} className="inline mr-2" />
                Select Date & Time
              </label>
              
              {selectedDoctor ? (
                <div className="space-y-6">
                  {/* Date Picker */}
                  <div>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={handleDateChange}
                      min={getTodayDate()}
                      style={{
                        backgroundColor: '#F3F4F6',
                        borderColor: '#E5E7EB',
                        color: '#065F46',
                      }}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div>
                      <label style={{ color: '#6B7280' }} className="text-sm font-medium mb-3 block">
                        <Clock size={16} className="inline mr-2" />
                        Available Times
                      </label>
                      <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto">
                        {timeSlots.length === 0 ? (
                          <p style={{ color: '#6B7280' }} className="col-span-2 text-center py-8 text-sm">
                            No available slots on this date
                          </p>
                        ) : (
                          timeSlots.map((time) => (
                            <button
                              key={time}
                              onClick={() => setSelectedTime(time)}
                              style={{
                                backgroundColor: selectedTime === time ? '#10B981' : '#F3F4F6',
                                color: selectedTime === time ? 'white' : '#065F46',
                                borderColor: selectedTime === time ? '#10B981' : '#E5E7EB',
                              }}
                              className="py-2 px-3 rounded-lg border-2 transition hover:shadow-md font-medium"
                            >
                              {time}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reason for Visit */}
                  <div>
                    <label style={{ color: '#065F46' }} className="text-sm font-semibold mb-2 block">
                      Reason for Visit (Optional)
                    </label>
                    <textarea
                      value={reasonForVisit}
                      onChange={(e) => setReasonForVisit(e.target.value)}
                      placeholder="Describe your symptoms or reason for visit..."
                      style={{
                        backgroundColor: '#F3F4F6',
                        borderColor: '#E5E7EB',
                        color: '#065F46',
                      }}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                      rows="3"
                    />
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: '#F3F4F6',
                  }}
                  className="rounded-lg p-8 text-center h-[300px] flex items-center justify-center"
                >
                  <p style={{ color: '#6B7280' }}>
                    Please select a doctor to view available dates and times
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#E5E7EB',
                color: '#065F46',
              }}
              className="font-semibold px-8 py-3 rounded-full transition hover:shadow-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleBookAppointment}
              disabled={submitting || !selectedDoctor || !selectedDate || !selectedTime}
              style={{
                backgroundColor: selectedDoctor && selectedDate && selectedTime ? '#10B981' : '#D1D5DB',
                color: 'white',
              }}
              className="font-semibold px-8 py-3 rounded-full transition hover:shadow-lg disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader size={18} className="animate-spin" />
                  Booking...
                </span>
              ) : (
                'Book Appointment'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
