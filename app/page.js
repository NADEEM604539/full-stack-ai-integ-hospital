'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [stats, setStats] = useState({
    doctors: 0,
    departments: 0,
    nurses: 0,
    pharmacists: 0,
    medicines: 0,
  });

  // Handle user redirect if logged in
  useEffect(() => {
    if (!isLoaded) return;

    if (userId) {
      const redirectUser = async () => {
        try {
          const response = await fetch('/api/auth/user', {
            method: 'GET',
            cache: 'no-store',
          });

          if (response.status === 401) {
            setIsChecking(false);
            return;
          }

          if (!response.ok) {
             setIsChecking(false);
             return;
          }

          // Try to parse response
          let data;
          try {
            data = await response.json();
          } catch (parseError) {
            setIsChecking(false);
            return;
          }
          if (data?.success && data?.data?.role) {
            const role = data.data.role.toLowerCase();
            router.push(`/${role}/dashboard`);
          } else if (data?.data?.role) {
            // Has role but success might be undefined due to errors
            const role = data.data.role.toLowerCase();
            router.push(`/${role}/dashboard`);
          } else {
            // Default fallback
            console.warn('[HOME] No role found, staying on homepage.');
            setIsChecking(false);
          }
        } catch (error) {
          console.error('[HOME] Error:', error.message);
          // Stay on homepage on network error
          setIsChecking(false);
          return;
        }
      };

      redirectUser();
    } else {
      setIsChecking(false);
    }
  }, [isLoaded, userId, router]);

  // Fetch hospital statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('[HOME] Fetching hospital stats...');
        const response = await fetch('/api/hospital/stats', {
          method: 'GET',
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.success && data?.data) {
            console.log('[HOME] Stats loaded:', data.data);
            setStats(data.data);
          }
        }
      } catch (error) {
        console.error('[HOME] Error fetching stats:', error.message);
      }
    };

    fetchStats();
  }, []);

  // Loading screen
  if (!isLoaded || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-white text-xl font-semibold">Loading MediCare...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50 border-b-2 border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">♥</span>
              </div>
              <div>
                <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">MediCare</span>
                <p className="text-xs text-gray-500 -mt-1">Hospital</p>
              </div>
            </Link>
            <Link
              href="/sign-in"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-6 leading-tight">
            Your Health is Our
            <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Priority</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed font-medium">
            Experience world-class healthcare with our team of expert doctors, modern facilities, and compassionate care.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/sign-up"
              className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 text-lg"
            >
              Create Account
            </Link>
            <Link
              href="/sign-in"
              className="px-8 py-3.5 border-2 border-blue-600 text-blue-600 font-bold rounded-lg hover:bg-blue-50 hover:scale-105 transition-all duration-200 text-lg"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Doctors */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-blue-500 hover:shadow-2xl transition-shadow">
              <div className="text-5xl mb-4">👨‍⚕️</div>
              <p className="text-gray-700 text-sm font-semibold mb-2 uppercase tracking-wide">Expert Doctors</p>
              <p className="text-4xl font-black text-blue-600">{stats.doctors}</p>
              <p className="text-gray-600 text-xs mt-2 font-medium">Qualified Physicians</p>
            </div>

            {/* Departments */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-indigo-500 hover:shadow-2xl transition-shadow">
              <div className="text-5xl mb-4">🏥</div>
              <p className="text-gray-700 text-sm font-semibold mb-2 uppercase tracking-wide">Departments</p>
              <p className="text-4xl font-black text-indigo-600">{stats.departments}</p>
              <p className="text-gray-600 text-xs mt-2 font-medium">Medical Specialties</p>
            </div>

            {/* Nurses */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-green-500 hover:shadow-2xl transition-shadow">
              <div className="text-5xl mb-4">👩‍⚕️</div>
              <p className="text-gray-700 text-sm font-semibold mb-2 uppercase tracking-wide">Nurses</p>
              <p className="text-4xl font-black text-green-600">{stats.nurses}</p>
              <p className="text-gray-600 text-xs mt-2 font-medium">Care Professionals</p>
            </div>

            {/* Pharmacists */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-purple-500 hover:shadow-2xl transition-shadow">
              <div className="text-5xl mb-4">💊</div>
              <p className="text-gray-700 text-sm font-semibold mb-2 uppercase tracking-wide">Pharmacists</p>
              <p className="text-4xl font-black text-purple-600">{stats.pharmacists}</p>
              <p className="text-gray-600 text-xs mt-2 font-medium">Medication Experts</p>
            </div>

            {/* Medicines */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-pink-500 hover:shadow-2xl transition-shadow">
              <div className="text-5xl mb-4">🧬</div>
              <p className="text-gray-700 text-sm font-semibold mb-2 uppercase tracking-wide">Medicines</p>
              <p className="text-4xl font-black text-pink-600">{stats.medicines}</p>
              <p className="text-gray-600 text-xs mt-2 font-medium">In Stock</p>
            </div>
          </div>
        </div>
      </section>

      {/* Staff Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Hospital Staff</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-32 h-32 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-5xl">👨‍⚕️</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Doctors</h3>
            <p className="text-gray-600">
              Our experienced physicians provide comprehensive medical expertise across all specialties
            </p>
            <p className="text-blue-600 font-bold text-lg mt-4">{stats.doctors} Doctors</p>
          </div>
          <div className="text-center">
            <div className="bg-gradient-to-br from-green-100 to-green-200 w-32 h-32 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-5xl">👩‍⚕️</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Nurses</h3>
            <p className="text-gray-600">
              Highly trained nursing staff delivering compassionate around-the-clock patient care
            </p>
            <p className="text-green-600 font-bold text-lg mt-4">{stats.nurses} Nurses</p>
          </div>
          <div className="text-center">
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 w-32 h-32 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-5xl">💊</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Pharmacists</h3>
            <p className="text-gray-600">
              Expert pharmacists ensuring safe medication management and patient guidance
            </p>
            <p className="text-purple-600 font-bold text-lg mt-4">{stats.pharmacists} Pharmacists</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-16 rounded-xl mx-4 my-12 md:mx-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of patients who trust us with their healthcare
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/sign-up"
              className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
            >
              Create Account
            </Link>
            <Link
              href="/sign-in"
              className="px-8 py-3 border-2 border-white text-white rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors font-semibold text-lg"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">MediCare Hospital</h4>
              <p className="text-sm">Providing quality healthcare to our community since 1990</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-white">Home</Link></li>
                <li><Link href="/sign-in" className="hover:text-white">Appointments</Link></li>
                <li><Link href="/sign-up" className="hover:text-white">Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Emergency Care</a></li>
                <li><a href="#" className="hover:text-white">Surgery</a></li>
                <li><a href="#" className="hover:text-white">Consultation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Contact</h4>
              <p className="text-sm">Phone: +1 (555) 123-4567</p>
              <p className="text-sm">Email: info@medicarehospital.com</p>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-sm">
            <p>&copy; 2026 MediCare Hospital. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
