'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Stethoscope, Phone, FileText, Bell, Settings, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ReceptionistDashboard() {
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const response = await fetch('/api/receptionist/dashboard');
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const result = await response.json();
        if (result.success) {
          setStats(result.data.stats);
          setAppointments(result.data.appointments);
        } else {
          setError(result.error || 'Failed to load dashboard data');
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8">
        <div className="space-y-6">
          <div className="h-40 bg-gray-200 rounded-xl animate-pulse" />
          <div className="grid grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

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
                Welcome back, Sarah
              </h1>
              <p className="text-green-50 flex items-center gap-2">
                <Clock size={16} />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} • {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="/receptionist/appointments/book"
                className="px-7 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:scale-105"
                style={{ 
                  backgroundColor: '#F9D5A1',
                  color: '#065F46',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                + New Appointment
              </a>
              <button
                className="p-3 rounded-xl transition-all hover:shadow-lg"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                }}
              >
                <Settings size={20} />
              </button>
              <button
                className="p-3 rounded-xl transition-all hover:shadow-lg relative"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                }}
              >
                <Bell size={20} />
                <span 
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold text-white"
                  style={{ backgroundColor: '#F9D5A1', color: '#065F46' }}
                >
                  3
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Quick Stats - Live Data */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          {stats ? (
            [
              { label: "Today's Appointments", value: stats.todayAppointmentsCount || 0, icon: Calendar, color: '#10B981', bgColor: '#E8F8F5' },
              { label: 'Total Active Patients', value: stats.totalPatientsCount || 0, icon: Users, color: '#059669', bgColor: '#FFE4F5' },
              { label: 'Scheduled Appointments', value: stats.scheduledAppointmentsCount || 0, icon: Clock, color: '#F59E0B', bgColor: '#FFD9E8' },
              { label: 'Completed Today', value: stats.completedTodayCount || 0, icon: CheckCircle2, color: '#10B981', bgColor: '#FFE4D6' },
            ].map((stat, idx) => {
              const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl transition-all hover:shadow-xl hover:scale-105 relative overflow-hidden group"
                style={{
                  backgroundColor: stat.bgColor,
                  border: `1.5px solid rgba(16, 185, 129, 0.15)`,
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.08)',
                }}
              >
                <div 
                  className="absolute top-0 right-0 w-32 h-32 opacity-5 mix-blend-multiply rounded-full"
                  style={{
                    backgroundColor: '#F59E0B',
                    filter: 'blur(20px)',
                  }}
                />
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p style={{ color: '#10B981' }} className="text-sm font-semibold tracking-wide">
                      {stat.label}
                    </p>
                    <p className="text-4xl font-bold mt-3" style={{ color: '#065F46' }}>
                      {stat.value}
                    </p>
                  </div>
                  <div 
                    className="p-3 rounded-xl border"
                    style={{ 
                      backgroundColor: `${stat.color}15`,
                      borderColor: `${stat.color}30`,
                    }}
                  >
                    <Icon size={24} color={stat.color} />
                  </div>
                </div>
              </div>
            );
          })
          ) : (
            [1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className="h-32 bg-gray-200 rounded-2xl animate-pulse"
                style={{ backgroundColor: '#E5E7EB' }}
              />
            ))
          )}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Appointments Section */}
          <div className="col-span-2">
            <div
              className="p-8 rounded-2xl relative overflow-hidden"
              style={{
                backgroundColor: '#F0FDF4',
                border: '1.5px solid rgba(16, 185, 129, 0.15)',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.08)',
              }}
            >
              <div 
                className="absolute top-0 right-0 w-40 h-40 opacity-5 rounded-full"
                style={{
                  backgroundColor: '#F59E0B',
                  filter: 'blur(30px)',
                }}
              />
              <div className="flex justify-between items-center mb-7 relative z-10">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: '#065F46' }}>
                    Today's Schedule
                  </h2>
                  <p style={{ color: '#D97706' }} className="text-sm mt-1 font-semibold">
                    {stats?.todayAppointmentsCount || 0} appointments scheduled
                  </p>
                </div>
                <a
                  href="/receptionist/appointments"
                  className="text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all px-4 py-2 rounded-lg"
                  style={{ color: '#10B981', backgroundColor: 'rgba(245, 158, 11, 0.1)', textDecoration: 'none' }}
                >
                  View all <ArrowRight size={16} />
                </a>
              </div>

              {/* Appointment List */}
              <div className="space-y-3 relative z-10">
                {appointments && appointments.length > 0 ? (
                  appointments.map((apt, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-xl border transition-all hover:shadow-lg group cursor-pointer"
                      style={{
                        borderColor: apt.status === 'Waiting' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.15)',
                        backgroundColor: apt.status === 'Waiting' ? '#FFD9E8' : '#FFFFFF',
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: apt.status === 'Waiting' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                            }}
                          >
                            <Clock size={20} color={apt.status === 'Waiting' ? '#F59E0B' : '#10B981'} />
                          </div>
                          <div>
                            <p className="font-bold" style={{ color: '#065F46' }}>
                              {apt.patient_first_name} {apt.patient_last_name}
                            </p>
                            <p style={{ color: apt.status === 'Waiting' ? '#D97706' : '#10B981' }} className="text-sm">
                              {apt.appointment_time} • Dr. {apt.doctor_last_name}
                            </p>
                          </div>
                        </div>
                        <span
                          className="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ml-4"
                          style={{ 
                            backgroundColor: apt.status === 'Scheduled' ? '#10B981' : apt.status === 'Completed' ? '#059669' : '#F59E0B',
                            color: '#FFFFFF'
                          }}
                        >
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center" style={{ color: '#10B981' }}>
                    <p className="font-semibold">No appointments scheduled for today</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div
              className="p-7 rounded-2xl relative overflow-hidden"
              style={{
                backgroundColor: '#FFE4F5',
                border: '1.5px solid rgba(245, 158, 11, 0.15)',
                boxShadow: '0 4px 20px rgba(245, 158, 11, 0.08)',
              }}
            >
              <div 
                className="absolute top-0 right-0 w-32 h-32 opacity-5 rounded-full"
                style={{
                  backgroundColor: '#F59E0B',
                  filter: 'blur(20px)',
                }}
              />
              <h3 className="text-lg font-bold mb-5 relative z-10" style={{ color: '#065F46' }}>
                Quick Actions
              </h3>
              <div className="space-y-3 relative z-10">
                {[
                  { label: 'Register Patient', icon: Users, color: '#10B981', bgBtn: '#FFFFFF', href: '/receptionist/patients/register' },
                  { label: 'Schedule Visit', icon: Calendar, color: '#F59E0B', bgBtn: '#FFD9E8', href: '/receptionist/appointments/book' },
                  { label: 'View Patients', icon: Users, color: '#059669', bgBtn: '#FFFFFF', href: '/receptionist/patients' },
                  { label: 'View Documents', icon: FileText, color: '#F59E0B', bgBtn: '#FFE4D6', href: '#' },
                ].map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <a
                      key={idx}
                      href={action.href}
                      className="w-full p-4 rounded-xl flex items-center gap-3 transition-all hover:shadow-md border group"
                      style={{
                        backgroundColor: action.bgBtn,
                        borderColor: action.bgBtn === '#FFFFFF' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        textDecoration: 'none',
                      }}
                    >
                      <div
                        className="p-2 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: `${action.color}15` }}
                      >
                        <Icon size={18} color={action.color} />
                      </div>
                      <span style={{ color: '#065F46' }} className="font-medium text-sm">
                        {action.label}
                      </span>
                      <ArrowRight size={14} color={action.color} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Alert Card - Premium with Pink & Gold */}
            <div
              className="p-6 rounded-2xl border-l-4 relative overflow-hidden"
              style={{ 
                backgroundColor: '#FFD9E8',
                borderColor: '#F59E0B',
                borderLeftWidth: '4px',
              }}
            >
              <div 
                className="absolute top-0 right-0 w-24 h-24 opacity-10 rounded-full"
                style={{
                  backgroundColor: '#F59E0B',
                  filter: 'blur(15px)',
                }}
              />
              <div className="flex gap-3 relative z-10">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#F9D5A115' }}
                >
                  <Bell size={18} color="#D97706" />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: '#065F46' }}>
                    System Status
                  </p>
                  <p style={{ color: '#D97706' }} className="text-sm mt-1">
                    All systems operational and ready
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
