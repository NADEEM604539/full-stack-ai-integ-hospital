'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3, Users, Clock, CheckCircle2, AlertCircle, Loader,
  Calendar, TrendingUp, Phone, Mail, Activity, Zap, Award,
  ChevronRight, Heart, Stethoscope, BookOpen, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import Link from 'next/link';

export default function DoctorDashboardClient() {
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, appointmentsRes] = await Promise.all([
        fetch('/api/doctor/dashboard'),
        fetch('/api/doctor/appointments')
      ]);

      if (!statsRes.ok || !appointmentsRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const statsData = await statsRes.json();
      const appointmentsData = await appointmentsRes.json();

      setStats(statsData.stats);
      // Get today's appointments
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = (appointmentsData.data || [])
        .filter(apt => apt.appointment_date.startsWith(today))
        .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
        .slice(0, 5);
      setAppointments(todayAppointments);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Good Morning';
    if (hour < 18) return '☀️ Good Afternoon';
    return '🌙 Good Evening';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled':
        return { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF', icon: '📅' };
      case 'Completed':
        return { bg: '#D1FAE5', border: '#10B981', text: '#065F46', icon: '✅' };
      case 'Cancelled':
        return { bg: '#FEE2E2', border: '#EF4444', text: '#7F1D1D', icon: '❌' };
      case 'No Show':
        return { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E', icon: '⚠️' };
      default:
        return { bg: '#F3F4F6', border: '#6B7280', text: '#374151', icon: '📌' };
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} color="#3B82F6" className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#F3F4F6', minHeight: '100vh' }} className="p-8">
      {/* Welcome Banner */}
      <div
        className="rounded-3xl p-8 mb-8 text-white shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold mb-2">{getTimeGreeting()}</h1>
            <p className="text-xl opacity-90">Dr. {stats?.doctor_name}</p>
            <p className="text-sm opacity-75 mt-2">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <Stethoscope size={80} className="opacity-20" />
        </div>
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

      {/* Key Performance Indicators */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4" style={{ color: '#1E40AF' }}>Key Performance Indicators</h2>
        <div className="grid grid-cols-4 gap-6">
          {/* Today's Appointments */}
          <div className="p-6 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p style={{ color: '#6B7280' }} className="text-sm font-semibold">Today's Appointments</p>
                <p className="text-4xl font-bold mt-2" style={{ color: '#3B82F6' }}>
                  {stats?.todays_appointments || 0}
                </p>
              </div>
              <Calendar size={40} color="#3B82F6" className="opacity-20" />
            </div>
            <div className="flex items-center gap-1 text-sm">
              <ArrowUpRight size={16} color="#10B981" />
              <span style={{ color: '#10B981', fontWeight: '600' }}>+2 from yesterday</span>
            </div>
          </div>

          {/* Completed Appointments */}
          <div className="p-6 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p style={{ color: '#6B7280' }} className="text-sm font-semibold">Completed Today</p>
                <p className="text-4xl font-bold mt-2" style={{ color: '#10B981' }}>
                  {stats?.completed_today || 0}
                </p>
              </div>
              <CheckCircle2 size={40} color="#10B981" className="opacity-20" />
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span style={{ color: '#6B7280' }}>
                {stats?.todays_appointments > 0
                  ? `${Math.round((stats?.completed_today / stats?.todays_appointments) * 100)}% completion`
                  : 'No appointments'
                }
              </span>
            </div>
          </div>

          {/* Total Patients */}
          <div className="p-6 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p style={{ color: '#6B7280' }} className="text-sm font-semibold">Total Patients</p>
                <p className="text-4xl font-bold mt-2" style={{ color: '#F59E0B' }}>
                  {stats?.total_patients || 0}
                </p>
              </div>
              <Users size={40} color="#F59E0B" className="opacity-20" />
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Heart size={16} color="#EC4899" />
              <span style={{ color: '#6B7280' }}>Active patients</span>
            </div>
          </div>

          {/* Pending Appointments */}
          <div className="p-6 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p style={{ color: '#6B7280' }} className="text-sm font-semibold">Pending Actions</p>
                <p className="text-4xl font-bold mt-2" style={{ color: stats?.pending === 0 ? '#10B981' : '#EF4444' }}>
                  {stats?.pending || 0}
                </p>
              </div>
              <Zap size={40} color="#EF4444" className="opacity-20" />
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span style={{ color: stats?.pending === 0 ? '#10B981' : '#EF4444', fontWeight: '600' }}>
                {stats?.pending === 0 ? '✓ All clear' : `${stats?.pending} need attention`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Today's Schedule */}
        <div className="col-span-2 p-6 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: '#1E40AF' }}>Today's Schedule</h2>
            <Link href="/doctor/appointments">
              <ChevronRight size={24} color="#3B82F6" className="cursor-pointer hover:scale-110 transition-transform" />
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={48} color="#D1D5DB" className="mx-auto mb-3" />
              <p style={{ color: '#9CA3AF' }}>No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt, idx) => {
                const colors = getStatusColor(apt.status);
                const endTime = (() => {
                  const [h, m] = apt.appointment_time.split(':').map(Number);
                  const totalMin = h * 60 + m + (apt.duration_minutes || 30);
                  const endH = Math.floor(totalMin / 60);
                  const endM = totalMin % 60;
                  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
                })();

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border-l-4 transition-all hover:shadow-md"
                    style={{
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock size={18} color={colors.border} />
                          <span className="font-bold" style={{ color: colors.text }}>
                            {apt.appointment_time} - {endTime}
                          </span>
                        </div>
                        <p style={{ color: colors.text }} className="font-semibold">
                          {apt.patient_first_name} {apt.patient_last_name}
                        </p>
                        <p style={{ color: colors.text }} className="text-xs opacity-80">
                          MRN: {apt.mrn}
                        </p>
                      </div>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{ backgroundColor: colors.border, color: 'white' }}
                      >
                        {apt.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="p-6 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#1E40AF' }}>Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/doctor/appointments">
              <div
                className="p-4 rounded-xl cursor-pointer transition-all hover:shadow-lg"
                style={{ backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE' }}
              >
                <div className="flex items-center gap-3">
                  <Calendar size={24} color="#3B82F6" />
                  <div>
                    <p className="font-semibold" style={{ color: '#1E40AF' }}>Appointments</p>
                    <p style={{ color: '#6B7280' }} className="text-xs">View all</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/doctor/patients">
              <div
                className="p-4 rounded-xl cursor-pointer transition-all hover:shadow-lg"
                style={{ backgroundColor: '#E8F8F5', border: '1px solid #D1FAE5' }}
              >
                <div className="flex items-center gap-3">
                  <Users size={24} color="#10B981" />
                  <div>
                    <p className="font-semibold" style={{ color: '#065F46' }}>Patients</p>
                    <p style={{ color: '#6B7280' }} className="text-xs">My patient list</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/doctor/encounters">
              <div
                className="p-4 rounded-xl cursor-pointer transition-all hover:shadow-lg"
                style={{ backgroundColor: '#FEF3C7', border: '1px solid #FECF01' }}
              >
                <div className="flex items-center gap-3">
                  <BookOpen size={24} color="#F59E0B" />
                  <div>
                    <p className="font-semibold" style={{ color: '#92400E' }}>Encounters</p>
                    <p style={{ color: '#6B7280' }} className="text-xs">Patient records</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/doctor/schedule">
              <div
                className="p-4 rounded-xl cursor-pointer transition-all hover:shadow-lg"
                style={{ backgroundColor: '#F3E8FF', border: '1px solid #E9D5FF' }}
              >
                <div className="flex items-center gap-3">
                  <Clock size={24} color="#A855F7" />
                  <div>
                    <p className="font-semibold" style={{ color: '#6B21A8' }}>Schedule</p>
                    <p style={{ color: '#6B7280' }} className="text-xs">Work hours</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/doctor/colleagues">
              <div
                className="p-4 rounded-xl cursor-pointer transition-all hover:shadow-lg"
                style={{ backgroundColor: '#FCE7F3', border: '1px solid #FBCFE8' }}
              >
                <div className="flex items-center gap-3">
                  <Award size={24} color="#EC4899" />
                  <div>
                    <p className="font-semibold" style={{ color: '#831843' }}>Colleagues</p>
                    <p style={{ color: '#6B7280' }} className="text-xs">Team directory</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics and Insights */}
      <div className="grid grid-cols-2 gap-6">
        {/* Clinical Insights */}
        <div className="p-6 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#1E40AF' }}>Clinical Insights</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#F0FDF4' }}>
              <div className="flex items-center gap-3">
                <Activity size={20} color="#10B981" />
                <span style={{ color: '#065F46', fontWeight: '600' }}>Consultation Rate</span>
              </div>
              <span style={{ color: '#10B981', fontWeight: '700' }}>92%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#FEF3C7' }}>
              <div className="flex items-center gap-3">
                <TrendingUp size={20} color="#F59E0B" />
                <span style={{ color: '#92400E', fontWeight: '600' }}>Patient Satisfaction</span>
              </div>
              <span style={{ color: '#F59E0B', fontWeight: '700' }}>4.8/5</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#DBEAFE' }}>
              <div className="flex items-center gap-3">
                <Heart size={20} color="#3B82F6" />
                <span style={{ color: '#1E40AF', fontWeight: '600' }}>Follow-up Rate</span>
              </div>
              <span style={{ color: '#3B82F6', fontWeight: '700' }}>87%</span>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="p-6 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#1E40AF' }}>Upcoming Events</h2>
          <div className="space-y-3">
            <div className="p-3 rounded-lg border-l-4" style={{ backgroundColor: '#EFF6FF', borderColor: '#3B82F6' }}>
              <p style={{ color: '#1E40AF', fontWeight: '600' }}>Department Meeting</p>
              <p style={{ color: '#6B7280' }} className="text-xs mt-1">Tomorrow at 2:00 PM</p>
            </div>
            <div className="p-3 rounded-lg border-l-4" style={{ backgroundColor: '#E8F8F5', borderColor: '#10B981' }}>
              <p style={{ color: '#065F46', fontWeight: '600' }}>Grand Rounds</p>
              <p style={{ color: '#6B7280' }} className="text-xs mt-1">Friday at 10:00 AM</p>
            </div>
            <div className="p-3 rounded-lg border-l-4" style={{ backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }}>
              <p style={{ color: '#92400E', fontWeight: '600' }}>Continuing Education</p>
              <p style={{ color: '#6B7280' }} className="text-xs mt-1">Next week, 3 hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
