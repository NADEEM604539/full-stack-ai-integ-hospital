'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';

export default function PharmacistNavbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useUser();

  const isActive = (path) => pathname === path;

  const navItems = [
    { label: '📊 Dashboard', href: '/pharmacist/dashboard', icon: '📊' },
    { label: '💊 Medicines Requests', href: '/pharmacist/medicines', icon: '💬' },
    { label: '✅ Accepted Requests', href: '/pharmacist/accepted-requests', icon: '✅' },
    { label: '📦 Available Medicines', href: '/pharmacist/inventory', icon: '📦' },
  ];

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <Link href="/pharmacist/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
              <span className="text-2xl font-bold">💊 Pharmacy</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                    isActive(item.href)
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'text-white hover:bg-blue-500 hover:bg-opacity-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/pharmacist/profile"
                className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                  isActive('/pharmacist/profile')
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-white hover:bg-blue-500 hover:bg-opacity-50'
                }`}
              >
                👤 Profile
              </Link>
              <div style={{ height: '24px', width: '1px', backgroundColor: 'rgba(255,255,255,0.3)' }} />
              <UserButton />
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white p-2 rounded-lg hover:bg-blue-500"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-blue-700 border-t border-blue-600">
            <nav className="px-4 py-3 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-2 rounded-lg font-semibold transition-colors ${
                    isActive(item.href)
                      ? 'bg-white text-blue-600'
                      : 'text-white hover:bg-blue-600'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/pharmacist/profile"
                onClick={() => setIsMenuOpen(false)}
                className={`block px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isActive('/pharmacist/profile')
                    ? 'bg-white text-blue-600'
                    : 'text-white hover:bg-blue-600'
                }`}
              >
                👤 Profile
              </Link>
            </nav>
          </div>
        )}
      </div>
    </>
  );
}
