'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const { user } = useUser();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Only proceed when auth is fully loaded
    if (!isLoaded) return;

    // If user is logged in, redirect to their dashboard
    if (userId) {
      const redirectUser = async () => {
        try {
          const response = await fetch('/api/auth/user', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!response.ok) {
            console.error('Failed to fetch user role:', response.status);
            setIsChecking(false);
            return;
          }

          const data = await response.json();
          if (data.success && data.data?.role) {
            const role = data.data.role.toLowerCase();
            router.push(`/${role}/dashboard`);
          } else {
            setIsChecking(false);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setIsChecking(false);
        }
      };

      redirectUser();
    } else {
      // User is not logged in, show homepage
      setIsChecking(false);
    }
  }, [isLoaded, userId, router]);

  // Show loading while checking authentication status
  if (!isLoaded || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="text-xl font-bold text-gray-900">MediCare Hospital</span>
            </div>
            <Link
              href="/sign-in"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
            Your Health is Our
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Priority</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Experience world-class healthcare with our team of expert doctors, modern facilities, and compassionate care.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/sign-up"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
            >
              Create Account
            </Link>
            <Link
              href="/sign-in"
              className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-lg"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Doctors */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-t-4 border-blue-600">
            <div className="text-4xl mb-4">👨‍⚕️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Expert Doctors</h3>
            <p className="text-gray-600 text-sm">
              Board-certified specialists with years of experience in various medical fields
            </p>
            <div className="mt-4 pt-4 border-t">
              <p className="text-2xl font-bold text-blue-600">500+</p>
              <p className="text-gray-500 text-sm">Qualified Physicians</p>
            </div>
          </div>

          {/* Departments */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-t-4 border-indigo-600">
            <div className="text-4xl mb-4">🏥</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Multiple Departments</h3>
            <p className="text-gray-600 text-sm">
              Comprehensive medical services across various specialties
            </p>
            <div className="mt-4 pt-4 border-t">
              <p className="text-2xl font-bold text-indigo-600">25+</p>
              <p className="text-gray-500 text-sm">Medical Departments</p>
            </div>
          </div>

          {/* Nurses */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-t-4 border-green-600">
            <div className="text-4xl mb-4">👩‍⚕️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Nursing Staff</h3>
            <p className="text-gray-600 text-sm">
              Dedicated nurses providing 24/7 patient care and support
            </p>
            <div className="mt-4 pt-4 border-t">
              <p className="text-2xl font-bold text-green-600">200+</p>
              <p className="text-gray-500 text-sm">Nursing Professionals</p>
            </div>
          </div>

          {/* Pharmacy */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-t-4 border-purple-600">
            <div className="text-4xl mb-4">💊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Modern Pharmacy</h3>
            <p className="text-gray-600 text-sm">
              Comprehensive pharmaceutical services with all latest medications
            </p>
            <div className="mt-4 pt-4 border-t">
              <p className="text-2xl font-bold text-purple-600">5000+</p>
              <p className="text-gray-500 text-sm">Medicines in Stock</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12 my-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white bg-opacity-10 rounded-lg p-6">
              <div className="text-3xl mb-4">📅</div>
              <h3 className="text-xl font-bold mb-2">Easy Appointment Booking</h3>
              <p className="text-blue-100">
                Book appointments with your favorite doctors online in just a few clicks
              </p>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-6">
              <div className="text-3xl mb-4">🏥</div>
              <h3 className="text-xl font-bold mb-2">Quality Treatment</h3>
              <p className="text-blue-100">
                Advanced medical facilities and best-in-class treatment options
              </p>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-6">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2">Health Records</h3>
              <p className="text-blue-100">
                Digital health records securely stored and accessible anytime
              </p>
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
            <p className="text-blue-600 font-bold text-lg mt-4">500+ Doctors</p>
          </div>
          <div className="text-center">
            <div className="bg-gradient-to-br from-green-100 to-green-200 w-32 h-32 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-5xl">👩‍⚕️</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Nurses</h3>
            <p className="text-gray-600">
              Highly trained nursing staff delivering compassionate around-the-clock patient care
            </p>
            <p className="text-green-600 font-bold text-lg mt-4">200+ Nurses</p>
          </div>
          <div className="text-center">
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 w-32 h-32 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-5xl">💊</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Pharmacists</h3>
            <p className="text-gray-600">
              Expert pharmacists ensuring safe medication management and patient guidance
            </p>
            <p className="text-purple-600 font-bold text-lg mt-4">50+ Pharmacists</p>
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
