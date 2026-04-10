'use client';

import { useState, useEffect } from 'react';
import { Search, Calendar, Clock, User, Stethoscope, CheckCircle2, AlertCircle, Loader, ArrowLeft } from 'lucide-react';

export default function AppointmentBookingClient() {
  // Left side - Patient selection
  const [searchPatient, setSearchPatient] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientLoading, setPatientLoading] = useState(false);

  // Right side - Doctor and time selection
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [reasonForVisit, setReasonForVisit] = useState('');

  // Status
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch patients on page load
  useEffect(() => {
    fetchPatients();
  }, [searchPatient]);

  const fetchPatients = async () => {
    if (!searchPatient.trim() && patients.length > 0) return; // Don't fetch if empty search
    
    setPatientLoading(true);
    try {
      const response = await fetch(`/api/receptionist/patients?search=${encodeURIComponent(searchPatient)}`);
      const data = await response.json();
      setPatients(data.data || []);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
      setPatients([]);
    } finally {
      setPatientLoading(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearchPatient('');
    setPatients([]);
    // Reset doctor selection when patient changes
    setSelectedDoctor(null);
    setSelectedDate('');
    setTimeSlots([]);
    setSelectedTime(null);
    // Fetch doctors for this patient's department
    fetchDoctorsForDepartment(patient.department_id);
  };

  const fetchDoctorsForDepartment = async (departmentId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/receptionist/doctors?department_id=${departmentId}`);
      const data = await response.json();
      setDoctors(data.data || []);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
      setDoctors([]);
      setError('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoctor = async (doctor) => {
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
      const response = await fetch(`/api/receptionist/doctor-slots?doctor_id=${doctorId}&date=${date}`);
      const data = await response.json();
      setTimeSlots(data.slots || []);
    } catch (err) {
      console.error('Failed to fetch time slots:', err);
      setTimeSlots([]);
      setError('Failed to load available time slots');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async () => {
    if (!selectedPatient || !selectedDoctor || !selectedDate || !selectedTime) {
      setError('Please select patient, doctor, date, and time');
      return;
    }

    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/receptionist/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: selectedPatient.patient_id,
          doctor_id: selectedDoctor.doctor_id,
          department_id: selectedPatient.department_id,
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          reason_for_visit: reasonForVisit,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create appointment');
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/receptionist/appointments';
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8">
      {/* Header */}
      <a
        href="/receptionist/appointments"
        className="flex items-center gap-2 text-sm font-semibold mb-8 transition-all hover:gap-3"
        style={{ color: '#10B981', textDecoration: 'none' }}
      >
        <ArrowLeft size={18} />
        Back to Appointments
      </a>

      <div className="mb-10">
        <h1 className="text-4xl font-bold" style={{ color: '#065F46' }}>
          Book New Appointment
        </h1>
        <p style={{ color: '#6B7280' }} className="mt-2">
          Select a patient, choose a doctor, and pick an available time slot
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div 
          className="mb-8 p-6 rounded-2xl flex gap-4 border-l-4"
          style={{ 
            backgroundColor: '#E8F8F5',
            borderColor: '#10B981'
          }}
        >
          <CheckCircle2 size={28} color="#10B981" className="flex-shrink-0" />
          <div>
            <p className="font-bold text-lg" style={{ color: '#065F46' }}>
              Appointment Created!
            </p>
            <p style={{ color: '#10B981' }} className="text-sm mt-1">
              Redirecting you back...
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && !success && (
        <div 
          className="mb-8 p-6 rounded-2xl flex gap-4 border-l-4"
          style={{ 
            backgroundColor: '#FFE4D6',
            borderColor: '#E74C3C'
          }}
        >
          <AlertCircle size={28} color="#E74C3C" className="flex-shrink-0" />
          <div>
            <p className="font-bold" style={{ color: '#C0392B' }}>
              Error
            </p>
            <p style={{ color: '#922B21' }} className="text-sm mt-1">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-8">
        {/* LEFT COLUMN - PATIENT SELECTION */}
        <div 
          className="rounded-2xl p-8"
          style={{
            backgroundColor: '#F9FAFB',
            border: '2px solid #E5E7EB',
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="p-3 rounded-lg"
              style={{ backgroundColor: '#E8F8F5' }}
            >
              <User size={24} color="#10B981" />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: '#065F46' }}>
              Select Patient
            </h2>
          </div>

          {/* Patient Search */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-3" style={{ color: '#065F46' }}>
              Search Patient
            </label>
            <div className="relative">
              <Search size={18} style={{ color: '#10B981' }} className="absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchPatient}
                onChange={(e) => setSearchPatient(e.target.value)}
                placeholder="Search by name, email, or MRN..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all"
                style={{
                  borderColor: searchPatient ? '#10B981' : '#E5E7EB',
                  backgroundColor: '#FFFFFF',
                  color: '#1F2937',
                }}
              />
            </div>
          </div>

          {/* Selected Patient */}
          {selectedPatient && (
            <div 
              className="mb-6 p-4 rounded-lg border-2"
              style={{
                backgroundColor: '#E8F8F5',
                borderColor: '#10B981',
              }}
            >
              <p className="text-sm font-semibold" style={{ color: '#065F46' }}>
                Selected Patient
              </p>
              <p className="text-lg font-bold" style={{ color: '#065F46' }}>
                {selectedPatient.first_name} {selectedPatient.last_name}
              </p>
              <p style={{ color: '#6B7280' }} className="text-sm mt-2">
                MRN: {selectedPatient.mrn}
              </p>
              <p style={{ color: '#10B981' }} className="text-sm mt-1">
                ✓ Ready to book appointment
              </p>
            </div>
          )}

          {/* Patient List */}
          {searchPatient && !patientLoading && patients.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {patients.map((patient) => (
                <button
                  key={patient.patient_id}
                  onClick={() => handleSelectPatient(patient)}
                  className="w-full text-left p-4 rounded-lg transition-all hover:shadow-md"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                  }}
                >
                  <p className="font-semibold" style={{ color: '#1F2937' }}>
                    {patient.first_name} {patient.last_name}
                  </p>
                  <p style={{ color: '#6B7280' }} className="text-sm">
                    MRN: {patient.mrn}
                  </p>
                  <p style={{ color: '#10B981' }} className="text-xs mt-1">
                    {patient.email}
                  </p>
                </button>
              ))}
            </div>
          )}

          {patientLoading && (
            <div className="flex justify-center py-8">
              <Loader size={32} className="animate-spin" style={{ color: '#10B981' }} />
            </div>
          )}

          {searchPatient && !patientLoading && patients.length === 0 && (
            <div className="text-center py-8">
              <p style={{ color: '#6B7280' }}>No patients found</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - DOCTOR AND TIME SELECTION */}
        <div 
          className="rounded-2xl p-8"
          style={{
            backgroundColor: '#F9FAFB',
            border: '2px solid #E5E7EB',
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="p-3 rounded-lg"
              style={{ backgroundColor: '#E8F8F5' }}
            >
              <Stethoscope size={24} color="#10B981" />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: '#065F46' }}>
              Select Doctor & Time
            </h2>
          </div>

          {!selectedPatient ? (
            <div className="text-center py-12">
              <p style={{ color: '#6B7280' }}>
                Select a patient first to view available doctors
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Doctor Selection */}
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: '#065F46' }}>
                  Select Doctor
                </label>
                {loading && doctors.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <Loader size={32} className="animate-spin" style={{ color: '#10B981' }} />
                  </div>
                ) : (
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {doctors.map((doctor) => (
                      <button
                        key={doctor.doctor_id}
                        onClick={() => handleSelectDoctor(doctor)}
                        className="w-full text-left p-4 rounded-lg transition-all"
                        style={{
                          backgroundColor: selectedDoctor?.doctor_id === doctor.doctor_id ? '#E8F8F5' : '#FFFFFF',
                          border: selectedDoctor?.doctor_id === doctor.doctor_id ? '2px solid #10B981' : '1px solid #E5E7EB',
                        }}
                      >
                        <p className="font-semibold" style={{ color: '#1F2937' }}>
                          Dr. {doctor.staff_first_name} {doctor.staff_last_name}
                        </p>
                        <p style={{ color: '#10B981' }} className="text-sm">
                          {doctor.specialization}
                        </p>
                        <p style={{ color: '#6B7280' }} className="text-xs mt-1">
                          Fee: Rs. {doctor.consultation_fee}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Selection */}
              {selectedDoctor && (
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: '#065F46' }}>
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all"
                    style={{
                      borderColor: selectedDate ? '#10B981' : '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                    }}
                  />
                </div>
              )}

              {/* Time Slot Selection */}
              {selectedDate && selectedDoctor && (
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: '#065F46' }}>
                    Select Time
                  </label>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader size={32} className="animate-spin" style={{ color: '#10B981' }} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                      {timeSlots.length > 0 ? (
                        timeSlots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setSelectedTime(slot)}
                            className="p-3 rounded-lg transition-all font-semibold text-sm"
                            style={{
                              backgroundColor: selectedTime === slot ? '#10B981' : '#FFFFFF',
                              color: selectedTime === slot ? '#FFFFFF' : '#1F2937',
                              border: selectedTime === slot ? '2px solid #10B981' : '1px solid #E5E7EB',
                            }}
                          >
                            <Clock size={14} className="inline mr-1" />
                            {slot}
                          </button>
                        ))
                      ) : (
                        <p style={{ color: '#6B7280' }} className="col-span-3 text-center py-4">
                          No available slots for this date
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Reason for Visit */}
              {selectedTime && (
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: '#065F46' }}>
                    Reason for Visit (Optional)
                  </label>
                  <textarea
                    value={reasonForVisit}
                    onChange={(e) => setReasonForVisit(e.target.value)}
                    placeholder="Enter reason for appointment..."
                    rows="3"
                    className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all"
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                    }}
                  />
                </div>
              )}

              {/* Create Button */}
              {selectedTime && (
                <button
                  onClick={handleCreateAppointment}
                  disabled={submitting}
                  className="w-full py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: submitting ? '#CCCCCC' : '#10B981',
                    color: '#FFFFFF',
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader size={20} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={20} />
                      Create Appointment
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
