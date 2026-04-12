'use client';

import React, { useState, useEffect } from 'react';
import { Loader, AlertCircle, ChevronLeft, User, Mail, Phone, Building } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

const NurseProfilePage = () => {
  const router = useRouter();
  const { user } = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailAddresses?.[0]?.emailAddress,
        role: 'Nurse / Clinical Staff',
        department: 'General',
        joinDate: new Date().toLocaleDateString(),
      });
    }
    setLoading(false);
  }, [user]);

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} color="#8B5CF6" className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      {/* Header */}
      <div
        className="shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
        }}
      >
        <div className="max-w-4xl mx-auto px-6 py-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-purple-100 hover:text-white transition mb-6 font-semibold"
          >
            <ChevronLeft size={20} />
            Back
          </button>
          <h1 className="text-5xl font-bold text-white mb-2">
            My Profile
          </h1>
          <p className="text-purple-100 text-lg">
            Your professional profile and information
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {error && (
          <div
            style={{
              backgroundColor: '#FFD9E8',
              borderLeft: '5px solid #F59E0B',
            }}
            className="rounded-lg p-5 mb-8 flex items-start gap-4"
          >
            <AlertCircle size={24} style={{ color: '#D97706' }} className="flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold" style={{ color: '#065F46' }}>
                Error Loading Profile
              </h3>
              <p style={{ color: '#065F46' }} className="text-sm mt-1">
                {error}
              </p>
            </div>
          </div>
        )}

        {profile && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '3px solid #8B5CF6',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
            className="rounded-2xl overflow-hidden"
          >
            {/* Profile Header */}
            <div
              className="px-8 py-12 text-center"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
              }}
            >
              <div
                className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-white text-5xl"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="text-purple-100 text-lg">
                {profile.role}
              </p>
            </div>

            {/* Profile Details */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Email */}
                <div
                  style={{
                    backgroundColor: '#F3F0FF',
                    border: '2px solid #8B5CF6',
                  }}
                  className="rounded-xl p-6"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF' }}
                    >
                      <Mail size={24} />
                    </div>
                    <div>
                      <p style={{ color: '#6B7280' }} className="text-sm font-semibold">
                        Email Address
                      </p>
                      <p style={{ color: '#1F2937' }} className="text-lg font-bold mt-1">
                        {profile.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Department */}
                <div
                  style={{
                    backgroundColor: '#FDF2F8',
                    border: '2px solid #EC4899',
                  }}
                  className="rounded-xl p-6"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: '#EC4899', color: '#FFFFFF' }}
                    >
                      <Building size={24} />
                    </div>
                    <div>
                      <p style={{ color: '#6B7280' }} className="text-sm font-semibold">
                        Department
                      </p>
                      <p style={{ color: '#1F2937' }} className="text-lg font-bold mt-1">
                        {profile.department}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Role */}
                <div
                  style={{
                    backgroundColor: '#FFFBF0',
                    border: '2px solid #F59E0B',
                  }}
                  className="rounded-xl p-6"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: '#F59E0B', color: '#FFFFFF' }}
                    >
                      <User size={24} />
                    </div>
                    <div>
                      <p style={{ color: '#6B7280' }} className="text-sm font-semibold">
                        Role
                      </p>
                      <p style={{ color: '#1F2937' }} className="text-lg font-bold mt-1">
                        {profile.role}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Join Date */}
                <div
                  style={{
                    backgroundColor: '#ECFDF5',
                    border: '2px solid #10B981',
                  }}
                  className="rounded-xl p-6"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                    >
                      📅
                    </div>
                    <div>
                      <p style={{ color: '#6B7280' }} className="text-sm font-semibold">
                        Join Date
                      </p>
                      <p style={{ color: '#1F2937' }} className="text-lg font-bold mt-1">
                        {profile.joinDate}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Cards */}
              <div className="mt-12 p-6 rounded-xl" style={{ backgroundColor: '#F9FAFB' }}>
                <h3 className="text-lg font-bold mb-4" style={{ color: '#1F2937' }}>
                  🏥 Clinical Responsibilities
                </h3>
                <ul className="space-y-2" style={{ color: '#6B7280' }}>
                  <li>✓ Recording and monitoring patient vital signs</li>
                  <li>✓ Assisting with patient encounters and admission</li>
                  <li>✓ Documenting vital measurements (BP, HR, temperature, O₂ saturation)</li>
                  <li>✓ Supporting clinical staff with patient care</li>
                  <li>✓ Maintaining patient records and medical history</li>
                  <li>✓ Department-based patient access only</li>
                </ul>
              </div>

              <div className="mt-6 p-6 rounded-xl" style={{ backgroundColor: '#F3F0FF', border: '2px solid #8B5CF6' }}>
                <h3 className="text-lg font-bold mb-4" style={{ color: '#5B21B6' }}>
                  🔒 Security & Access Control
                </h3>
                <ul className="space-y-2" style={{ color: '#6B7280' }}>
                  <li>✓ Role-based access control (RBAC)</li>
                  <li>✓ Department-based patient isolation</li>
                  <li>✓ All actions logged for audit trail</li>
                  <li>✓ Clerk authentication for secure login</li>
                  <li>✓ Read-only access to SOAP notes</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NurseProfilePage;
