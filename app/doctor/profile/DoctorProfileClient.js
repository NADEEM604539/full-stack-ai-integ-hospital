'use client';

import { useState, useEffect } from 'react';
import { User, Phone, Mail, Briefcase, Award, Edit2, Save, X, Loader, CheckCircle2, AlertCircle, Stethoscope } from 'lucide-react';

export default function DoctorProfileClient() {
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

      const response = await fetch('/api/doctor/profile');
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

      const response = await fetch('/api/doctor/profile', {
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
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} color="#3B82F6" className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8">
        <div className="p-6 rounded-2xl flex gap-4 border-l-4" style={{ backgroundColor: '#FFE4D6', borderColor: '#E74C3C' }}>
          <AlertCircle size={24} color="#E74C3C" />
          <div>
            <p className="font-bold" style={{ color: '#C0392B' }}>Error</p>
            <p style={{ color: '#922B21' }} className="text-sm mt-1">{error || 'Profile not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }} className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold" style={{ color: '#1E40AF' }}>
          My Profile
        </h1>
        <p style={{ color: '#3B82F6' }} className="text-sm mt-2">
          Manage your doctor profile information
        </p>
      </div>

      {success && (
        <div className="mb-8 p-6 rounded-2xl flex gap-4 border-l-4" style={{ backgroundColor: '#E8F8F5', borderColor: '#10B981' }}>
          <CheckCircle2 size={28} color="#10B981" />
          <div>
            <p className="font-bold" style={{ color: '#065F46' }}>Changes Saved!</p>
            <p style={{ color: '#10B981' }} className="text-sm mt-1">Your profile has been updated successfully</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-8 p-6 rounded-2xl flex gap-4 border-l-4" style={{ backgroundColor: '#FFE4D6', borderColor: '#E74C3C' }}>
          <AlertCircle size={28} color="#E74C3C" />
          <div>
            <p className="font-bold" style={{ color: '#C0392B' }}>Error</p>
            <p style={{ color: '#922B21' }} className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-8">
        <div>
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}>
            <div
              className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl"
              style={{ backgroundColor: '#3B82F6' }}
            >
              {profile.first_name.charAt(0)}{profile.last_name.charAt(0)}
            </div>
            <h2 className="text-2xl font-bold" style={{ color: '#1E40AF' }}>
              Dr. {profile.first_name} {profile.last_name}
            </h2>
            <p className="text-sm mt-2 font-semibold" style={{ color: '#3B82F6' }}>
              {profile.specialization}
            </p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
              ID: {profile.employee_id}
            </p>
            <div className="mt-4 pt-4" style={{ borderTop: '2px solid #E5E7EB' }}>
              <span
                className="px-4 py-2 rounded-lg font-semibold text-sm"
                style={{
                  backgroundColor: profile.status === 'Active' ? '#D1FAE5' : '#FEE2E2',
                  color: profile.status === 'Active' ? '#065F46' : '#7F1D1D',
                }}
              >
                {profile.status}
              </span>
            </div>
          </div>
        </div>

        <div className="col-span-2">
          <div className="rounded-2xl p-8" style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold" style={{ color: '#1E40AF' }}>Profile Information</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all hover:shadow-lg"
                  style={{ backgroundColor: '#3B82F6', color: '#FFFFFF' }}
                >
                  <Edit2 size={18} />
                  Edit Profile
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-6">
                {/* Fixed Fields */}
                <div className="p-6 rounded-lg" style={{ backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE' }}>
                  <p className="text-sm font-semibold mb-4" style={{ color: '#6B7280' }}>Fixed Fields (read-only)</p>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-semibold block mb-2" style={{ color: '#6B7280' }}>First Name</label>
                      <input type="text" value={profile.first_name} disabled className="w-full px-4 py-2 rounded-lg bg-gray-100" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-2" style={{ color: '#6B7280' }}>Last Name</label>
                      <input type="text" value={profile.last_name} disabled className="w-full px-4 py-2 rounded-lg bg-gray-100" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-2" style={{ color: '#6B7280' }}>Specialization</label>
                      <input type="text" value={profile.specialization} disabled className="w-full px-4 py-2 rounded-lg bg-gray-100" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-2" style={{ color: '#6B7280' }}>Consultation Fee</label>
                      <input type="text" value={`Rs. ${profile.consultation_fee}`} disabled className="w-full px-4 py-2 rounded-lg bg-gray-100" />
                    </div>
                  </div>
                </div>

                {/* Editable Fields */}
                <div className="p-6 rounded-lg" style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B' }}>
                  <p className="text-sm font-semibold mb-4" style={{ color: '#92400E' }}>You can update these fields</p>
                  <div>
                    <label className="text-xs font-semibold block mb-2" style={{ color: '#065F46' }}>Phone Number</label>
                    <input
                      type="tel"
                      value={editData.phone_number}
                      onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border-2 outline-none"
                      style={{ borderColor: '#F59E0B', backgroundColor: '#FFFFFF', color: '#1F2937' }}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleSaveChanges}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-lg disabled:opacity-50"
                    style={{ backgroundColor: '#3B82F6', color: '#FFFFFF' }}
                  >
                    {submitting ? <Loader size={20} className="animate-spin" /> : <Save size={20} />}
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({ phone_number: profile.phone_number || '' });
                    }}
                    className="flex-1 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
                    style={{ backgroundColor: '#E5E7EB', color: '#1F2937' }}
                  >
                    <X size={20} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold block mb-2" style={{ color: '#6B7280' }}>First Name</label>
                  <p className="text-lg font-bold" style={{ color: '#1E40AF' }}>{profile.first_name}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-2" style={{ color: '#6B7280' }}>Last Name</label>
                  <p className="text-lg font-bold" style={{ color: '#1E40AF' }}>{profile.last_name}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-2" style={{ color: '#6B7280' }}>Phone Number</label>
                  <p className="text-lg font-bold" style={{ color: '#1E40AF' }}>{profile.phone_number}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-2" style={{ color: '#6B7280' }}>Email</label>
                  <p className="text-lg font-bold" style={{ color: '#1E40AF' }}>{profile.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-2" style={{ color: '#6B7280' }}>Specialization</label>
                  <p className="text-lg font-bold" style={{ color: '#1E40AF' }}>{profile.specialization}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-2" style={{ color: '#6B7280' }}>Consultation Fee</label>
                  <p className="text-lg font-bold" style={{ color: '#1E40AF' }}>Rs. {profile.consultation_fee}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
