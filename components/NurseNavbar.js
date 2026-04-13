'use client';

import { Home, Users, Heart, Activity, FileText, Menu, X, User, Clock, Package } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';

export default function NurseNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useUser();

  const navLinks = [
    { href: '/nurse/dashboard', label: 'Dashboard', icon: Home },
    { href: '/nurse/patients', label: 'Patients', icon: Users },
    { href: '/nurse/encounters', label: 'Encounters', icon: Activity },
    { href: '/nurse/vitals', label: 'Vitals', icon: Heart },
    { href: '/nurse/request-medicine', label: 'Request Medicines', icon: Package },
    { href: '/nurse/profile', label: 'My Profile', icon: User },
  ];

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Desktop Sidebar - Purple/Teal theme for Nurse */}
      <aside
        className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 overflow-y-auto"
        style={{
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid rgba(139, 92, 246, 0.15)',
        }}
      >
        {/* Logo Section */}
        <div
          className="p-6 border-b"
          style={{
            backgroundColor: '#F3F0FF',
            borderColor: 'rgba(139, 92, 246, 0.15)',
          }}
        >
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#5B21B6' }}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: '#8B5CF6' }}
            >
              🏥
            </div>
            MedSync
          </h1>
          <p className="text-xs mt-1" style={{ color: '#8B5CF6' }}>
            Nurse Portal
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
                  backgroundColor: active ? '#F3F0FF' : 'transparent',
                  color: active ? '#5B21B6' : '#8B5CF6',
                  borderLeft: active ? '4px solid #8B5CF6' : '4px solid transparent',
                }}
              >
                <Icon size={20} />
                <span className="font-medium">{link.label}</span>
                {active && (
                  <div
                    className="ml-auto w-2 h-2 rounded-full"
                    style={{ backgroundColor: '#EC4899' }}
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
            backgroundColor: '#FDF2F8',
            borderColor: 'rgba(236, 72, 153, 0.15)',
          }}
        >
          <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#E9D5FF' }}>
            <p className="text-sm font-semibold" style={{ color: '#5B21B6' }}>
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.emailAddresses?.[0]?.emailAddress 
                ? user.emailAddresses[0].emailAddress.split('@')[0]
                : 'Nurse'}
            </p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
              Clinical Staff
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
          style={{ backgroundColor: '#8B5CF6', color: 'white' }}
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
                backgroundColor: '#F3F0FF',
                borderColor: 'rgba(139, 92, 246, 0.15)',
              }}
            >
              <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#5B21B6' }}>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: '#8B5CF6' }}
                >
                  🏥
                </div>
                MedSync
              </h1>
              <p className="text-xs mt-1" style={{ color: '#8B5CF6' }}>
                Nurse Portal
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
                      backgroundColor: active ? '#F3F0FF' : 'transparent',
                      color: active ? '#5B21B6' : '#8B5CF6',
                      borderLeft: active ? '4px solid #8B5CF6' : '4px solid transparent',
                    }}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Section */}
            <div
              className="p-4 border-t"
              style={{
                backgroundColor: '#FDF2F8',
                borderColor: 'rgba(236, 72, 153, 0.15)',
              }}
            >
              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#E9D5FF' }}>
                <p className="text-sm font-semibold" style={{ color: '#5B21B6' }}>
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.emailAddresses?.[0]?.emailAddress 
                    ? user.emailAddresses[0].emailAddress.split('@')[0]
                    : 'Nurse'}
                </p>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                  Clinical Staff
                </p>
              </div>
              <UserButton />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
