'use client';

import { Home, Users, Calendar, Clock, Menu, X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';

export default function ReceptionistNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useUser();

  const navLinks = [
    { href: '/receptionist/dashboard', label: 'Dashboard', icon: Home },
    { href: '/receptionist/patients', label: 'Patients', icon: Users },
    { href: '/receptionist/appointments', label: 'Appointments', icon: Calendar },
    { href: '/receptionist/schedule', label: 'Schedule', icon: Clock },
  ];

  const isActive = (href) => pathname === href;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 overflow-y-auto"
        style={{
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid rgba(16, 185, 129, 0.15)',
        }}
      >
        {/* Logo Section */}
        <div
          className="p-6 border-b"
          style={{
            backgroundColor: '#F0FDF4',
            borderColor: 'rgba(16, 185, 129, 0.15)',
          }}
        >
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#047857' }}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: '#10B981' }}
            >
              ⚕️
            </div>
            MedSync
          </h1>
          <p className="text-xs mt-1" style={{ color: '#10B981' }}>
            Receptionist Portal
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
                  backgroundColor: active ? '#F0FDF4' : 'transparent',
                  color: active ? '#047857' : '#10B981',
                  borderLeft: active ? '4px solid #10B981' : '4px solid transparent',
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
            <p className="text-sm font-semibold" style={{ color: '#065F46' }}>
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.emailAddresses?.[0]?.emailAddress 
                ? user.emailAddresses[0].emailAddress.split('@')[0]
                : 'User'}
            </p>
            <p className="text-xs" style={{ color: '#10B981' }}>
              Receptionist
            </p>
          </div>
          <div className="flex justify-center">
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

      {/* Mobile Header */}
      <div
        className="lg:hidden fixed top-0 w-full h-16 flex items-center justify-between px-4 z-50 border-b"
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: 'rgba(16, 185, 129, 0.15)',
        }}
      >
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#047857' }}>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm"
            style={{ backgroundColor: '#10B981' }}
          >
            ⚕️
          </div>
          MedSync
        </h1>
        <div className="flex items-center gap-4">
          <UserButton />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden"
            style={{ color: '#10B981' }}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed top-16 left-0 w-full z-40 border-b"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: 'rgba(16, 185, 129, 0.15)',
          }}
        >
          <nav className="p-4 space-y-2">
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
                    backgroundColor: active ? '#F0FDF4' : 'transparent',
                    color: active ? '#047857' : '#10B981',
                  }}
                >
                  <Icon size={20} />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
