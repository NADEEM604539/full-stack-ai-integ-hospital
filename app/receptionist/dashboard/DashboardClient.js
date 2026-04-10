'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Stethoscope, Phone, FileText, Bell, Settings, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DashboardClient({ initialStats, initialAppointments, initialError }) {
  const [stats, setStats] = useState(initialStats);
  const [appointments, setAppointments] = useState(initialAppointments || []);
  const [error, setError] = useState(initialError);

  // Error state
  if (error) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8">
        <div
          className="p-6 rounded-2xl flex gap-4"
          style={{ backgroundColor: '#FFE4D6', borderLeftWidth: '4px', borderColor: '#E74C3C' }}
        >
          <AlertCircle size={24} color="#E74C3C" />
          <div>
            <p className="font-bold" style={{ color: '#C0392B' }}>
              Error Loading Dashboard
            </p>
            <p style={{ color: '#922B21' }} className="text-sm mt-1">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      {/* Gradient Header */}
      <div 
        className="relative border-b backdrop-blur-md"
        style={{
          background: 'linear-gradient(135deg, #047857 0%, #10B981 40%, #059669 100%)',
          borderColor: 'rgba(245, 158, 11, 0.2)',
          borderBottomWidth: '2px',
        }}
      >
        <div 
          className="absolute top-0 right-0 w-96 h-96 opacity-10 mix-blend-screen pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #F59E0B, transparent)',
            filter: 'blur(40px)',
          }}
        />
        <div className="max-w-7xl mx-auto px-8 py-10 relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">
                Welcome back, Receptionist
              </h1>
              <p className="text-green-50 flex items-center gap-2">
                <Clock size={16} />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="/receptionist/appointments/create"
                className="px-7 py-3 rounded-xl font-semibold transition-all hover:shadow-lg"
                style={{ 
                  backgroundColor: '#F9D5A1',
                  color: '#065F46',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                + New Appointment
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          {stats ? (
            [
              { label: "Today's Appointments", value: stats.todayAppointmentsCount || 0, icon: Calendar, color: '#10B981', bgColor: '#E8F8F5' },
              { label: 'Total Patients', value: stats.totalPatientsCount || 0, icon: Users, color: '#059669', bgColor: '#E8F8F5' },
              { label: 'Scheduled Appointments', value: stats.scheduledAppointmentsCount || 0, icon: Clock, color: '#F59E0B', bgColor: '#FEF3C7' },
              { label: 'Completed Today', value: stats.completedTodayCount || 0, icon: CheckCircle2, color: '#10B981', bgColor: '#D1FAE5' },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl transition-all hover:shadow-xl"
                  style={{
                    backgroundColor: stat.bgColor,
                    border: `1.5px solid rgba(16, 185, 129, 0.15)`,
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p style={{ color: '#10B981' }} className="text-sm font-semibold">
                        {stat.label}
                      </p>
                      <p className="text-4xl font-bold mt-3" style={{ color: '#065F46' }}>
                        {stat.value}
                      </p>
                    </div>
                    <Icon size={24} color={stat.color} />
                  </div>
                </div>
              );
            })
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Appointments Section */}
          <div className="col-span-2">
            <div
              className="p-8 rounded-2xl"
              style={{
                backgroundColor: '#F0FDF4',
                border: '1.5px solid rgba(16, 185, 129, 0.15)',
              }}
            >
              <div className="flex justify-between items-center mb-7">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: '#065F46' }}>
                    Today's Schedule
                  </h2>
                  <p style={{ color: '#D97706' }} className="text-sm mt-1">
                    {appointments?.length || 0} appointments
                  </p>
                </div>
                <a
                  href="/receptionist/appointments"
                  className="text-sm font-semibold flex items-center gap-1 px-4 py-2 rounded-lg"
                  style={{ color: '#10B981', backgroundColor: 'rgba(245, 158, 11, 0.1)', textDecoration: 'none' }}
                >
                  View all <ArrowRight size={16} />
                </a>
              </div>

              {/* Appointment List */}
              <div className="space-y-3">
                {appointments && appointments.length > 0 ? (
                  appointments.map((apt, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border"
                      style={{
                        borderColor: 'rgba(16, 185, 129, 0.15)',
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold" style={{ color: '#065F46' }}>
                            {apt.patient_first_name || 'N/A'} {apt.patient_last_name || 'N/A'}
                          </p>
                          <p style={{ color: '#10B981' }} className="text-sm">
                            {apt.appointment_time || 'N/A'} • Dr. {apt.doctor_last_name || 'N/A'}
                          </p>
                        </div>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{ 
                            backgroundColor: '#10B981',
                            color: '#FFFFFF'
                          }}
                        >
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#10B981' }}>No appointments today</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div
            className="p-7 rounded-2xl"
            style={{
              backgroundColor: '#E8F8F5',
              border: '1.5px solid rgba(16, 185, 129, 0.15)',
            }}
          >
            <h3 className="text-lg font-bold mb-5" style={{ color: '#065F46' }}>
              Quick Actions
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Register Patient', href: '/receptionist/patients/register' },
                { label: 'New Appointment', href: '/receptionist/appointments/create' },
                { label: 'View Patients', href: '/receptionist/patients' },
                { label: 'View Appointments', href: '/receptionist/appointments' },
              ].map((action, idx) => (
                <a
                  key={idx}
                  href={action.href}
                  className="w-full p-3 rounded-lg flex items-center gap-2"
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid',
                    textDecoration: 'none',
                    color: '#065F46',
                    fontWeight: '500',
                  }}
                >
                  {action.label}
                  <ArrowRight size={14} style={{ marginLeft: 'auto' }} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
