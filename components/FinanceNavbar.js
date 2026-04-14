'use client';

import React from 'react';
import Link from 'next/link';
import { Home, LogOut } from 'lucide-react';

const FinanceNavbar = () => {
  return (
    <nav
      style={{ backgroundColor: '#065F46' }}
      className="text-white p-6 shadow-lg"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/finance/dashboard" className="flex items-center gap-2 font-bold text-xl">
            <div
              style={{ backgroundColor: '#10B981' }}
              className="w-8 h-8 rounded-full flex items-center justify-center"
            >
              💰
            </div>
            Finance Portal
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/finance/dashboard"
            className="flex items-center gap-2 hover:bg-green-600 px-4 py-2 rounded transition"
          >
            <Home size={18} />
            Dashboard
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 hover:bg-green-600 px-4 py-2 rounded transition"
          >
            <LogOut size={18} />
            Exit
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default FinanceNavbar;
