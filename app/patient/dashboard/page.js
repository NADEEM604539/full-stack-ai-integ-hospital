'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import {
  Plus,
  Heart,
  Phone,
  Mail,
  Calendar,
  Users,
  Activity,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Stethoscope,
  Clock,
  LogOut,
} from 'lucide-react';

const PatientDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch patients
      const patientsRes = await fetch('/api/patient/my-patients');
      if (!patientsRes.ok) {
        throw new Error('Failed to fetch patients');
      }
      const patientsData = await patientsRes.json();
      setPatients(patientsData.data || []);

      // Fetch dashboard stats
      const statsRes = await fetch('/api/patient/dashboard/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRelationshipLabel = (patientId, userId) => {
    return patients[0]?.patient_id === patientId ? 'You' : 'Family Member';
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF' }} className="min-h-screen">
      {/* Modern Header with Gradient Background */}
      <div
        className="shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">
                Health Dashboard
              </h1>
              <p className="text-emerald-100 text-lg font-medium">
                Manage your medical profiles and health records
              </p>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="/patient/register"
                className="flex items-center gap-2 text-white px-8 py-4 rounded-full font-semibold transition-all hover:shadow-2xl"
                style={{
                  backgroundColor: '#FFD9E8',
                  color: '#065F46',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Plus size={22} />
                Add New Patient
              </Link>
              {/* User Button */}
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }} className="rounded-full p-2">
                <UserButton
                  afterSignOutUrl="/sign-in"
                  appearance={{
                    elements: {
                      userButtonAvatarBox: {
                        width: '48px',
                        height: '48px',
                      },
                      userButtonTrigger: {
                        padding: '4px',
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: '#FFD9E8',
              borderLeft: '5px solid #F59E0B',
            }}
            className="rounded-lg p-5 mb-8 flex items-start gap-4"
          >
            <Activity size={24} style={{ color: '#D97706' }} className="flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold" style={{ color: '#065F46' }}>
                Error
              </h3>
              <p style={{ color: '#065F46' }} className="text-sm">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {!loading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            {/* Card 1: Total Patients */}
            <StatCard
              icon={<Users size={28} />}
              title="Your Profiles"
              value={stats.totalPatients}
              bgColor="#E8F8F5"
              iconColor="#10B981"
              borderColor="#10B981"
              description="Patient profiles"
            />

            {/* Card 2: Total Appointments */}
            <StatCard
              icon={<Calendar size={28} />}
              title="Total Appointments"
              value={stats.totalAppointments}
              bgColor="#FFE4F5"
              iconColor="#059669"
              borderColor="#F59E0B"
              description="All time"
            />

            {/* Card 3: Upcoming Appointments */}
            <StatCard
              icon={<Clock size={28} />}
              title="Upcoming"
              value={stats.upcomingAppointments}
              bgColor="#FFD9E8"
              iconColor="#F59E0B"
              borderColor="#059669"
              description="Next appointments"
            />

            {/* Card 4: Total Encounters */}
            <StatCard
              icon={<Stethoscope size={28} />}
              title="Medical Visits"
              value={stats.totalEncounters}
              bgColor="#FFE4D6"
              iconColor="#10B981"
              borderColor="#10B981"
              description="Total encounters"
            />

            {/* Card 5: Profile Completion */}
            <StatCard
              icon={<CheckCircle size={28} />}
              title="Profile Complete"
              value={`${stats.profileCompletion}%`}
              bgColor="#E8F8F5"
              iconColor="#059669"
              borderColor="#059669"
              description="Data filled"
            />
          </div>
        )}

        {/* Loading State for Stats */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{ backgroundColor: '#F0F9FF' }}
                className="rounded-xl p-6 h-40 animate-pulse"
              >
                <div
                  style={{ backgroundColor: '#E0E7FF' }}
                  className="h-10 w-10 rounded mb-4"
                ></div>
                <div style={{ backgroundColor: '#E0E7FF' }} className="h-4 w-24 mb-2"></div>
                <div style={{ backgroundColor: '#E0E7FF' }} className="h-6 w-16"></div>
              </div>
            ))}
          </div>
        )}

        {/* Section Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold" style={{ color: '#065F46' }}>
            Your Medical Profiles
          </h2>
          <p style={{ color: '#10B981' }} className="mt-2 font-medium">
            {patients.length} profile{patients.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* Empty State */}
        {patients.length === 0 && !loading && (
          <div
            style={{
              backgroundColor: '#E8F8F5',
              border: '2px solid #10B981',
            }}
            className="rounded-2xl shadow-md p-16 text-center"
          >
            <Heart
              size={64}
              style={{ color: '#10B981' }}
              className="mx-auto mb-6"
            />
            <h3 className="text-2xl font-bold" style={{ color: '#065F46' }}>
              No Medical Profiles Yet
            </h3>
            <p style={{ color: '#10B981' }} className="mt-3 text-lg mb-8">
              Start by creating your first medical profile to manage your health records
            </p>
            <Link
              href="/patient/register"
              className="inline-flex items-center gap-3 text-white px-8 py-4 rounded-full font-semibold transition-all hover:shadow-xl"
              style={{
                backgroundColor: '#10B981',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#059669';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#10B981';
              }}
            >
              <Plus size={22} />
              Create First Profile
            </Link>
          </div>
        )}

        {/* Patient Cards Grid */}
        {patients.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {patients.map((patient, idx) => {
              const cardColors = [
                {
                  bg: '#FFFFFF',
                  border: '#10B981',
                  light: '#E8F8F5',
                  accent: '#10B981',
                },
                {
                  bg: '#FFFFFF',
                  border: '#F59E0B',
                  light: '#FFE4F5',
                  accent: '#059669',
                },
                {
                  bg: '#FFFFFF',
                  border: '#059669',
                  light: '#FFD9E8',
                  accent: '#F59E0B',
                },
                {
                  bg: '#FFFFFF',
                  border: '#10B981',
                  light: '#FFE4D6',
                  accent: '#10B981',
                },
              ];
              const colors = cardColors[idx % cardColors.length];

              return (
                <div
                  key={patient.patient_id}
                  style={{
                    backgroundColor: colors.bg,
                    border: `3px solid ${colors.border}`,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                  }}
                  className="rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 group"
                >
                  {/* Top Section with Light Background */}
                  <div
                    style={{ backgroundColor: colors.light }}
                    className="p-6 pb-8"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold" style={{ color: '#065F46' }}>
                          {patient.first_name} {patient.last_name}
                        </h3>
                        <div className="flex gap-2 mt-2">
                          <span
                            style={{
                              backgroundColor: colors.accent,
                              color: '#FFFFFF',
                            }}
                            className="text-xs font-bold px-3 py-1 rounded-full"
                          >
                            {getRelationshipLabel(patient.patient_id, patient.user_id)}
                          </span>
                          {patient.mrn && (
                            <span
                              style={{ backgroundColor: colors.accent, color: '#FFFFFF' }}
                              className="text-xs font-bold px-3 py-1 rounded-full opacity-70"
                            >
                              MRN: {patient.mrn}
                            </span>
                          )}
                        </div>
                      </div>
                      <Heart
                        size={32}
                        style={{ color: colors.accent }}
                        className="group-hover:fill-current transition-all"
                      />
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="px-6 py-6 space-y-4">
                    {patient.date_of_birth && (
                      <div className="flex items-center gap-3">
                        <Calendar size={18} style={{ color: colors.accent }} />
                        <div>
                          <p style={{ color: '#6B7280' }} className="text-xs font-semibold">
                            Date of Birth
                          </p>
                          <p
                            style={{ color: '#065F46' }}
                            className="font-semibold"
                          >
                            {new Date(patient.date_of_birth).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {patient.gender && (
                      <div className="flex items-center gap-3">
                        <Activity size={18} style={{ color: colors.accent }} />
                        <div>
                          <p style={{ color: '#6B7280' }} className="text-xs font-semibold">
                            Gender
                          </p>
                          <p
                            style={{ color: '#065F46' }}
                            className="font-semibold capitalize"
                          >
                            {patient.gender}
                          </p>
                        </div>
                      </div>
                    )}

                    {patient.blood_type && (
                      <div className="flex items-center gap-3">
                        <Heart size={18} style={{ color: colors.accent }} />
                        <div>
                          <p style={{ color: '#6B7280' }} className="text-xs font-semibold">
                            Blood Type
                          </p>
                          <p
                            style={{ color: '#065F46' }}
                            className="font-semibold"
                          >
                            {patient.blood_type}
                          </p>
                        </div>
                      </div>
                    )}

                    {patient.phone_number && (
                      <div className="flex items-center gap-3">
                        <Phone size={18} style={{ color: colors.accent }} />
                        <div>
                          <p style={{ color: '#6B7280' }} className="text-xs font-semibold">
                            Phone
                          </p>
                          <p
                            style={{ color: '#065F46' }}
                            className="font-semibold"
                          >
                            {patient.phone_number}
                          </p>
                        </div>
                      </div>
                    )}

                    {patient.department_name && (
                      <div className="flex items-center gap-3">
                        <Stethoscope size={18} style={{ color: colors.accent }} />
                        <div>
                          <p style={{ color: '#6B7280' }} className="text-xs font-semibold">
                            Department
                          </p>
                          <p
                            style={{ color: '#065F46' }}
                            className="font-semibold"
                          >
                            {patient.department_name}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="px-6 py-5 border-t" style={{ borderColor: colors.border, borderTopWidth: '2px' }}>
                    <div className="flex gap-3">
                      <Link
                        href={`/patient/${patient.patient_id}/appointments`}
                        style={{
                          backgroundColor: colors.accent,
                        }}
                        className="flex-1 text-white px-4 py-3 rounded-lg font-semibold transition-all hover:shadow-lg flex items-center justify-center gap-2"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.9';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <Calendar size={18} />
                        Appointments
                      </Link>
                      <Link
                        href={`/patient/${patient.patient_id}/profile`}
                        style={{
                          borderColor: colors.accent,
                          color: colors.accent,
                          border: `2px solid ${colors.accent}`,
                        }}
                        className="flex-1 px-4 py-3 rounded-lg font-semibold transition-all hover:shadow-lg flex items-center justify-center gap-2"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.light;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        Profile
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// StatCard Component
const StatCard = ({
  icon,
  title,
  value,
  bgColor,
  iconColor,
  borderColor,
  description,
}) => (
  <div
    style={{
      backgroundColor: bgColor,
      border: `3px solid ${borderColor}`,
    }}
    className="rounded-xl p-6 shadow-md hover:shadow-lg transition-all transform hover:scale-105 duration-300"
  >
    <div
      style={{ color: iconColor }}
      className="mb-4"
    >
      {icon}
    </div>
    <h3 style={{ color: '#065F46' }} className="text-sm font-bold uppercase tracking-wider mb-2">
      {title}
    </h3>
    <p style={{ color: iconColor }} className="text-3xl font-bold mb-1">
      {value}
    </p>
    <p style={{ color: '#6B7280' }} className="text-xs font-medium">
      {description}
    </p>
  </div>
);

export default PatientDashboard;