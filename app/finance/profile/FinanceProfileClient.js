'use client';

import { useState, useEffect } from 'react';
import { User, Phone, Mail, Briefcase, Building2, Edit2, Save, X, Loader, CheckCircle2, AlertCircle } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

export default function FinanceProfileClient() {
  const { user } = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [editData, setEditData] = useState({
    phone_number: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/finance/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const result = await response.json();
      setProfile(result.profile);
      setEditData({ phone_number: result.profile.phone_number || '' });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/finance/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess(true);
      setIsEditing(false);
      
      setTimeout(() => {
        fetchProfile();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} style={{ color: '#10B981' }} className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }} className="p-8">
        <div className="p-6 rounded-2xl flex gap-4 border-l-4" style={{ backgroundColor: '#FEE2E2', borderColor: '#EF4444' }}>
          <AlertCircle size={24} style={{ color: '#EF4444' }} />
          <div>
            <p className="font-bold" style={{ color: '#DC2626' }}>Error</p>
            <p style={{ color: '#991B1B' }} className="text-sm mt-1">{error || 'Profile not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }} className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold" style={{ color: '#065F46' }}>
          My Profile
        </h1>
        <p style={{ color: '#10B981' }} className="text-sm mt-2">
          Manage your finance profile information
        </p>
      </div>

      {success && (
        <div className="mb-8 p-6 rounded-2xl flex gap-4 border-l-4" style={{ backgroundColor: '#ECFDF5', borderColor: '#10B981' }}>
          <CheckCircle2 size={28} style={{ color: '#10B981' }} />
          <div>
            <p className="font-bold" style={{ color: '#065F46' }}>Changes Saved!</p>
            <p style={{ color: '#059669' }} className="text-sm mt-1">Your profile has been updated successfully</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-8 p-6 rounded-2xl flex gap-4 border-l-4" style={{ backgroundColor: '#FEE2E2', borderColor: '#EF4444' }}>
          <AlertCircle size={28} style={{ color: '#EF4444' }} />
          <div>
            <p className="font-bold" style={{ color: '#DC2626' }}>Error</p>
            <p style={{ color: '#991B1B' }} className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Card */}
        <div>
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}>
            <div
              className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl"
              style={{ backgroundColor: '#10B981' }}
            >
              {profile.first_name.charAt(0)}{profile.last_name.charAt(0)}
            </div>
            <h2 className="text-2xl font-bold" style={{ color: '#065F46' }}>
              {profile.first_name} {profile.last_name}
            </h2>
            <p className="text-sm mt-2 font-semibold" style={{ color: '#10B981' }}>
              Finance Staff
            </p>
            <div className="mt-4 pt-4 space-y-2" style={{ borderTop: '2px solid #E5E7EB' }}>
              <div className="flex items-center gap-2 justify-center">
                <Building2 size={16} style={{ color: '#10B981' }} />
                <span className="text-sm" style={{ color: '#6B7280' }}>
                  {profile.department_name || 'Finance Department'}
                </span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Mail size={16} style={{ color: '#10B981' }} />
                <span className="text-sm" style={{ color: '#6B7280' }}>
                  {user?.emailAddresses?.[0]?.emailAddress || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Phone size={16} style={{ color: '#10B981' }} />
                <span className="text-sm" style={{ color: '#6B7280' }}>
                  {profile.phone_number || 'Not provided'}
                </span>
              </div>
            </div>
            <span
              className="mt-6 inline-block px-4 py-2 rounded-lg font-semibold text-sm"
              style={{
                backgroundColor: '#D1FAE5',
                color: '#065F46',
              }}
            >
              ✓ Active
            </span>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl p-8" style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold" style={{ color: '#065F46' }}>
                Profile Details
              </h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition"
                  style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}
                >
                  <Edit2 size={18} />
                  Edit
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
                  First Name
                </label>
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
                >
                  {profile.first_name}
                </div>
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
                  Last Name
                </label>
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
                >
                  {profile.last_name}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
                  Email Address
                </label>
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
                >
                  {user?.emailAddresses?.[0]?.emailAddress || 'N/A'}
                </div>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                  Email managed through Clerk authentication
                </p>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
                  Department
                </label>
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
                >
                  {profile.department_name || 'Finance Department'}
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
                  Phone Number {isEditing && <span style={{ color: '#EF4444' }}>*</span>}
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone_number}
                    onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })}
                    className="w-full p-3 rounded-lg border-2 text-sm"
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                    }}
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <div
                    className="p-3 rounded-lg text-sm"
                    style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
                  >
                    {profile.phone_number || 'Not provided'}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleSaveChanges}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition disabled:opacity-50"
                    style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                  >
                    {submitting ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setError(null);
                      setEditData({ phone_number: profile.phone_number || '' });
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition"
                    style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
                  >
                    <X size={18} />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
