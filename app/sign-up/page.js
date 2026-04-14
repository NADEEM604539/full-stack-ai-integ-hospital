'use client';

import { SignUp } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SignUpPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-75 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <span className="text-xl font-bold text-gray-900">MediCare Hospital</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Join MediCare Hospital and start managing your health today
            </p>
          </div>

          {/* Clerk Sign Up Component */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100">
            <SignUp
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'bg-white shadow-none border-0',
                  cardBox: 'bg-white',
                  formButtonPrimary:
                    'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 w-full',
                  formFieldInput:
                    'border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all',
                  formFieldLabel: 'text-gray-700 font-medium text-sm',
                  dividerLine: 'bg-gray-200',
                  dividerText: 'text-gray-600 text-sm font-medium',
                  socialButtonsBlockButton:
                    'border border-gray-300 hover:border-gray-400 rounded-lg py-2.5 transition-all hover:bg-gray-50',
                  socialButtonsBlockButtonText: 'font-semibold text-gray-700',
                  formResendCodeLink: 'text-blue-600 hover:text-blue-700 font-semibold',
                  footerActionLink: 'text-blue-600 hover:text-blue-700 font-semibold',
                  backButton: 'text-gray-600 hover:text-gray-900',
                },
                layout: {
                  socialButtonsPlacement: 'bottom',
                  logoPlacement: 'inside',
                },
              }}
              redirectUrl="/patient/dashboard"
            />
          </div>

          {/* Divider */}
          <div className="mt-8 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm font-medium">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Sign In Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm sm:text-base">
              Already have an account?{' '}
              <Link href="/sign-in" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>

          {/* Features List */}
          <div className="mt-10 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Why join MediCare?</h3>

            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-shrink-0 pt-0.5">
                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Book Appointments</p>
                <p className="text-xs text-blue-700 mt-0.5">Easy scheduling with our expert doctors</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex-shrink-0 pt-0.5">
                <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">Medical Records</p>
                <p className="text-xs text-green-700 mt-0.5">Secure access to all your health information</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex-shrink-0 pt-0.5">
                <svg className="h-5 w-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-purple-900">Expert Care</p>
                <p className="text-xs text-purple-700 mt-0.5">Access to 500+ qualified healthcare professionals</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Hospital Info (Hidden on Mobile) */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-12">
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Your Health Journey Starts Here
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Join thousands of patients who trust MediCare Hospital for their healthcare needs. Modern technology meets compassionate care.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <p className="font-semibold text-blue-900 mb-2">📅 Quick Booking</p>
                <p className="text-sm text-blue-800">Schedule appointments with your preferred doctors in seconds</p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <p className="font-semibold text-green-900 mb-2">🏥 Comprehensive Care</p>
                <p className="text-sm text-green-800">Access to 25+ departments and specialized services</p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
                <p className="font-semibold text-purple-900 mb-2">💊 Prescription Management</p>
                <p className="text-sm text-purple-800">Digital prescriptions and pharmacy integration</p>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4">
                <p className="font-semibold text-orange-900 mb-2">🔒 Secure & Private</p>
                <p className="text-sm text-orange-800">Your data is encrypted and protected with industry-leading security</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm text-center sm:text-left mb-4 sm:mb-0">
              © 2026 MediCare Hospital. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-gray-600">
              <a href="#" className="hover:text-blue-600 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors">
                Contact us
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
