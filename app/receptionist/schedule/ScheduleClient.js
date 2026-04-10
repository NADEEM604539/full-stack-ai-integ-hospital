'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Users, CheckCircle2, AlertCircle, Clock, Eye } from 'lucide-react';
import Link from 'next/link';

export default function ScheduleClient() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 10)); // April 10, 2026
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 3, 10));
  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [doctors, setDoctors] = useState([]);

  // Fetch all appointments
  useEffect(() => {
    fetchAppointments();
  }, []);

  // Filter appointments for selected date
  useEffect(() => {
    filterAppointmentsByDate();
  }, [allAppointments, selectedDate, selectedDoctor, selectedStatus]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/receptionist/appointments');
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const result = await response.json();
      const appts = result.data || result.appointments || [];
      
      setAllAppointments(appts);
      
      // Extract unique doctors
      const uniqueDoctors = [...new Set(appts.map(apt => apt.doctor_id))];
      const doctorsList = appts
        .filter((apt, index, arr) => arr.findIndex(a => a.doctor_id === apt.doctor_id) === index)
        .map(apt => ({
          id: apt.doctor_id,
          name: `${apt.doctor_first_name} ${apt.doctor_last_name}`
        }));
      
      setDoctors(doctorsList);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointmentsByDate = () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    
    let filtered = allAppointments.filter(apt => {
      const aptDate = apt.appointment_date.split('T')[0];
      return aptDate === dateStr;
    });

    if (selectedDoctor !== 'all') {
      filtered = filtered.filter(apt => apt.doctor_id === parseInt(selectedDoctor));
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(apt => apt.status === selectedStatus);
    }

    // Sort by time
    filtered.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
    setAppointments(filtered);
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getAppointmentsForDate = (day) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0];
    
    return allAppointments.filter(apt => {
      const aptDate = apt.appointment_date.split('T')[0];
      return aptDate === dateStr;
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Scheduled': return { color: '#3B82F6', bgColor: '#DBEAFE', border: '#3B82F6' };
      case 'Completed': return { color: '#10B981', bgColor: '#D1FAE5', border: '#10B981' };
      case 'Cancelled': return { color: '#EF4444', bgColor: '#FEE2E2', border: '#EF4444' };
      case 'No Show': return { color: '#F59E0B', bgColor: '#FEF3C7', border: '#F59E0B' };
      default: return { color: '#6B7280', bgColor: '#F3F4F6', border: '#6B7280' };
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calendar grid
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const calendarDays = [];
  
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Stats
  const todayStr = selectedDate.toISOString().split('T')[0];
  const todayAppts = allAppointments.filter(apt => apt.appointment_date.split('T')[0] === todayStr);
  const completedToday = todayAppts.filter(apt => apt.status === 'Completed').length;
  const scheduledToday = todayAppts.filter(apt => apt.status === 'Scheduled').length;
  const noShowToday = todayAppts.filter(apt => apt.status === 'No Show').length;

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Calendar size={48} color="#10B981" className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold" style={{ color: '#065F46' }}>
          Appointment Schedule
        </h1>
        <p style={{ color: '#10B981' }} className="text-sm mt-2">
          Manage and view all appointments for your department
        </p>
      </div>

      <div className="grid grid-cols-4 gap-8">
        {/* Left Column - Calendar & Filters */}
        <div className="col-span-1">
          {/* Mini Calendar */}
          <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: '#F9FAFB', border: '2px solid #E5E7EB' }}>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={previousMonth}
                className="p-2 rounded-lg transition-all hover:bg-gray-200"
                style={{ color: '#065F46' }}
              >
                <ChevronLeft size={20} />
              </button>
              <h3 className="font-bold text-center flex-1" style={{ color: '#065F46' }}>
                {monthNames[currentDate.getMonth()]}
                <br />
                <span className="text-sm">{currentDate.getFullYear()}</span>
              </h3>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg transition-all hover:bg-gray-200"
                style={{ color: '#065F46' }}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center font-semibold text-xs" style={{ color: '#6B7280' }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const aptsForDay = day ? getAppointmentsForDate(day) : [];
                const dayDate = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null;
                const isSelected = dayDate && 
                  dayDate.toDateString() === selectedDate.toDateString();
                const isToday = dayDate && 
                  dayDate.toDateString() === new Date(2026, 3, 10).toDateString();

                return (
                  <button
                    key={index}
                    onClick={() => day && setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                    className="p-2 rounded-lg text-xs font-semibold transition-all text-center relative"
                    style={{
                      backgroundColor: isSelected ? '#10B981' : isToday ? '#E8F8F5' : 'white',
                      color: isSelected ? 'white' : '#065F46',
                      border: isToday ? '2px solid #10B981' : '1px solid #E5E7EB',
                      cursor: day ? 'pointer' : 'default',
                    }}
                    disabled={!day}
                  >
                    {day}
                    {aptsForDay.length > 0 && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: isSelected ? 'white' : '#F59E0B' }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#F9FAFB', border: '2px solid #E5E7EB' }}>
            <h3 className="font-bold mb-4" style={{ color: '#065F46' }}>Filters</h3>

            {/* Doctor Filter */}
            <div className="mb-4">
              <label className="text-xs font-semibold block mb-2" style={{ color: '#6B7280' }}>Doctor</label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border-2 outline-none text-sm"
                style={{
                  borderColor: '#E5E7EB',
                  backgroundColor: '#FFFFFF',
                  color: '#1F2937',
                }}
              >
                <option value="all">All Doctors</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-xs font-semibold block mb-2" style={{ color: '#6B7280' }}>Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border-2 outline-none text-sm"
                style={{
                  borderColor: '#E5E7EB',
                  backgroundColor: '#FFFFFF',
                  color: '#1F2937',
                }}
              >
                <option value="all">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="No Show">No Show</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column - Daily View & Stats */}
        <div className="col-span-3">
          {/* Selected Date & Stats */}
          <div className="rounded-2xl p-8 mb-8" style={{ backgroundColor: '#F9FAFB', border: '2px solid #E5E7EB' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold" style={{ color: '#065F46' }}>
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h2>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: '#DBEAFE', borderLeft: '4px solid #3B82F6' }}>
                <p className="text-xs font-semibold" style={{ color: '#1E40AF' }}>Total Appointments</p>
                <p className="text-3xl font-bold mt-2" style={{ color: '#1E40AF' }}>{todayAppts.length}</p>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: '#D1FAE5', borderLeft: '4px solid #10B981' }}>
                <p className="text-xs font-semibold" style={{ color: '#065F46' }}>Completed</p>
                <p className="text-3xl font-bold mt-2" style={{ color: '#065F46' }}>{completedToday}</p>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: '#FEF3C7', borderLeft: '4px solid #F59E0B' }}>
                <p className="text-xs font-semibold" style={{ color: '#92400E' }}>Scheduled</p>
                <p className="text-3xl font-bold mt-2" style={{ color: '#92400E' }}>{scheduledToday}</p>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: '#FEE2E2', borderLeft: '4px solid #EF4444' }}>
                <p className="text-xs font-semibold" style={{ color: '#7F1D1D' }}>No Show</p>
                <p className="text-3xl font-bold mt-2" style={{ color: '#7F1D1D' }}>{noShowToday}</p>
              </div>
            </div>
          </div>

          {/* Appointments List */}
          <div className="rounded-2xl p-8" style={{ backgroundColor: '#F9FAFB', border: '2px solid #E5E7EB' }}>
            <h3 className="text-xl font-bold mb-6" style={{ color: '#065F46' }}>
              Appointments ({appointments.length})
            </h3>

            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar size={48} color="#D1D5DB" className="mx-auto mb-4" />
                <p style={{ color: '#6B7280' }} className="text-lg font-semibold">No appointments found</p>
                <p style={{ color: '#9CA3AF' }} className="text-sm mt-2">Try selecting a different date or adjusting filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt, index) => {
                  const statusConfig = getStatusColor(apt.status);
                  const endTime = (() => {
                    const [h, m] = apt.appointment_time.split(':').map(Number);
                    const totalMin = h * 60 + m + (apt.duration_minutes || 30);
                    const endH = Math.floor(totalMin / 60);
                    const endM = totalMin % 60;
                    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
                  })();

                  return (
                    <Link
                      key={apt.appointment_id}
                      href={`/receptionist/appointments/${apt.appointment_id}`}
                      className="block rounded-xl overflow-hidden transition-all hover:shadow-xl hover:scale-105"
                      style={{
                        textDecoration: 'none',
                        border: `2px solid ${statusConfig.color}`,
                        backgroundColor: statusConfig.bgColor,
                      }}
                    >
                      <div className="p-5">
                        {/* Header Row - Time & Status */}
                        <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: `1px solid ${statusConfig.color}` }}>
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

                        {/* Doctor Info */}
                        <div className="mb-3">
                          <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>Doctor</p>
                          <p className="text-lg font-bold mt-1" style={{ color: '#065F46' }}>
                            Dr. {apt.doctor_first_name} {apt.doctor_last_name}
                          </p>
                          <p className="text-sm" style={{ color: '#6B7280' }}>
                            {apt.specialization}
                          </p>
                        </div>

                        {/* Patient Info */}
                        <div className="mb-3">
                          <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>Patient</p>
                          <p className="text-base font-bold mt-1" style={{ color: '#065F46' }}>
                            {apt.patient_first_name} {apt.patient_last_name}
                          </p>
                          <p className="text-sm" style={{ color: '#6B7280' }}>
                            MRN: {apt.mrn}
                          </p>
                        </div>

                        {/* Reason for Visit */}
                        {apt.reason_for_visit && (
                          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${statusConfig.color}` }}>
                            <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>Reason for Visit</p>
                            <p className="text-sm mt-1" style={{ color: '#065F46' }}>
                              {apt.reason_for_visit}
                            </p>
                          </div>
                        )}

                        {/* Duration Footer */}
                        <div className="mt-3 pt-3 flex justify-between items-center" style={{ borderTop: `1px dashed ${statusConfig.color}` }}>
                          <p className="text-xs" style={{ color: '#6B7280' }}>
                            Duration: {apt.duration_minutes || 30} minutes
                          </p>
                          <span className="text-xs font-semibold px-2 py-1 rounded" style={{ backgroundColor: statusConfig.color, color: 'white' }}>
                            View Details →
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
