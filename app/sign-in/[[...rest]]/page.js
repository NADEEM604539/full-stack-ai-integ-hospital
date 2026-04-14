'use client';

import { SignIn } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SignInPage() {
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
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Sign in to your MediCare Hospital account
            </p>
          </div>

          {/* Clerk Sign In Component */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100">
            <SignIn
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

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm sm:text-base">
              Don't have an account?{' '}
              <Link href="/sign-up" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Create one now
              </Link>
            </p>
          </div>

          {/* Info Cards */}
          <div className="mt-10 space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-shrink-0 pt-0.5">
                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Secure Access</p>
                <p className="text-xs text-blue-700 mt-0.5">Your data is encrypted and protected</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex-shrink-0 pt-0.5">
                <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">Easy Management</p>
                <p className="text-xs text-green-700 mt-0.5">Manage appointments and records effortlessly</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex-shrink-0 pt-0.5">
                <svg className="h-5 w-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-purple-900">24/7 Support</p>
                <p className="text-xs text-purple-700 mt-0.5">Get help anytime you need it</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
