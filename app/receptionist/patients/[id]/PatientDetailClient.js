'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Loader, ArrowLeft, Edit2, X } from 'lucide-react';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];

// Helper function to safely format date for input field
function formatDateForInput(dateValue) {
  if (!dateValue) return '';
  
  // Handle Date objects
  if (dateValue instanceof Date) {
    return dateValue.toISOString().split('T')[0];
  }
  
  // Handle strings
  if (typeof dateValue === 'string') {
    // If it's already in YYYY-MM-DD format, return as-is
    if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) return dateValue;
    // If it contains 'T', extract the date part (from ISO string)
    if (dateValue.includes('T')) return dateValue.split('T')[0];
    return dateValue;
  }
  
  return '';
}

// Helper function to format date for display (consistent across server/client)
function formatDateForDisplay(dateValue) {
  if (!dateValue) return '-';
  const formatted = formatDateForInput(dateValue);
  if (!formatted) return '-';
  // Return YYYY-MM-DD format for consistency
  return formatted;
}

export default function PatientDetailClient({ patientId, initialData, initialError }) {
  const [patient, setPatient] = useState(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(initialError);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    date_of_birth: formatDateForInput(initialData?.date_of_birth),
    gender: initialData?.gender || '',
    blood_type: initialData?.blood_type || '',
    phone_number: initialData?.phone_number || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    emergency_contact: initialData?.emergency_contact || '',
    emergency_phone:initialData?.emergency_phone || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.first_name || !formData.last_name || !formData.phone_number) {
      setError('First name, last name, and phone number are required');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/receptionist/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update patient');
      }

      setPatient(result.data);
      setSuccessMessage('Patient updated successfully!');
      setSuccess(true);
      setIsEditing(false);

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (patient) {
      setFormData({
        first_name: patient.first_name || '',
        last_name: patient.last_name || '',
        date_of_birth: formatDateForInput(patient.date_of_birth),
        gender: patient.gender || '',
        blood_type: patient.blood_type || '',
        phone_number: patient.phone_number || '',
        email: patient.email || '',
        address: patient.address || '',
        city: patient.city || '',
        emergency_contact: patient.emergency_contact || '',
        emergency_phone: patient.emergency_phone || '',
      });
    }
    setError(null);
  };

  if (error && !patient) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8">
        <a
          href="/receptionist/patients"
          className="flex items-center gap-2 text-sm font-semibold mb-6 transition-all hover:gap-3"
          style={{ color: '#10B981', textDecoration: 'none' }}
        >
          <ArrowLeft size={18} />
          Back to Patients
        </a>
        <div 
          className="p-6 rounded-2xl flex gap-4 border-l-4"
          style={{ 
            backgroundColor: '#FFE4D6',
            borderColor: '#E74C3C'
          }}
        >
          <AlertCircle size={28} color="#E74C3C" className="flex-shrink-0" />
          <div>
            <p className="font-bold" style={{ color: '#C0392B' }}>
              Error Loading Patient
            </p>
            <p style={{ color: '#922B21' }} className="text-sm mt-1">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader size={40} className="animate-spin" style={{ color: '#10B981' }} />
          <p style={{ color: '#10B981' }}>Loading patient details...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8">
      {/* Header */}
      <div className="mb-8">
        <a
          href="/receptionist/patients"
          className="flex items-center gap-2 text-sm font-semibold mb-6 transition-all hover:gap-3"
          style={{ color: '#10B981', textDecoration: 'none' }}
        >
          <ArrowLeft size={18} />
          Back to Patients
        </a>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold" style={{ color: '#065F46' }}>
              {patient.first_name} {patient.last_name}
            </h1>
            <p style={{ color: '#10B981' }} className="text-sm font-semibold mt-2">
              MRN: {patient.mrn}
            </p>
            <p style={{ color: '#6B7280' }} className="text-xs mt-1">
              Patient ID: {patient.patient_id}
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2"
              style={{
                backgroundColor: '#10B981',
                color: '#FFFFFF',
              }}
            >
              <Edit2 size={18} />
              Edit Patient
            </button>
          )}
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div 
          className="mb-8 p-6 rounded-2xl flex gap-4 border-l-4"
          style={{ 
            backgroundColor: '#E8F8F5',
            borderColor: '#10B981'
          }}
        >
          <CheckCircle2 size={28} color="#10B981" className="flex-shrink-0" />
          <div>
            <p className="font-bold text-lg" style={{ color: '#065F46' }}>
              Success!
            </p>
            <p style={{ color: '#10B981' }} className="text-sm mt-1">
              {successMessage}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && !success && (
        <div 
          className="mb-8 p-6 rounded-2xl flex gap-4 border-l-4"
          style={{ 
            backgroundColor: '#FFE4D6',
            borderColor: '#E74C3C'
          }}
        >
          <AlertCircle size={28} color="#E74C3C" className="flex-shrink-0" />
          <div>
            <p className="font-bold" style={{ color: '#C0392B' }}>
              Error
            </p>
            <p style={{ color: '#922B21' }} className="text-sm mt-1">
              {error}
            </p>
          </div>
        </div>
      )}

      {!isEditing ? (
        /* View Mode */
        <div className="max-w-4xl space-y-6">
          {/* Personal Information */}
          <div 
            className="rounded-2xl p-8"
            style={{
              backgroundColor: '#F0FDF4',
              border: '1.5px solid rgba(16, 185, 129, 0.15)',
            }}
          >
            <h2 className="text-xl font-bold mb-6" style={{ color: '#065F46' }}>
              Personal Information
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: '#10B981' }}>First Name</p>
                <p className="text-lg font-medium" style={{ color: '#1F2937' }}>
                  {patient?.first_name || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: '#10B981' }}>Last Name</p>
                <p className="text-lg font-medium" style={{ color: '#1F2937' }}>
                  {patient?.last_name || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: '#10B981' }}>Date of Birth</p>
                <p className="text-lg font-medium" style={{ color: '#1F2937' }}>
                  {formatDateForDisplay(patient?.date_of_birth)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: '#10B981' }}>Gender</p>
                <p className="text-lg font-medium" style={{ color: '#1F2937' }}>
                  {patient?.gender || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: '#10B981' }}>Blood Type</p>
                <p className="text-lg font-medium" style={{ color: '#1F2937' }}>
                  {patient?.blood_type || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div 
            className="rounded-2xl p-8"
            style={{
              backgroundColor: '#F0FDF4',
              border: '1.5px solid rgba(16, 185, 129, 0.15)',
            }}
          >
            <h2 className="text-xl font-bold mb-6" style={{ color: '#065F46' }}>
              Contact Information
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: '#10B981' }}>Phone Number</p>
                <p className="text-lg font-medium" style={{ color: '#1F2937' }}>
                  {patient?.phone_number || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: '#10B981' }}>Email</p>
                <p className="text-lg font-medium" style={{ color: '#1F2937' }}>
                  {patient?.email || '-'}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold mb-1" style={{ color: '#10B981' }}>Address</p>
                <p className="text-base" style={{ color: '#1F2937' }}>
                  {patient?.address || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: '#10B981' }}>City</p>
                <p className="text-lg font-medium" style={{ color: '#1F2937' }}>
                  {patient?.city || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div 
            className="rounded-2xl p-8"
            style={{
              backgroundColor: '#F0FDF4',
              border: '1.5px solid rgba(16, 185, 129, 0.15)',
            }}
          >
            <h2 className="text-xl font-bold mb-6" style={{ color: '#065F46' }}>
              Emergency Contact
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: '#10B981' }}>Contact Name</p>
                <p className="text-lg font-medium" style={{ color: '#1F2937' }}>
                  {patient?.emergency_contact || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: '#10B981' }}>Contact Phone</p>
                <p className="text-lg font-medium" style={{ color: '#1F2937' }}>
                  {patient?.emergency_phone || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <div className="max-w-4xl">
          <div 
            className="rounded-2xl p-8"
            style={{
              backgroundColor: '#F0FDF4',
              border: '1.5px solid rgba(16, 185, 129, 0.15)',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.08)',
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information Section */}
              <div>
                <h2 className="text-xl font-bold mb-6" style={{ color: '#065F46' }}>
                  Personal Information
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
                      First Name <span style={{ color: '#E74C3C' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all"
                      style={{
                        borderColor: '#E5E7EB',
                        backgroundColor: '#FFFFFF',
                        color: '#1F2937',
                      }}
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
                      Last Name <span style={{ color: '#E74C3C' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all"
                      style={{
                        borderColor: '#E5E7EB',
                        backgroundColor: '#FFFFFF',
                        color: '#1F2937',
                      }}
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all"
                      style={{
                        borderColor: '#E5E7EB',
                        backgroundColor: '#FFFFFF',
                        color: '#1F2937',
                      }}
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all"
                      style={{
                        borderColor: '#E5E7EB',
                        backgroundColor: '#FFFFFF',
                        color: '#1F2937',
                      }}
                      disabled={saving}
                    >
                      <option value="">Select Gender</option>
                      {GENDERS.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
                      Blood Type
                    </label>
                    <select
                      name="blood_type"
                      value={formData.blood_type}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all"
                      style={{
                        borderColor: '#E5E7EB',
                        backgroundColor: '#FFFFFF',
                        color: '#1F2937',
                      }}
                      disabled={saving}
                    >
                      <option value="">Select Blood Type</option>
                      {BLOOD_TYPES.map(bt => (
                        <option key={bt} value={bt}>{bt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div>
                <h2 className="text-xl font-bold mb-6" style={{ color: '#065F46' }}>
                  Contact Information
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
                      Phone Number <span style={{ color: '#E74C3C' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all"
                      style={{
                        borderColor: '#E5E7EB',
                        backgroundColor: '#FFFFFF',
                        color: '#1F2937',
                      }}
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
                      Email (Change triggers user reassignment)
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="patient@example.com"
                      className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all"
                      style={{
                        borderColor: '#E5E7EB',
                        backgroundColor: '#FFFFFF',
                        color: '#1F2937',
                      }}
                      disabled={saving}
                    />
                    <p className="text-xs mt-1" style={{ color: '#10B981' }}>
                      💡 Changing email will find/create user if needed
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows="2"
                      className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all"
                      style={{
                        borderColor: '#E5E7EB',
                        backgroundColor: '#FFFFFF',
                        color: '#1F2937',
                      }}
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all"
                      style={{
                        borderColor: '#E5E7EB',
                        backgroundColor: '#FFFFFF',
                        color: '#1F2937',
                      }}
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div>
                <h2 className="text-xl font-bold mb-6" style={{ color: '#065F46' }}>
                  Emergency Contact
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
                      Contact Name
                    </label>
                    <input
                      type="text"
                      name="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all"
                      style={{
                        borderColor: '#E5E7EB',
                        backgroundColor: '#FFFFFF',
                        color: '#1F2937',
                      }}
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="emergency_phone"
                      value={formData.emergency_phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all"
                      style={{
                        borderColor: '#E5E7EB',
                        backgroundColor: '#FFFFFF',
                        color: '#1F2937',
                      }}
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 justify-end pt-6 border-t" style={{ borderColor: 'rgba(16, 185, 129, 0.15)' }}>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#10B981',
                    border: '2px solid #10B981',
                  }}
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                  style={{
                    backgroundColor: saving ? '#CCCCCC' : '#10B981',
                    color: '#FFFFFF',
                  }}
                >
                  {saving && <Loader size={18} className="animate-spin" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
