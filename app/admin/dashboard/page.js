'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch('/api/admin/dashboard');
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        
        const data = await response.json();
        setStats(data.stats);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <div style={{ padding: '2rem', color: '#065F46' }}>Loading dashboard...</div>;
  if (error) return <div style={{ padding: '2rem', color: '#C62828' }}>Error: {error}</div>;

  const StatCard = ({ title, value, color, icon }) => (
    <div style={{
      backgroundColor: '#fff',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '1.5rem',
      borderLeft: `4px solid ${color}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: '0 0 0.5rem 0', color: '#6B7280', fontSize: '0.9rem' }}>{title}</p>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: color }}>{value}</p>
        </div>
        <span style={{ fontSize: '3rem', opacity: 0.3 }}>{icon}</span>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', color: '#065F46' }}>Admin Dashboard</h1>
        <p style={{ margin: 0, color: '#6B7280' }}>System Overview & Management</p>
      </div>

      {/* Statistics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <StatCard 
          title="Total Users" 
          value={stats?.totalUsers || 0}
          color="#10B981"
          icon="👤"
        />
        <StatCard 
          title="Active Staff" 
          value={stats?.activeStaff || 0}
          color="#059669"
          icon="👥"
        />
        <StatCard 
          title="Departments" 
          value={stats?.departments || 0}
          color="#F59E0B"
          icon="🏥"
        />
        <StatCard 
          title="Active Patients" 
          value={stats?.activePatients || 0}
          color="#10B981"
          icon="🏥"
        />
        <StatCard 
          title="Scheduled Appointments" 
          value={stats?.scheduledAppointments || 0}
          color="#F59E0B"
          icon="📅"
        />
        <StatCard 
          title="Total Revenue" 
          value={`$${(Number(stats?.totalRevenue) || 0).toFixed(2)}`}
          color="#059669"
          icon="💰"
        />
      </div>

      {/* Quick Actions */}
      <div style={{
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#065F46' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <Link href="/admin/departments" style={{
            display: 'block',
            padding: '1rem',
            backgroundColor: '#E8F8F5',
            borderRadius: '4px',
            textAlign: 'center',
            textDecoration: 'none',
            color: '#047857',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }} onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F0FDF4';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }} onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#E8F8F5';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            Manage Departments
          </Link>
          
          <Link href="/admin/staff" style={{
            display: 'block',
            padding: '1rem',
            backgroundColor: '#FFE4F5',
            borderRadius: '4px',
            textAlign: 'center',
            textDecoration: 'none',
            color: '#065F46',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }} onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FFD9E8';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }} onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFE4F5';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            Manage Staff
          </Link>
          
          <Link href="/admin/admins" style={{
            display: 'block',
            padding: '1rem',
            backgroundColor: '#FFE4D6',
            borderRadius: '4px',
            textAlign: 'center',
            textDecoration: 'none',
            color: '#065F46',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }} onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FFE4D6';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }} onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFF5E6';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            Manage Users & Roles
          </Link>
          
          <Link href="/admin/audit-logs" style={{
            display: 'block',
            padding: '1rem',
            backgroundColor: '#FFF5E6',
            borderRadius: '4px',
            textAlign: 'center',
            textDecoration: 'none',
            color: '#065F46',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }} onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FFE4D6';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }} onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFF5E6';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            View Audit Logs
          </Link>
        </div>
      </div>

      {/* Today's Activity */}
      {stats?.todaysActivity && stats.todaysActivity.length > 0 && (
        <div style={{
          backgroundColor: '#fff',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#065F46' }}>Today's Activity</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            {stats.todaysActivity.map((activity, idx) => (
              <div key={idx} style={{
                padding: '1rem',
                backgroundColor: '#F0FDF4',
                borderRadius: '4px',
                textAlign: 'center',
                borderLeft: '4px solid #10B981'
              }}>
                <p style={{ margin: '0 0 0.5rem 0', color: '#6B7280', fontSize: '0.9rem' }}>{activity.action_type}</p>
                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#10B981' }}>{activity.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
