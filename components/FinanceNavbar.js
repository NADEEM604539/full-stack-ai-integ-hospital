'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Home, LogOut, Calendar, FileText, Users, Menu, X, User } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';

const FinanceNavbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useUser();

  return (
    <nav
      style={{ backgroundColor: '#065F46' }}
      className="text-white shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/finance/dashboard" className="flex items-center gap-2 font-bold text-xl">
          <div
            style={{ backgroundColor: '#10B981' }}
            className="w-8 h-8 rounded-full flex items-center justify-center"
          >
            💰
          </div>
          <span className="hidden sm:inline">Finance Portal</span>
        </Link>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="sm:hidden p-2"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop Links */}
        <div className="hidden sm:flex items-center gap-4">
          <Link
            href="/finance/dashboard"
            className="flex items-center gap-2 hover:bg-green-600 px-4 py-2 rounded transition"
          >
            <Home size={18} />
            Dashboard
          </Link>
          <Link
            href="/finance/appointments"
            className="flex items-center gap-2 hover:bg-green-600 px-4 py-2 rounded transition"
          >
            <Calendar size={18} />
            Appointments
          </Link>
          <Link
            href="/finance/invoices"
            className="flex items-center gap-2 hover:bg-green-600 px-4 py-2 rounded transition"
          >
            <FileText size={18} />
            Invoices
          </Link>
          <Link
            href="/finance/patients"
            className="flex items-center gap-2 hover:bg-green-600 px-4 py-2 rounded transition"
          >
            <Users size={18} />
            Patients
          </Link>
          <Link
            href="/finance/profile"
            className="flex items-center gap-2 hover:bg-green-600 px-4 py-2 rounded transition"
          >
            <User size={18} />
            Profile
          </Link>
          <div style={{ height: '24px', width: '1px', backgroundColor: 'rgba(255,255,255,0.3)' }} />
          <UserButton />
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="sm:hidden bg-green-700 border-t border-green-600 p-4 space-y-2">
          <Link
            href="/finance/dashboard"
            className="block px-4 py-2 rounded hover:bg-green-600 transition"
            onClick={() => setMobileOpen(false)}
          >
            📊 Dashboard
          </Link>
          <Link
            href="/finance/appointments"
            className="block px-4 py-2 rounded hover:bg-green-600 transition"
            onClick={() => setMobileOpen(false)}
          >
            📅 Appointments
          </Link>
          <Link
            href="/finance/invoices"
            className="block px-4 py-2 rounded hover:bg-green-600 transition"
            onClick={() => setMobileOpen(false)}
          >
            📄 Invoices
          </Link>
          <Link
            href="/finance/patients"
            className="block px-4 py-2 rounded hover:bg-green-600 transition"
            onClick={() => setMobileOpen(false)}
          >
            👥 Patients
          </Link>
          <Link
            href="/finance/profile"
            className="block px-4 py-2 rounded hover:bg-green-600 transition"
            onClick={() => setMobileOpen(false)}
          >
            👤 Profile
          </Link>
          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.3)' }} className="my-2" />
          <div className="px-4 py-2">
            <UserButton />
          </div>
        </div>
      )}
    </nav>
  );
};

export default FinanceNavbar;
