'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
  Menu,
  X,
  Home,
  Calendar,
  Stethoscope,
  FileText,
  User,
  Heart,
  Pill,
  ChevronRight,
  AlertCircle,
  LogOut,
} from 'lucide-react';

export default function PatientDetailLayout({ children }) {
  const params = useParams();
  const pathname = usePathname();
  const { patientId } = params;

  const [patient, setPatient] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchPatient();
    fetchUserInfo();
  }, [patientId]);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/auth/user');
      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
      }
    } catch (err) {
      console.error('Error fetching user info:', err);
    }
  };

  const fetchPatient = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`[Layout] Fetching patient profile for patientId: ${patientId}`);
      
      const response = await fetch(`/api/patient/${patientId}/profile`);
      console.log(`[Layout] Profile fetch response status: ${response.status}`);

      if (!response.ok) {
        let errorMessage = 'Failed to fetch patient';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // Response is not JSON (might be HTML error page)
          const responseText = await response.text();
          console.error('[Layout] Response was not JSON:', responseText.substring(0, 200));
          errorMessage = `Server Error (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`[Layout] Profile fetch successful:`, data.data);
      setPatient(data.data);
    } catch (err) {
      console.error('[Layout] Error fetching patient:', {
        message: err.message,
        patientId,
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    {
      label: 'Appointments',
      href: `/patient/${patientId}/appointments`,
      icon: Calendar,
      active: pathname?.includes('/appointments'),
    },
    {
      label: 'Encounters',
      href: `/patient/${patientId}/encounters`,
      icon: Stethoscope,
      active: pathname?.includes('/encounters'),
    },
    {
      label: 'Vitals',
      href: `/patient/${patientId}/vitals`,
      icon: Heart,
      active: pathname?.includes('/vitals'),
    },
    {
      label: 'Medicines',
      href: `/patient/${patientId}/medicines`,
      icon: Pill,
      active: pathname?.includes('/medicines'),
    },
    {
      label: 'Medical History',
      href: `/patient/${patientId}/medical-history`,
      icon: Stethoscope,
      active: pathname?.includes('/medical-history'),
    },
    {
      label: 'Invoices',
      href: `/patient/${patientId}/invoices`,
      icon: FileText,
      active: pathname?.includes('/invoices'),
    },
    {
      label: 'Profile',
      href: `/patient/${patientId}/profile`,
      icon: User,
      active: pathname?.includes('/profile'),
    },
  ];

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F0FDF4' }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-b-2"
            style={{ borderBottomColor: '#10B981' }}
          ></div>
          <p style={{ color: '#10B981' }} className="mt-4 font-medium">
            Loading patient information...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: '#F0FDF4' }} className="min-h-screen flex items-center justify-center p-6">
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderLeft: '4px solid #D97706',
          }}
          className="rounded-lg shadow-lg p-8 max-w-md w-full text-center"
        >
          <AlertCircle size={48} style={{ color: '#D97706' }} className="mx-auto mb-4" />
          <h2 className="text-xl font-bold" style={{ color: '#065F46' }}>
            Error
          </h2>
          <p style={{ color: '#10B981' }} className="mt-2 font-medium mb-6">
            {error}
          </p>
          <Link
            href="/patient/dashboard"
            className="inline-block text-white px-6 py-2 rounded-lg font-medium transition hover:opacity-90"
            style={{ backgroundColor: '#10B981' }}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        }}
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header - User & Dashboard */}
        <div style={{ borderBottom: '2px solid #10B981' }} className="p-6">
          {/* Dashboard Button - Beautiful Design */}
          <Link
            href="/patient/dashboard"
            className="flex items-center gap-3 px-4 py-3 mb-6 rounded-xl font-bold transition-all duration-300 hover:shadow-lg hover:scale-105 transform"
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
            }}
          >
            <Home size={20} />
            <span>Dashboard</span>
            <ChevronRight size={18} className="ml-auto" />
          </Link>

          {/* User Profile Section */}
          {user && (
            <div
              style={{
                backgroundColor: '#E8F8F5',
                borderLeft: '4px solid #10B981',
              }}
              className="rounded-lg p-4 mb-4"
            >
              <p style={{ color: '#059669' }} className="text-xs font-bold uppercase tracking-wide mb-3">
                Account
              </p>

              {/* User Avatar & Info */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                <div className="flex-shrink-0">
                  <div style={{ backgroundColor: '#10B981' }} className="w-10 h-10 rounded-full flex items-center justify-center">
                    <span style={{ color: '#FFFFFF' }} className="font-bold text-sm">
                      {(user.username || user.email?.charAt(0) || 'U').toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm" style={{ color: '#065F46' }}>
                    {user.username || user.email?.split('@')[0]}
                  </h3>
                  <p style={{ color: '#10B981' }} className="text-xs truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Role Badge */}
              {user.role && (
                <div className="mb-4">
                  <span
                    className="inline-block text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: '#10B981',
                      color: '#FFFFFF',
                    }}
                  >
                    {user.role}
                  </span>
                </div>
              )}

              {/* User Button - Better Styling */}
              <div className="flex justify-center p-3 bg-white rounded-lg border border-gray-200">
                <UserButton
                  afterSignOutUrl="/sign-in"
                  appearance={{
                    elements: {
                      userButtonAvatarBox: {
                        width: '44px',
                        height: '44px',
                      },
                      userButtonTrigger: {
                        padding: '2px',
                      },
                    },
                  }}
                />
              </div>
            </div>
          )}

          {/* Patient Info */}
          {patient && (
            <div
              style={{
                backgroundColor: '#F0FDF4',
                border: '2px solid #10B981',
              }}
              className="rounded-lg p-4"
            >
              <p style={{ color: '#059669' }} className="text-xs font-bold uppercase tracking-wide mb-2">
                Patient Info
              </p>
              <h4 className="font-bold text-sm" style={{ color: '#065F46' }}>
                {patient.first_name} {patient.last_name}
              </h4>
              {patient.mrn && (
                <p style={{ color: '#10B981' }} className="text-xs mt-2 font-mono">
                  MRN: <span className="font-bold">{patient.mrn}</span>
                </p>
              )}
              <div className="flex gap-2 mt-3 flex-wrap">
                <span
                  className="inline-block text-xs px-2 py-1 rounded font-medium"
                  style={{ backgroundColor: '#FFFFFF', color: '#065F46', border: '1px solid #10B981' }}
                >
                  {patient.gender}
                </span>
                {patient.blood_type && (
                  <span
                    className="inline-block text-xs px-2 py-1 rounded font-medium"
                    style={{ backgroundColor: '#FFFFFF', color: '#065F46', border: '1px solid #10B981' }}
                  >
                    {patient.blood_type}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {/* Mobile Close Button */}
          <div className="lg:hidden mb-4 px-4">
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-full flex items-center justify-center p-2 rounded-lg transition"
              style={{ backgroundColor: '#F0FDF4' }}
            >
              <X size={20} style={{ color: '#10B981' }} />
            </button>
          </div>

          <p style={{ color: '#059669' }} className="text-xs font-bold uppercase tracking-wider px-4 py-2 mb-4">
            Clinical
          </p>
          {navItems.slice(0, 3).map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition duration-200 hover:shadow-sm"
                style={{
                  backgroundColor: item.active ? '#E8F8F5' : '#FFFFFF',
                  color: item.active ? '#065F46' : '#10B981',
                  borderLeft: item.active ? '3px solid #10B981' : 'none',
                  paddingLeft: item.active ? '13px' : '16px',
                }}
                onMouseEnter={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.backgroundColor = '#F0FDF4';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                  }
                }}
              >
                <div
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: item.active ? '#FFFFFF' : '#F0FDF4',
                  }}
                >
                  <IconComponent size={18} />
                </div>
                <span className="flex-1 font-semibold">{item.label}</span>
                {item.active && <ChevronRight size={18} />}
              </Link>
            );
          })}

          {/* Divider */}
          <div style={{ borderTop: '1px solid #E8F8F5' }} className="my-4" />

          <p style={{ color: '#059669' }} className="text-xs font-bold uppercase tracking-wider px-4 py-2 mb-4">
            Account
          </p>
          {navItems.slice(3).map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition duration-200 hover:shadow-sm"
                style={{
                  backgroundColor: item.active ? '#E8F8F5' : '#FFFFFF',
                  color: item.active ? '#065F46' : '#10B981',
                  borderLeft: item.active ? '3px solid #10B981' : 'none',
                  paddingLeft: item.active ? '13px' : '16px',
                }}
                onMouseEnter={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.backgroundColor = '#F0FDF4';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                  }
                }}
              >
                <div
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: item.active ? '#FFFFFF' : '#F0FDF4',
                  }}
                >
                  <IconComponent size={18} />
                </div>
                <span className="flex-1 font-semibold">{item.label}</span>
                {item.active && <ChevronRight size={18} />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Top Bar */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #10B981',
          }}
          className="sticky top-0 z-30"
        >
          <div className="flex items-center justify-between p-4 lg:p-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg"
              style={{ backgroundColor: '#F0FDF4' }}
            >
              <Menu size={24} style={{ color: '#10B981' }} />
            </button>

            {patient && (
              <div className="flex-1 ml-4 lg:ml-0">
                <h1 className="text-2xl font-bold" style={{ color: '#065F46' }}>
                  {patient.first_name} {patient.last_name}
                </h1>
                <p style={{ color: '#10B981' }} className="text-sm font-medium">
                  {new Date(patient.date_of_birth).toLocaleDateString()} • {patient.email}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Page Content */}
        <div style={{ backgroundColor: '#F0FDF4' }} className="p-4 lg:p-6 min-h-[calc(100vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
