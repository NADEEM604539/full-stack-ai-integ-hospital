'use client';

import { useState, useEffect } from 'react';
import {
  Users, Calendar, Clock, CheckCircle2, AlertCircle, Loader,
  TrendingUp, Activity, Zap, Award, ChevronRight, BookOpen, Star
} from 'lucide-react';
import Link from 'next/link';

export default function DoctorDashboardClient() {
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [insights, setInsights] = useState(null);
  const [satisfactionRating, setSatisfactionRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, appointmentsRes, insightsRes, satisfactionRes] = await Promise.all([
        fetch('/api/doctor/dashboard'),
        fetch('/api/doctor/appointments'),
        fetch('/api/doctor/insights'),
        fetch('/api/doctor/satisfaction-rating')
      ]);

      if (!statsRes.ok || !appointmentsRes.ok || !insightsRes.ok) {
        throw new Error(`Failed: Dashboard ${statsRes.status}, Appointments ${appointmentsRes.status}, Insights ${insightsRes.status}`);
      }

      const statsData = await statsRes.json();
      const appointmentsData = await appointmentsRes.json();
      const insightsData = await insightsRes.json();
      const satisfactionData = satisfactionRes.ok ? await satisfactionRes.json() : null;

      console.log('Satisfaction Rating Data:', satisfactionData);

      setStats(statsData.stats);
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = (appointmentsData.data || [])
        .filter(apt => apt.appointment_date?.startsWith(today))
        .sort((a, b) => a.appointment_time?.localeCompare(b.appointment_time))
        .slice(0, 5);
      setAppointments(todayAppointments);
      setInsights(insightsData.insights);
      
      // Set satisfaction rating with proper data
      if (satisfactionData?.success && satisfactionData?.data) {
        console.log('Setting satisfaction rating:', satisfactionData.data);
        setSatisfactionRating(satisfactionData.data);
      } else {
        console.log('No satisfaction data:', satisfactionData);
        setSatisfactionRating(null);
      }
    } catch (err) {
      console.error('Dashboard Error:', err);
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

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF' }} className="min-h-screen p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} color="#10B981" className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF' }} className="min-h-screen p-6 lg:p-8">
      {/* Welcome Banner */}
      <div
        className="rounded-2xl p-6 lg:p-8 mb-8"
        style={{
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          color: '#FFFFFF',
        }}
      >
        <h1 className="text-4xl lg:text-5xl font-bold mb-2">{getTimeGreeting()}</h1>
        <p className="text-lg opacity-90 font-medium">Dr. {stats?.doctor_name || 'Doctor'}</p>
        <p className="text-sm opacity-80 mt-2">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 rounded-xl flex gap-3 border-l-4" style={{ backgroundColor: '#FFD9E8', borderColor: '#F59E0B' }}>
          <AlertCircle size={20} color="#D97706" />
          <div>
            <p className="font-bold" style={{ color: '#065F46' }}>Notice</p>
            <p style={{ color: '#065F46' }} className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Key Performance Indicators - 4 Cards */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6" style={{ color: '#065F46' }}>Key Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Green */}
          <div
            className="p-6 rounded-2xl border-2 transition-all hover:shadow-lg hover:scale-105"
            style={{
              backgroundColor: '#E8F8F5',
              borderColor: 'rgba(16, 185, 129, 0.3)',
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p style={{ color: '#10B981' }} className="text-sm font-semibold">Today's Appointments</p>
                <p className="text-3xl lg:text-4xl font-bold mt-2" style={{ color: '#065F46' }}>
                  {stats?.todays_appointments || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                <Calendar size={28} color="#10B981" />
              </div>
            </div>
            <p className="text-xs" style={{ color: '#059669' }}>↑ +2 from yesterday</p>
          </div>

          {/* Card 2: Pink */}
          <div
            className="p-6 rounded-2xl border-2 transition-all hover:shadow-lg hover:scale-105"
            style={{
              backgroundColor: '#FFE4F5',
              borderColor: 'rgba(236, 72, 153, 0.2)',
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p style={{ color: '#EC4899' }} className="text-sm font-semibold">Completed Today</p>
                <p className="text-3xl lg:text-4xl font-bold mt-2" style={{ color: '#065F46' }}>
                  {stats?.completed_today || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)' }}>
                <CheckCircle2 size={28} color="#EC4899" />
              </div>
            </div>
            <p className="text-xs" style={{ color: '#059669' }}>
              {stats?.todays_appointments > 0 ? `${Math.round((stats?.completed_today / stats?.todays_appointments) * 100)}% completion` : 'No appointments'}
            </p>
          </div>

          {/* Card 3: Dark Pink */}
          <div
            className="p-6 rounded-2xl border-2 transition-all hover:shadow-lg hover:scale-105"
            style={{
              backgroundColor: '#FFD9E8',
              borderColor: 'rgba(245, 158, 11, 0.3)',
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p style={{ color: '#F59E0B' }} className="text-sm font-semibold">Total Patients</p>
                <p className="text-3xl lg:text-4xl font-bold mt-2" style={{ color: '#065F46' }}>
                  {stats?.total_patients || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
                <Users size={28} color="#F59E0B" />
              </div>
            </div>
            <p className="text-xs" style={{ color: '#059669' }}>Active in system</p>
          </div>

          {/* Card 4: Peach */}
          <div
            className="p-6 rounded-2xl border-2 transition-all hover:shadow-lg hover:scale-105"
            style={{
              backgroundColor: '#FFE4D6',
              borderColor: 'rgba(239, 68, 68, 0.2)',
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p style={{ color: '#EF4444' }} className="text-sm font-semibold">Pending Actions</p>
                <p className="text-3xl lg:text-4xl font-bold mt-2" style={{ color: '#065F46' }}>
                  {stats?.pending || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                <Zap size={28} color="#EF4444" />
              </div>
            </div>
            <p className="text-xs" style={{ color: '#059669' }}>
              {stats?.pending === 0 ? '✓ All clear' : 'Needs attention'}
            </p>
          </div>
        </div>
      </div>

      {/* Content Grid: Schedule + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Today's Schedule */}
        <div
          className="lg:col-span-2 p-6 rounded-2xl border-2"
          style={{
            backgroundColor: '#F0FDF4',
            borderColor: 'rgba(16, 185, 129, 0.2)',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold" style={{ color: '#065F46' }}>Today's Schedule</h3>
            <Link href="/doctor/appointments">
              <ChevronRight size={24} color="#10B981" className="cursor-pointer hover:scale-110" />
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={40} color="#D1D5DB" className="mx-auto mb-3" />
              <p style={{ color: '#6B7280' }}>No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {appointments.map((apt, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border-l-4 transition-all hover:shadow-lg"
                  style={{
                    backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#E8F8F5',
                    borderColor: '#10B981',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold" style={{ color: '#065F46' }}>
                        {apt.patient_first_name} {apt.patient_last_name}
                      </p>
                      <p className="text-sm" style={{ color: '#10B981' }}>
                        {apt.appointment_time} • {apt.mrn}
                      </p>
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: '#10B981' }}
                    >
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div
          className="p-6 rounded-2xl border-2"
          style={{
            backgroundColor: '#FFE4F5',
            borderColor: 'rgba(236, 72, 153, 0.2)',
          }}
        >
          <h3 className="text-xl font-bold mb-4" style={{ color: '#065F46' }}>Quick Actions</h3>
          <div className="space-y-3">
            {[
              { href: '/doctor/appointments', label: 'Appointments', icon: Calendar },
              { href: '/doctor/patients', label: 'Patients', icon: Users },
              { href: '/doctor/encounters', label: 'Encounters', icon: BookOpen },
              { href: '/doctor/schedule', label: 'Schedule', icon: Clock },
              { href: '/doctor/colleagues', label: 'Colleagues', icon: Award },
            ].map((action, idx) => {
              const Icon = action.icon;
              return (
                <Link key={idx} href={action.href}>
                  <div
                    className="p-3 rounded-lg cursor-pointer transition-all hover:shadow-md hover:scale-105"
                    style={{
                      backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FFD9E8',
                      border: '1px solid rgba(236, 72, 153, 0.1)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={20} color="#10B981" />
                      <p className="font-semibold text-sm" style={{ color: '#065F46' }}>
                        {action.label}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Stats: Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Satisfaction Rating */}
        <div
          className="p-6 rounded-2xl border-2"
          style={{
            backgroundColor: '#FEF3C7',
            borderColor: 'rgba(251, 191, 36, 0.3)',
          }}
        >
          <h3 className="text-xl font-bold mb-4" style={{ color: '#065F46' }}>Patient Satisfaction</h3>
          {satisfactionRating && satisfactionRating.avg_rating !== null && satisfactionRating.avg_rating !== undefined ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="flex justify-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={32}
                      fill={i <= parseFloat(satisfactionRating.avg_rating) ? '#FBBF24' : '#E5E7EB'}
                      color={i <= parseFloat(satisfactionRating.avg_rating) ? '#FBBF24' : '#D1D5DB'}
                    />
                  ))}
                </div>
                <p className="text-4xl font-bold" style={{ color: '#D97706' }}>
                  {satisfactionRating.avg_rating}
                </p>
                <p style={{ color: '#065F46' }} className="mt-2">
                  Based on {satisfactionRating.total_ratings} ratings
                </p>
              </div>
              <div className="pt-4 border-t border-yellow-300 space-y-2">
                <p style={{ color: '#6B7280' }} className="text-sm">Rating Breakdown:</p>
                {satisfactionRating.rating_breakdown && Object.entries(satisfactionRating.rating_breakdown).map(([rating, count]) => (
                  <div key={rating} className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i <= parseInt(rating) ? '#FBBF24' : '#E5E7EB'}
                          color={i <= parseInt(rating) ? '#FBBF24' : '#D1D5DB'}
                        />
                      ))}
                    </div>
                    <span style={{ color: '#065F46' }} className="text-sm font-medium">
                      {count} {count === 1 ? 'rating' : 'ratings'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Star size={40} color="#D1D5DB" className="mx-auto mb-3" />
              <p style={{ color: '#6B7280' }} className="text-lg font-medium">
                No ratings yet
              </p>
              <p style={{ color: '#9CA3AF' }} className="text-sm mt-2">
                Patient ratings will appear here once appointments are completed
              </p>
            </div>
          )}
        </div>

        {/* Clinical Insights */}
        <div
          className="p-6 rounded-2xl border-2"
          style={{
            backgroundColor: '#F0FDF4',
            borderColor: 'rgba(16, 185, 129, 0.2)',
          }}
        >
          <h3 className="text-xl font-bold mb-4" style={{ color: '#065F46' }}>Clinical Insights</h3>
          <div className="space-y-3">
            {insights ? (
              [
                { label: 'Consultation Rate', value: insights.consultation_rate, color: '#10B981' },
                { label: 'Follow-up Rate', value: insights.follow_up_rate, color: '#10B981' },
              ].map((insight, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#E8F8F5' }}>
                  <div className="flex items-center gap-2">
                    {idx === 1 ? <TrendingUp size={18} color={insight.color} /> : <Activity size={18} color={insight.color} />}
                    <p style={{ color: '#065F46', fontWeight: '600' }}>{insight.label}</p>
                  </div>
                  <p className="font-bold text-lg" style={{ color: insight.color }}>
                    {insight.value}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ color: '#6B7280' }}>Loading insights...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
