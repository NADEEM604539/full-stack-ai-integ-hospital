'use client';

import { Home, Users, Calendar, Clock, UserCheck, FileText, Menu, X, User, Users2 } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';

export default function DoctorNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useUser();

  const navLinks = [
    { href: '/doctor/dashboard', label: 'Dashboard', icon: Home },
    { href: '/doctor/appointments', label: 'Appointments', icon: Calendar },
    { href: '/doctor/schedule', label: 'Schedule', icon: Clock },
    { href: '/doctor/patients', label: 'Patients', icon: Users },
    { href: '/doctor/encounters', label: 'Encounters', icon: FileText },
    { href: '/doctor/profile', label: 'My Profile', icon: User },
    { href: '/doctor/colleagues', label: 'Colleagues', icon: Users2 },
  ];

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 overflow-y-auto"
        style={{
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid rgba(59, 130, 246, 0.15)',
        }}
      >
        {/* Logo Section */}
        <div
          className="p-6 border-b"
          style={{
            backgroundColor: '#EFF6FF',
            borderColor: 'rgba(59, 130, 246, 0.15)',
          }}
        >
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#1E40AF' }}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: '#3B82F6' }}
            >
              ⚕️
            </div>
            MedSync
          </h1>
          <p className="text-xs mt-1" style={{ color: '#3B82F6' }}>
            Doctor Portal
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="w-full p-3 rounded-xl flex items-center gap-3 transition-all"
                style={{
                  backgroundColor: active ? '#EFF6FF' : 'transparent',
                  color: active ? '#1E40AF' : '#3B82F6',
                  borderLeft: active ? '4px solid #3B82F6' : '4px solid transparent',
                }}
              >
                <Icon size={20} />
                <span className="font-medium">{link.label}</span>
                {active && (
                  <div
                    className="ml-auto w-2 h-2 rounded-full"
                    style={{ backgroundColor: '#F59E0B' }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div
          className="p-4 border-t"
          style={{
            backgroundColor: '#FFFBF0',
            borderColor: 'rgba(245, 158, 11, 0.15)',
          }}
        >
          <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#FFE4F5' }}>
            <p className="text-sm font-semibold" style={{ color: '#1E40AF' }}>
              {user?.firstName && user?.lastName 
                ? `Dr. ${user.firstName} ${user.lastName}` 
                : user?.emailAddresses?.[0]?.emailAddress 
                ? user.emailAddresses[0].emailAddress.split('@')[0]
                : 'Doctor'}
            </p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
              {user?.emailAddresses?.[0]?.emailAddress || 'doctor@hospital.com'}
            </p>
          </div>
          <UserButton />
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg"
          style={{ backgroundColor: '#3B82F6', color: 'white' }}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="fixed left-0 top-0 h-screen w-64 flex flex-col overflow-y-auto"
            style={{ backgroundColor: '#FFFFFF' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Logo Section */}
            <div
              className="p-6 border-b"
              style={{
                backgroundColor: '#EFF6FF',
                borderColor: 'rgba(59, 130, 246, 0.15)',
              }}
            >
              <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#1E40AF' }}>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: '#3B82F6' }}
                >
                  ⚕️
                </div>
                MedSync
              </h1>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-4 space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="w-full p-3 rounded-xl flex items-center gap-3 transition-all"
                    style={{
                      backgroundColor: active ? '#EFF6FF' : 'transparent',
                      color: active ? '#1E40AF' : '#3B82F6',
                      borderLeft: active ? '4px solid #3B82F6' : '4px solid transparent',
                    }}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
