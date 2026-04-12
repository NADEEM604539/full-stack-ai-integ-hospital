'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User, Mail, Phone, MapPin, AlertCircle, CheckCircle, Save, X, ChevronLeft, Heart, Clipboard, Building } from 'lucide-react';

const ProfilePage = () => {
  const { patientId } = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchPatient();
    fetchDepartments();
  }, [patientId]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchPatient = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/patient/${patientId}/profile`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch patient');
      }

      const data = await response.json();
      setPatient(data.data);
      setFormData(data.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching patient:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const response = await fetch(`/api/patient/${patientId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Use the updated patient data from the API response (includes department_name)
      setPatient(data.data || data);
      setFormData(data.data || data);
      setSuccess(true);
      setEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(patient);
    setEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF' }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-emerald-600"></div>
          <p className="mt-6 text-lg" style={{ color: '#065F46' }}>
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div style={{ backgroundColor: '#FFFFFF' }} className="min-h-screen flex items-center justify-center p-6">
        <div
          style={{
            backgroundColor: '#FFD9E8',
            border: '3px solid #F59E0B',
          }}
          className="rounded-2xl p-12 text-center max-w-md"
        >
          <AlertCircle size={48} style={{ color: '#D97706' }} className="mx-auto mb-4" />
          <h3 className="text-xl font-bold" style={{ color: '#065F46' }}>
            Profile Not Found
          </h3>
          <p style={{ color: '#065F46' }} className="mt-2">
            Unable to load the patient profile.
          </p>
        </div>
      </div>
    );
  }

  const age = new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear();

  return (
    <div style={{ backgroundColor: '#FFFFFF' }} className="min-h-screen">
      {/* Modern Header */}
      <div
        className="shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-emerald-100 hover:text-white transition mb-6 font-semibold"
          >
            <ChevronLeft size={20} />
            Back
          </button>
          <h1 className="text-5xl font-bold text-white mb-2">
            {patient.first_name} {patient.last_name}
          </h1>
          <p className="text-emerald-100 text-lg">
            Medical Profile & Personal Information
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Messages */}
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
                Error
              </h3>
              <p style={{ color: '#065F46' }} className="text-sm mt-1">
                {error}
              </p>
            </div>
          </div>
        )}

        {success && (
          <div
            style={{
              backgroundColor: '#E8F8F5',
              borderLeft: '5px solid #10B981',
            }}
            className="rounded-lg p-5 mb-8 flex items-start gap-4"
          >
            <CheckCircle size={24} style={{ color: '#10B981' }} className="flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold" style={{ color: '#065F46' }}>
                Success
              </h3>
              <p style={{ color: '#065F46' }} className="text-sm mt-1">
                Profile updated successfully!
              </p>
            </div>
          </div>
        )}

        {/* Header with Edit Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold" style={{ color: '#065F46' }}>
              Profile Information
            </h2>
            <p style={{ color: '#10B981' }} className="mt-2 font-medium">
              View and manage your personal details
            </p>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-white px-8 py-4 rounded-full font-semibold transition flex items-center gap-2 hover:shadow-lg"
              style={{
                backgroundColor: '#10B981',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <User size={20} />
              Edit Profile
            </button>
          )}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2 Columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '3px solid #10B981',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
              className="rounded-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-8">
                <User size={28} style={{ color: '#10B981' }} />
                <h3 className="text-2xl font-bold" style={{ color: '#065F46' }}>
                  Personal Information
                </h3>
              </div>

              {!editing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-8">
                    <div
                      style={{ backgroundColor: '#E8F8F5' }}
                      className="p-5 rounded-xl"
                    >
                      <p className="text-sm font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                        First Name
                      </p>
                      <p className="text-xl font-bold mt-2" style={{ color: '#065F46' }}>
                        {patient.first_name}
                      </p>
                    </div>
                    <div
                      style={{ backgroundColor: '#E8F8F5' }}
                      className="p-5 rounded-xl"
                    >
                      <p className="text-sm font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                        Last Name
                      </p>
                      <p className="text-xl font-bold mt-2" style={{ color: '#065F46' }}>
                        {patient.last_name}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div
                      style={{ backgroundColor: '#FFE4F5' }}
                      className="p-5 rounded-xl"
                    >
                      <p className="text-sm font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                        Date of Birth
                      </p>
                      <p className="text-xl font-bold mt-2" style={{ color: '#065F46' }}>
                        {new Date(patient.date_of_birth).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div
                      style={{ backgroundColor: '#FFE4F5' }}
                      className="p-5 rounded-xl"
                    >
                      <p className="text-sm font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                        Gender
                      </p>
                      <p className="text-xl font-bold mt-2" style={{ color: '#065F46' }}>
                        {patient.gender === 'M'
                          ? 'Male'
                          : patient.gender === 'F'
                            ? 'Female'
                            : patient.gender || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label style={{ color: '#065F46' }} className="block text-sm font-bold mb-2 uppercase tracking-wider">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name || ''}
                        onChange={handleChange}
                        style={{
                          borderColor: '#10B981',
                          color: '#065F46',
                        }}
                        className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2"
                        onFocus={(e) => (e.target.style.borderColor = '#059669')}
                        onBlur={(e) => (e.target.style.borderColor = '#10B981')}
                      />
                    </div>
                    <div>
                      <label style={{ color: '#065F46' }} className="block text-sm font-bold mb-2 uppercase tracking-wider">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name || ''}
                        onChange={handleChange}
                        style={{
                          borderColor: '#10B981',
                          color: '#065F46',
                        }}
                        className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2"
                        onFocus={(e) => (e.target.style.borderColor = '#059669')}
                        onBlur={(e) => (e.target.style.borderColor = '#10B981')}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Contact Information Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '3px solid #059669',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
              className="rounded-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-8">
                <Phone size={28} style={{ color: '#059669' }} />
                <h3 className="text-2xl font-bold" style={{ color: '#065F46' }}>
                  Contact Information
                </h3>
              </div>

              {!editing ? (
                <div className="space-y-6">
                  <div
                    style={{ backgroundColor: '#FFD9E8' }}
                    className="p-6 rounded-xl flex items-start gap-4"
                  >
                    <Mail size={24} style={{ color: '#F59E0B' }} className="flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                        Email
                      </p>
                      <p className="text-lg font-semibold mt-1" style={{ color: '#065F46' }}>
                        {patient.email}
                      </p>
                    </div>
                  </div>
                  <div
                    style={{ backgroundColor: '#FFE4D6' }}
                    className="p-6 rounded-xl flex items-start gap-4"
                  >
                    <Phone size={24} style={{ color: '#10B981' }} className="flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                        Phone Number
                      </p>
                      <p className="text-lg font-semibold mt-1" style={{ color: '#065F46' }}>
                        {patient.phone_number || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  {patient.address && (
                    <div
                      style={{ backgroundColor: '#E8F8F5' }}
                      className="p-6 rounded-xl flex items-start gap-4"
                    >
                      <MapPin size={24} style={{ color: '#10B981' }} className="flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                          Address
                        </p>
                        <p className="text-lg font-semibold mt-1" style={{ color: '#065F46' }}>
                          {patient.address}
                          {patient.city && `, ${patient.city}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label style={{ color: '#065F46' }} className="block text-sm font-bold mb-2 uppercase tracking-wider">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleChange}
                      style={{
                        borderColor: '#10B981',
                        color: '#065F46',
                      }}
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2"
                      onFocus={(e) => (e.target.style.borderColor = '#059669')}
                      onBlur={(e) => (e.target.style.borderColor = '#10B981')}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#065F46' }} className="block text-sm font-bold mb-2 uppercase tracking-wider">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number || ''}
                      onChange={handleChange}
                      style={{
                        borderColor: '#10B981',
                        color: '#065F46',
                      }}
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2"
                      onFocus={(e) => (e.target.style.borderColor = '#059669')}
                      onBlur={(e) => (e.target.style.borderColor = '#10B981')}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#065F46' }} className="block text-sm font-bold mb-2 uppercase tracking-wider">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address || ''}
                      onChange={handleChange}
                      placeholder="123 Main Street"
                      style={{
                        borderColor: '#10B981',
                        color: '#065F46',
                      }}
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2"
                      onFocus={(e) => (e.target.style.borderColor = '#059669')}
                      onBlur={(e) => (e.target.style.borderColor = '#10B981')}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#065F46' }} className="block text-sm font-bold mb-2 uppercase tracking-wider">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city || ''}
                      onChange={handleChange}
                      placeholder="New York"
                      style={{
                        borderColor: '#10B981',
                        color: '#065F46',
                      }}
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2"
                      onFocus={(e) => (e.target.style.borderColor = '#059669')}
                      onBlur={(e) => (e.target.style.borderColor = '#10B981')}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Medical Information Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '3px solid #F59E0B',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
              className="rounded-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-8">
                <Heart size={28} style={{ color: '#F59E0B' }} />
                <h3 className="text-2xl font-bold" style={{ color: '#065F46' }}>
                  Medical Information
                </h3>
              </div>

              {!editing ? (
                <div className="space-y-6">
                  {patient.blood_type && (
                    <div
                      style={{ backgroundColor: '#FFE4D6' }}
                      className="p-5 rounded-xl"
                    >
                      <p className="text-sm font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                        Blood Type
                      </p>
                      <p className="text-2xl font-bold mt-2" style={{ color: '#065F46' }}>
                        {patient.blood_type}
                      </p>
                    </div>
                  )}
                  <div
                    style={{ backgroundColor: '#FFF4E6' }}
                    className="p-5 rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Building size={16} style={{ color: '#F59E0B' }} />
                      <p className="text-sm font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                        Department
                      </p>
                    </div>
                    <p className="text-xl font-bold mt-2" style={{ color: '#065F46' }}>
                      {patient.department_name || 'Not assigned'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label style={{ color: '#065F46' }} className="block text-sm font-bold mb-2 uppercase tracking-wider">
                      Blood Type
                    </label>
                    <select
                      name="blood_type"
                      value={formData.blood_type || ''}
                      onChange={handleChange}
                      style={{
                        borderColor: '#10B981',
                        color: formData.blood_type ? '#065F46' : '#9CA3AF',
                      }}
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2"
                      onFocus={(e) => (e.target.style.borderColor = '#059669')}
                      onBlur={(e) => (e.target.style.borderColor = '#10B981')}
                    >
                      <option value="">Select Blood Type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: '#065F46' }} className="block text-sm font-bold mb-2 uppercase tracking-wider">
                      Department
                    </label>
                    <select
                      name="department_id"
                      value={formData.department_id || ''}
                      onChange={handleChange}
                      style={{
                        borderColor: '#10B981',
                        color: formData.department_id ? '#065F46' : '#9CA3AF',
                      }}
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2"
                      onFocus={(e) => (e.target.style.borderColor = '#059669')}
                      onBlur={(e) => (e.target.style.borderColor = '#10B981')}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.department_id} value={dept.department_id}>
                          {dept.department_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Edit Actions */}
            {editing && (
              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 text-white px-6 py-4 rounded-xl font-semibold transition flex items-center justify-center gap-2 hover:shadow-lg"
                  style={{
                    backgroundColor: saving ? '#10B98166' : '#10B981',
                  }}
                >
                  <Save size={20} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 px-6 py-4 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: '#E8F8F5',
                    color: '#065F46',
                    border: '2px solid #10B981',
                  }}
                >
                  <X size={20} />
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Sidebar - Summary */}
          <div className="lg:col-span-1">
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '3px solid #10B981',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
              className="rounded-2xl p-8 sticky top-24"
            >
              <h3 className="text-2xl font-bold mb-8" style={{ color: '#065F46' }}>
                <Clipboard size={24} className="inline mr-2" />
                Profile Summary
              </h3>

              <div className="space-y-6">
                {patient.mrn && (
                  <div
                    style={{ backgroundColor: '#E8F8F5' }}
                    className="p-4 rounded-xl"
                  >
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                      Medical Record #
                    </p>
                    <p style={{ color: '#065F46' }} className="font-mono font-bold text-lg mt-2">
                      {patient.mrn}
                    </p>
                  </div>
                )}

                <div
                  style={{ backgroundColor: '#FFD9E8' }}
                  className="p-4 rounded-xl"
                >
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    Age
                  </p>
                  <p style={{ color: '#065F46' }} className="font-bold text-lg mt-2">
                    {age} years old
                  </p>
                </div>

                <div
                  style={{ backgroundColor: '#FFE4D6' }}
                  className="p-4 rounded-xl"
                >
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    Member Since
                  </p>
                  <p style={{ color: '#065F46' }} className="font-bold text-lg mt-2">
                    {patient.created_at
                      ? new Date(patient.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
