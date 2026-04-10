'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader, ArrowLeft } from 'lucide-react';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];

export default function RegisterPatientPage() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    blood_type: '',
    phone_number: '',
    email: '',
    address: '',
    city: '',
    emergency_contact: '',
    emergency_phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

    // Validation
    if (!formData.first_name || !formData.last_name || !formData.phone_number || !formData.date_of_birth || !formData.gender) {
      setError('Please fill in all required fields (first name, last name, phone, DOB, gender)');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/receptionist/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to register patient');
      }

      if (result.success) {
        setSuccessMessage(`Patient registered successfully! MRN: ${result.data.mrn}`);
        setSuccess(true);
        setFormData({
          first_name: '',
          last_name: '',
          date_of_birth: '',
          gender: '',
          blood_type: '',
          phone_number: '',
          email: '',
          address: '',
          city: '',
          emergency_contact: '',
          emergency_phone: '',
        });

        // Redirect after 2 seconds
        setTimeout(() => {
          window.location.href = '/receptionist/patients';
        }, 2000);
      } else {
        setError(result.error || 'Failed to register patient');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
        <div>
          <h1 className="text-4xl font-bold" style={{ color: '#065F46' }}>
            Register New Patient
          </h1>
          <p style={{ color: '#10B981' }} className="text-sm font-semibold mt-2">
            Please fill in the patient information below
          </p>
        </div>
      </div>

      {/* Success State */}
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
              Patient Registered Successfully!
            </p>
            <p style={{ color: '#10B981' }} className="text-sm mt-1">
              {successMessage}
            </p>
            <p style={{ color: '#10B981' }} className="text-xs mt-2">
              Redirecting to patient list...
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
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
              Registration Failed
            </p>
            <p style={{ color: '#922B21' }} className="text-sm mt-1">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Form Container */}
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
                    placeholder="Enter first name"
                    className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all"
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                    }}
                    disabled={loading}
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
                    placeholder="Enter last name"
                    className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all"
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                    }}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
                    Date of Birth <span style={{ color: '#E74C3C' }}>*</span>
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
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
                    Gender <span style={{ color: '#E74C3C' }}>*</span>
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
                    disabled={loading}
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
                    disabled={loading}
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
                    placeholder="Enter phone number"
                    className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all"
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                    }}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all"
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                    }}
                    disabled={loading}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter address"
                    rows="2"
                    className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all"
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                    }}
                    disabled={loading}
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
                    placeholder="Enter city"
                    className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all"
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                    }}
                    disabled={loading}
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
                    placeholder="Enter emergency contact name"
                    className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all"
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                    }}
                    disabled={loading}
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
                    placeholder="Enter emergency contact phone"
                    className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all"
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                    }}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 justify-end pt-6 border-t" style={{ borderColor: 'rgba(16, 185, 129, 0.15)' }}>
              <a
                href="/receptionist/patients"
                className="px-6 py-3 rounded-lg font-semibold transition-all"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#10B981',
                  border: '2px solid #10B981',
                  textDecoration: 'none',
                }}
              >
                Cancel
              </a>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                style={{
                  backgroundColor: loading ? '#CCCCCC' : '#10B981',
                  color: '#FFFFFF',
                }}
              >
                {loading && <Loader size={18} className="animate-spin" />}
                {loading ? 'Registering...' : 'Register Patient'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
