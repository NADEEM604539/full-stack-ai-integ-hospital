'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import styles from '@/app/globals.css';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Check if user is admin
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check-role');
        if (!response.ok) {
          router.push('/login');
          return;
        }
        const data = await response.json();
        
        // Check if user is ADMIN (role_id = 1)
        if (data.role_id !== 1) {
          router.push('/unauthorized');
          return;
        }
        
        setUserRole(data.role_id);
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar Navigation */}
      <aside style={{
        width: '250px',
        backgroundColor: '#047857',
        color: '#FFFFFF',
        padding: '2rem 0',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#FFFFFF' }}>MedSync Admin</h1>
          <p style={{ fontSize: '0.9rem', color: '#E8F8F5' }}>Hospital Management</p>
        </div>

        <nav style={{ flex: 1 }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li>
              <Link href="/admin/dashboard" style={{
                display: 'block',
                padding: '1rem 1.5rem',
                color: '#FFFFFF',
                textDecoration: 'none',
                borderLeft: '4px solid transparent',
                transition: 'all 0.3s ease',
                fontSize: '0.95rem'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.borderLeftColor = '#F59E0B';
                e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.borderLeftColor = 'transparent';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
                📊 Dashboard
              </Link>
            </li>
            <li>
              <Link href="/admin/departments" style={{
                display: 'block',
                padding: '1rem 1.5rem',
                color: '#FFFFFF',
                textDecoration: 'none',
                borderLeft: '4px solid transparent',
                transition: 'all 0.3s ease',
                fontSize: '0.95rem'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.borderLeftColor = '#F59E0B';
                e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.borderLeftColor = 'transparent';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
                🏥 Departments
              </Link>
            </li>
            <li>
              <Link href="/admin/staff" style={{
                display: 'block',
                padding: '1rem 1.5rem',
                color: '#FFFFFF',
                textDecoration: 'none',
                borderLeft: '4px solid transparent',
                transition: 'all 0.3s ease',
                fontSize: '0.95rem'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.borderLeftColor = '#F59E0B';
                e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.borderLeftColor = 'transparent';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
                👥 Staff Members
              </Link>
            </li>
            <li>
              <Link href="/admin/admins" style={{
                display: 'block',
                padding: '1rem 1.5rem',
                color: '#FFFFFF',
                textDecoration: 'none',
                borderLeft: '4px solid transparent',
                transition: 'all 0.3s ease',
                fontSize: '0.95rem'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.borderLeftColor = '#F59E0B';
                e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.borderLeftColor = 'transparent';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
                🔐 Admins
              </Link>
            </li>
            <li>
              <Link href="/admin/patients" style={{
                display: 'block',
                padding: '1rem 1.5rem',
                color: '#FFFFFF',
                textDecoration: 'none',
                borderLeft: '4px solid transparent',
                transition: 'all 0.3s ease',
                fontSize: '0.95rem'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.borderLeftColor = '#F59E0B';
                e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.borderLeftColor = 'transparent';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
                🏥 Patients
              </Link>
            </li>
            <li>
              <Link href="/admin/encounters" style={{
                display: 'block',
                padding: '1rem 1.5rem',
                color: '#FFFFFF',
                textDecoration: 'none',
                borderLeft: '4px solid transparent',
                transition: 'all 0.3s ease',
                fontSize: '0.95rem'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.borderLeftColor = '#F59E0B';
                e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.borderLeftColor = 'transparent';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
                📋 Encounters
              </Link>
            </li>
            <li>
              <Link href="/admin/payments" style={{
                display: 'block',
                padding: '1rem 1.5rem',
                color: '#FFFFFF',
                textDecoration: 'none',
                borderLeft: '4px solid transparent',
                transition: 'all 0.3s ease',
                fontSize: '0.95rem'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.borderLeftColor = '#F59E0B';
                e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.borderLeftColor = 'transparent';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
                💳 Payments
              </Link>
            </li>
            <li>
              <Link href="/admin/profile" style={{
                display: 'block',
                padding: '1rem 1.5rem',
                color: '#FFFFFF',
                textDecoration: 'none',
                borderLeft: '4px solid transparent',
                transition: 'all 0.3s ease',
                fontSize: '0.95rem'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.borderLeftColor = '#F59E0B';
                e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.borderLeftColor = 'transparent';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
                👤 Profile
              </Link>
            </li>
            <li>
              <Link href="/admin/audit-logs" style={{
                display: 'block',
                padding: '1rem 1.5rem',
                color: '#FFFFFF',
                textDecoration: 'none',
                borderLeft: '4px solid transparent',
                transition: 'all 0.3s ease',
                fontSize: '0.95rem'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.borderLeftColor = '#F59E0B';
                e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.borderLeftColor = 'transparent';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
                📋 Audit Logs
              </Link>
            </li>
          </ul>
        </nav>

        {/* User Section */}
        <div style={{
          marginTop: 'auto',
          padding: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(245, 158, 11, 0.15)', borderRadius: '6px' }}>
            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: 'bold', color: '#FFFFFF' }}>
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.emailAddresses?.[0]?.emailAddress 
                ? user.emailAddresses[0].emailAddress.split('@')[0]
                : 'Admin'}
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#E8F8F5' }}>
              Administrator
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <UserButton 
              appearance={{
                elements: {
                  userButtonBox: 'w-full',
                  userButtonAvatarBox: 'w-auto',
                },
              }}
            />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        marginLeft: '250px',
        flex: 1,
        padding: '2rem',
        backgroundColor: '#FFFFFF'
      }}>
        {children}
      </main>
    </div>
  );
}
