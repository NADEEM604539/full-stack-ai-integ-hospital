'use client';

import React from 'react';
import FinanceNavbar from '@/components/FinanceNavbar';

export default function FinanceLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F7FA' }}>
      <FinanceNavbar />
      <div className="flex-1 p-8">
        {children}
      </div>
    </div>
  );
}
