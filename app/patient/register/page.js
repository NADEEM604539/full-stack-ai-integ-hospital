'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const RegisterPatient = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male',
    email: '',
    phoneNumber: '',
    bloodType: '',
    departmentId: '',
    address: '',
    city: '',
    emergencyContact: '',
    emergencyPhone: '',
  });

  React.useEffect(() => {
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || 
        !formData.gender || !formData.email || !formData.phoneNumber) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/patient/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register patient');
      }

      setSuccess(true);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push(`/patient/${data.data.patient_id}/profile`);
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ backgroundColor: '#F0FDF4' }} className="min-h-screen flex items-center justify-center p-6">
        <div style={{ backgroundColor: '#FFFFFF', borderLeft: '4px solid #10B981' }} className="rounded-lg shadow-xl p-12 text-center max-w-md w-full">
          <CheckCircle size={64} style={{ color: '#10B981' }} className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold" style={{ color: '#065F46' }}>
            Registration Successful!
          </h2>
          <p style={{ color: '#10B981' }} className="mt-2 font-medium">
            Your patient profile has been created successfully.
          </p>
          <p style={{ color: '#6B7280' }} className="text-sm mt-3">
            Redirecting to profile page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#F0FDF4' }} className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <Link
          href="/patient/dashboard"
          className="flex items-center gap-2 font-medium mb-8 transition hover:opacity-80"
          style={{ color: '#10B981' }}
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>

        {/* Form Card */}
        <div style={{ backgroundColor: '#FFFFFF', borderTop: '4px solid #10B981' }} className="rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#065F46' }}>
            Register Patient
          </h1>
          <p style={{ color: '#10B981' }} className="mb-8 font-medium">
            Add a new medical profile (yourself or family member)
          </p>

          {error && (
            <div style={{ backgroundColor: '#FFD9E8', borderLeft: '4px solid #F59E0B' }} className="rounded-lg p-4 mb-6 flex gap-3">
              <AlertCircle size={20} style={{ color: '#D97706' }} className="flex-shrink-0 mt-0.5" />
              <div>
                <p style={{ color: '#065F46' }} className="font-medium">
                  {error}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#065F46' }}>
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label style={{ color: '#065F46' }} className="block text-sm font-medium mb-2">
                    First Name <span style={{ color: '#D97706' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#10B981',
                      color: '#065F46',
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-offset-0"
                    onFocus={(e) => (e.target.style.borderColor = '#059669')}
                    onBlur={(e) => (e.target.style.borderColor = '#10B981')}
                  />
                </div>
                <div>
                  <label style={{ color: '#065F46' }} className="block text-sm font-medium mb-2">
                    Last Name <span style={{ color: '#D97706' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#10B981',
                      color: '#065F46',
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-offset-0"
                    onFocus={(e) => (e.target.style.borderColor = '#059669')}
                    onBlur={(e) => (e.target.style.borderColor = '#10B981')}
                  />
                </div>
                <div>
                  <label style={{ color: '#065F46' }} className="block text-sm font-medium mb-2">
                    Date of Birth <span style={{ color: '#D97706' }}>*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#10B981',
                      color: '#065F46',
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-offset-0"
                    onFocus={(e) => (e.target.style.borderColor = '#059669')}
                    onBlur={(e) => (e.target.style.borderColor = '#10B981')}
                  />
                </div>
                <div>
                  <label style={{ color: '#065F46' }} className="block text-sm font-medium mb-2">
                    Gender <span style={{ color: '#D97706' }}>*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#10B981',
                      color: '#065F46',
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-offset-0"
                    onFocus={(e) => (e.target.style.borderColor = '#059669')}
                    onBlur={(e) => (e.target.style.borderColor = '#10B981')}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#065F46' }}>
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label style={{ color: '#065F46' }} className="block text-sm font-medium mb-2">
                    Email <span style={{ color: '#D97706' }}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#10B981',
                      color: '#065F46',
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-offset-0"
                    onFocus={(e) => (e.target.style.borderColor = '#059669')}
                    onBlur={(e) => (e.target.style.borderColor = '#10B981')}
                  />
                </div>
                <div>
                  <label style={{ color: '#065F46' }} className="block text-sm font-medium mb-2">
                    Phone <span style={{ color: '#D97706' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="+1 (234) 567-8900"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#10B981',
                      color: '#065F46',
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-offset-0"
                    onFocus={(e) => (e.target.style.borderColor = '#059669')}
                    onBlur={(e) => (e.target.style.borderColor = '#10B981')}
                  />
                </div>
                <div>
                  <label style={{ color: '#065F46' }} className="block text-sm font-medium mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Main Street"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#10B981',
                      color: '#065F46',
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-offset-0"
                    onFocus={(e) => (e.target.style.borderColor = '#059669')}
                    onBlur={(e) => (e.target.style.borderColor = '#10B981')}
                  />
                </div>
                <div>
                  <label style={{ color: '#065F46' }} className="block text-sm font-medium mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="New York"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#10B981',
                      color: '#065F46',
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-offset-0"
                    onFocus={(e) => (e.target.style.borderColor = '#059669')}
                    onBlur={(e) => (e.target.style.borderColor = '#10B981')}
                  />
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#065F46' }}>
                Medical Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label style={{ color: '#065F46' }} className="block text-sm font-medium mb-2">
                    Blood Type
                  </label>
                  <select
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleChange}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#10B981',
                      color: '#065F46',
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-offset-0"
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
                  <label style={{ color: '#065F46' }} className="block text-sm font-medium mb-2">
                    Department
                  </label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#10B981',
                      color: '#065F46',
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-offset-0"
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
                <div>
                  <label style={{ color: '#065F46' }} className="block text-sm font-medium mb-2">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#10B981',
                      color: '#065F46',
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-offset-0"
                    onFocus={(e) => (e.target.style.borderColor = '#059669')}
                    onBlur={(e) => (e.target.style.borderColor = '#10B981')}
                  />
                </div>
                <div>
                  <label style={{ color: '#065F46' }} className="block text-sm font-medium mb-2">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleChange}
                    placeholder="+1 (234) 567-8900"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#10B981',
                      color: '#065F46',
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-offset-0"
                    onFocus={(e) => (e.target.style.borderColor = '#059669')}
                    onBlur={(e) => (e.target.style.borderColor = '#10B981')}
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-8" style={{ borderTop: '1px solid #10B981' }}>
              <button
                type="button"
                onClick={() => router.back()}
                style={{
                  backgroundColor: '#E8F8F5',
                  color: '#065F46',
                  borderColor: '#10B981',
                }}
                className="flex-1 px-6 py-3 border rounded-lg font-medium transition hover:opacity-80"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#10B98166' : '#10B981',
                  color: '#FFFFFF',
                }}
                className="flex-1 px-6 py-3 rounded-lg font-medium transition hover:opacity-90"
              >
                {loading ? 'Registering...' : 'Register Patient'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPatient;
