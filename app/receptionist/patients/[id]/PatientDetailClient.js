'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader, ArrowLeft, Edit2, X, AlertTriangle } from 'lucide-react';

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
  const router = useRouter();
  const [patient, setPatient] = useState(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(initialError);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [departments, setDepartments] = useState([]);
  const [showDepartmentWarning, setShowDepartmentWarning] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

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
    emergency_phone: initialData?.emergency_phone || '',
    department_id: initialData?.department_id || '',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

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

    // Check if department is changing
    if (formData.department_id && formData.department_id !== patient?.department_id) {
      setPendingFormData(formData);
      setShowDepartmentWarning(true);
      return;
    }

    await submitPatientUpdate(formData);
  };

  const submitPatientUpdate = async (dataToSubmit) => {
    try {
      setSaving(true);
      setShowDepartmentWarning(false);

      const response = await fetch(`/api/receptionist/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update patient');
      }

      setPatient(result.data);
      setSuccessMessage('Patient updated successfully!');
      setSuccess(true);
      setIsEditing(false);
      setPendingFormData(null);

      // Check if department was changed
      const departmentChanged = dataToSubmit.department_id && dataToSubmit.department_id !== patient?.department_id;

      // If department changed, redirect to patients list after showing success message
      if (departmentChanged) {
        setTimeout(() => {
          router.push('/receptionist/patients');
        }, 2000);
      } else {
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      }
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
        department_id: patient.department_id || '',
      });
    }
    setError(null);
    setShowDepartmentWarning(false);
    setPendingFormData(null);
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

              {/* Department Section */}
              <div>
                <h2 className="text-xl font-bold mb-6" style={{ color: '#065F46' }}>
                  Department Assignment
                </h2>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
                    Department
                  </label>
                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all"
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                    }}
                    disabled={saving}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.department_id} value={dept.department_id}>
                        {dept.department_name}
                      </option>
                    ))}
                  </select>
                  {formData.department_id && formData.department_id !== patient?.department_id && (
                    <p className="text-xs mt-2" style={{ color: '#F59E0B' }}>
                      ⚠️ Changing department will affect access. You'll receive a confirmation warning.
                    </p>
                  )}
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

      {/* Department Change Warning Modal */}
      {showDepartmentWarning && pendingFormData && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #E67E22 100%)',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <AlertTriangle size={28} color="#FFFFFF" />
              <h2 style={{ color: '#FFFFFF', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                Department Change Warning
              </h2>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: '#1F2937', marginBottom: '12px' }}>
                  You are changing the patient's department from:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div
                    style={{
                      backgroundColor: '#F0FDF4',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #10B981',
                    }}
                  >
                    <p style={{ color: '#6B7280', fontSize: '12px', margin: '0 0 4px 0' }}>Current Department</p>
                    <p style={{ color: '#065F46', fontWeight: 'bold', margin: 0 }}>
                      {departments?.find(d => d.department_id === patient?.department_id)?.department_name || 'N/A'}
                    </p>
                  </div>
                  <div
                    style={{
                      backgroundColor: '#FEF3C7',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #F59E0B',
                    }}
                  >
                    <p style={{ color: '#6B7280', fontSize: '12px', margin: '0 0 4px 0' }}>New Department</p>
                    <p style={{ color: '#92400E', fontWeight: 'bold', margin: 0 }}>
                      {departments?.find(d => d.department_id === pendingFormData.department_id)?.department_name || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '2px solid #FCA5A5',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '20px',
                }}
              >
                <p style={{ color: '#92400B', fontSize: '14px', fontWeight: '500', margin: '0 0 12px 0' }}>
                  ⚠️ Important Consequences:
                </p>
                <ul style={{ color: '#7F1D1D', fontSize: '14px', margin: '0', paddingLeft: '20px' }}>
                  <li>You will <strong>lose access</strong> to this patient after the change</li>
                  <li>Doctors in the old department will <strong>lose access</strong> to this patient's records</li>
                  <li>Only staff in the new department will be able to access this patient</li>
                  <li>Contact the new department or admin to regain access</li>
                </ul>
              </div>

              <p style={{ color: '#6B7280', fontSize: '13px', margin: '0 0 20px 0', fontStyle: 'italic' }}>
                If you need to transfer this patient back, you must contact the admin or the new department's receptionist.
              </p>
            </div>

            {/* Actions */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #E5E7EB',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => {
                  setShowDepartmentWarning(false);
                  setPendingFormData(null);
                }}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#FFFFFF',
                  color: '#065F46',
                  border: '2px solid #10B981',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => submitPatientUpdate(pendingFormData)}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  backgroundColor: saving ? '#CCCCCC' : '#E74C3C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {saving && <Loader size={16} className="animate-spin" />}
                {saving ? 'Processing...' : 'Yes, Change Department'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
