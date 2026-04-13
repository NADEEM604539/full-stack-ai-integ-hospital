'use client';

import { useState, useEffect } from 'react';

/**
 * Pharmacist Profile Page
 * Display pharmacist details and allow updating phone number
 */
export default function PharmacistProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const response = await fetch('/api/pharmacist/profile');
      if (!response.ok) {
        throw new Error(`Failed to fetch profile (${response.status})`);
      }
      const data = await response.json();
      setProfile(data.data);
      setPhoneNumber(data.data?.phone_number || '');
      setError(null);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePhone() {
    if (!phoneNumber.trim()) {
      setMessage('⚠️ Phone number cannot be empty');
      setMessageType('error');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/pharmacist/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update profile');

      setMessage('✅ Phone number updated successfully');
      setMessageType('success');
      setIsEditing(false);
      
      setTimeout(() => {
        setMessage(null);
        fetchProfile();
      }, 2000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage(err.message || 'Failed to update profile');
      setMessageType('error');
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded">
        <p className="font-bold">Error</p>
        <p>{error || 'Profile not found'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">👤 My Profile</h1>
        <p className="text-gray-600 mt-1">View and manage your pharmacist profile</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {message && (
        <div
          className={`border-l-4 p-4 mb-6 rounded ${
            messageType === 'success'
              ? 'bg-green-100 border-green-500 text-green-700'
              : 'bg-yellow-100 border-yellow-500 text-yellow-700'
          }`}
        >
          <p>{message}</p>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-lg p-8 w-full">
        {/* Profile Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-6">
            <div className="text-6xl bg-blue-100 p-4 rounded-full">💊</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {profile.first_name} {profile.last_name}
              </h2>
              <p className="text-gray-600 mt-1">Pharmacist</p>
              <p className="text-sm text-gray-500 mt-1">Staff ID: {profile.staff_id}</p>
              <p className="text-sm text-gray-500 mt-0.5">Employee ID: {profile.employee_id}</p>
            </div>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Personal Information */}
          <div className="border-r border-gray-200 pr-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Personal Information</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase">First Name</p>
                <p className="text-gray-900 mt-1 text-lg font-medium">{profile.first_name}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase">Last Name</p>
                <p className="text-gray-900 mt-1 text-lg font-medium">{profile.last_name}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase">Email</p>
                <p className="text-gray-900 mt-1 text-lg font-medium break-all">{profile.email}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase">Status</p>
                <div className="mt-1">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                      profile.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {profile.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Department Information */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Contact & Department</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase">Department</p>
                <p className="text-gray-900 mt-1 text-lg font-medium">{profile.department_name}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase">Phone Number</p>
                {isEditing ? (
                  <div className="mt-1 flex gap-2">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter phone number"
                      className="flex-1 px-3 py-2 border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                ) : (
                  <p className="text-gray-900 mt-1 text-lg font-medium">
                    {profile.phone_number || '—'}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase">Hire Date</p>
                <p className="text-gray-900 mt-1 text-lg font-medium">
                  {profile.hire_date ? new Date(profile.hire_date).toLocaleDateString() : '—'}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase">Designation</p>
                <p className="text-gray-900 mt-1 text-lg font-medium">
                  {profile.designation || '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 pt-6 flex gap-3 justify-end">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setPhoneNumber(profile.phone_number || '');
                }}
                className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePhone}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 transition"
              >
                {isSaving ? '⏳ Saving...' : '💾 Save'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
            >
              ✏️ Edit Phone Number
            </button>
          )}
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-2">ℹ️ Note</h3>
        <p className="text-blue-800">
          You can only update your phone number. For other changes, please contact the administration.
        </p>
      </div>
      </div>
    </div>
  );
}
