'use client';

import React, { useState, useEffect } from 'react';
import { Users, Activity, Heart, AlertCircle, Clock, BarChart3, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const NurseDashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeEncounters: 0,
    vitalsRecorded: 0,
    pendingTasks: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/nurse/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setStats(data.data.stats || {});
      setRecentActivity(data.data.recentActivity || []);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderLeft: `5px solid ${color}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
      className="rounded-lg p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p style={{ color: '#6B7280' }} className="text-sm font-medium mb-2">
            {title}
          </p>
          <h3 className="text-4xl font-bold" style={{ color: '#1F2937' }}>
            {value}
          </h3>
        </div>
        <div
          style={{ backgroundColor: `${color}20` }}
          className="w-14 h-14 rounded-lg flex items-center justify-center"
        >
          <Icon size={28} color={color} />
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      {/* Header */}
      <div
        className="shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-5xl font-bold text-white mb-3">
            Welcome Back, Nurse
          </h1>
          <p className="text-purple-100 text-lg">
            Manage patient vitals, encounters, and clinical support
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            icon={Users}
            title="Assigned Patients"
            value={stats.totalPatients}
            color="#8B5CF6"
          />
          <StatCard
            icon={Activity}
            title="Active Encounters"
            value={stats.activeEncounters}
            color="#EC4899"
          />
          <StatCard
            icon={Heart}
            title="Vitals Recorded Today"
            value={stats.vitalsRecorded}
            color="#F59E0B"
          />
          <StatCard
            icon={Clock}
            title="Pending Tasks"
            value={stats.pendingTasks}
            color="#EF4444"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6" style={{ color: '#1F2937' }}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/nurse/patients"
              style={{
                backgroundColor: '#FFFFFF',
                borderTop: '4px solid #8B5CF6',
              }}
              className="rounded-xl p-6 hover:shadow-lg transition-all"
            >
              <Users size={40} color="#8B5CF6" className="mb-4" />
              <h3 className="text-xl font-bold mb-2" style={{ color: '#1F2937' }}>
                View Patients
              </h3>
              <p style={{ color: '#6B7280' }}>
                Access assigned patients and their records
              </p>
            </Link>

            <Link
              href="/nurse/encounters"
              style={{
                backgroundColor: '#FFFFFF',
                borderTop: '4px solid #EC4899',
              }}
              className="rounded-xl p-6 hover:shadow-lg transition-all"
            >
              <Activity size={40} color="#EC4899" className="mb-4" />
              <h3 className="text-xl font-bold mb-2" style={{ color: '#1F2937' }}>
                Start Encounter
              </h3>
              <p style={{ color: '#6B7280' }}>
                Begin a new patient encounter or view existing ones
              </p>
            </Link>

            <Link
              href="/nurse/vitals"
              style={{
                backgroundColor: '#FFFFFF',
                borderTop: '4px solid #F59E0B',
              }}
              className="rounded-xl p-6 hover:shadow-lg transition-all"
            >
              <Heart size={40} color="#F59E0B" className="mb-4" />
              <h3 className="text-xl font-bold mb-2" style={{ color: '#1F2937' }}>
                Record Vitals
              </h3>
              <p style={{ color: '#6B7280' }}>
                Document patient vital signs and measurements
              </p>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold mb-6" style={{ color: '#1F2937' }}>
              Recent Activity
            </h2>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
              className="rounded-xl overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#6B7280' }}>
                        Patient
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#6B7280' }}>
                        Activity
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#6B7280' }}>
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((activity, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td className="px-6 py-4 text-sm font-medium" style={{ color: '#1F2937' }}>
                          {activity.patient_name}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#6B7280' }}>
                          {activity.encounter_type} - {activity.status}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#6B7280' }}>
                          {new Date(activity.admission_date).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NurseDashboard;