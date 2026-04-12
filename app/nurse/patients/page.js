'use client';

import React, { useState, useEffect } from 'react';
import { Users, Loader, AlertCircle, ChevronLeft, Heart, Calendar, Droplet, Activity } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const NursePatientsPage = () => {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/nurse/patients');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch patients');
      }

      const data = await response.json();
      setPatients(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.mrn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} color="#8B5CF6" className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading patients...</p>
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
        <div className="max-w-7xl mx-auto px-6 py-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-purple-100 hover:text-white transition mb-6 font-semibold"
          >
            <ChevronLeft size={20} />
            Back
          </button>
          <h1 className="text-5xl font-bold text-white mb-2">
            Assigned Patients
          </h1>
          <p className="text-purple-100 text-lg">
            View and manage patients in your department
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search by patient name or MRN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              backgroundColor: '#F9FAFB',
              border: '2px solid #E5E7EB',
            }}
            className="w-full px-6 py-3 rounded-xl focus:outline-none focus:border-purple-400 transition"
          />
        </div>

        {/* Error Message */}
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
                Error Loading Patients
              </h3>
              <p style={{ color: '#065F46' }} className="text-sm mt-1">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredPatients.length === 0 && !loading && (
          <div
            style={{
              backgroundColor: '#F3F0FF',
              border: '3px solid #8B5CF6',
            }}
            className="rounded-2xl shadow-md p-16 text-center"
          >
            <Users
              size={64}
              style={{ color: '#8B5CF6' }}
              className="mx-auto mb-6"
            />
            <h3 className="text-2xl font-bold" style={{ color: '#5B21B6' }}>
              No Patients Found
            </h3>
            <p style={{ color: '#8B5CF6' }} className="mt-3 text-lg">
              There are no patients assigned to your department yet.
            </p>
          </div>
        )}

        {/* Patients List */}
        {filteredPatients.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold" style={{ color: '#1F2937' }}>
              Total Patients: {filteredPatients.length}
            </h2>

            {filteredPatients.map((patient, idx) => {
              const colors = [
                { border: '#8B5CF6', bg: '#F3F0FF', text: '#5B21B6' },
                { border: '#EC4899', bg: '#FDF2F8', text: '#BE185D' },
                { border: '#F59E0B', bg: '#FFFBF0', text: '#B45309' },
                { border: '#06B6D4', bg: '#ECFDF5', text: '#0E7490' },
              ];
              const color = colors[idx % colors.length];

              return (
                <div
                  key={patient.patient_id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: `3px solid ${color.border}`,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  }}
                  className="rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 p-8"
                >
                  <div className="flex flex-col lg:flex-row gap-8 justify-between items-start lg:items-center">
                    {/* Patient Info */}
                    <div className="flex-1">
                      <div className="mb-4">
                        <h3 className="text-3xl font-bold" style={{ color: '#1F2937' }}>
                          {patient.full_name}
                        </h3>
                        <p style={{ color: '#6B7280' }} className="text-sm mt-1">
                          MRN: {patient.mrn}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        {/* Age */}
                        <div>
                          <p style={{ color: '#6B7280' }} className="text-xs font-semibold uppercase">
                            Age
                          </p>
                          <p className="text-lg font-bold mt-1" style={{ color: color.text }}>
                            {patient.age} years
                          </p>
                        </div>

                        {/* Gender */}
                        <div>
                          <p style={{ color: '#6B7280' }} className="text-xs font-semibold uppercase">
                            Gender
                          </p>
                          <p className="text-lg font-bold mt-1" style={{ color: color.text }}>
                            {patient.gender}
                          </p>
                        </div>

                        {/* Blood Type */}
                        <div>
                          <p style={{ color: '#6B7280' }} className="text-xs font-semibold uppercase">
                            Blood Type
                          </p>
                          <p className="text-lg font-bold mt-1" style={{ color: color.text }}>
                            {patient.blood_type || 'N/A'}
                          </p>
                        </div>

                        {/* Encounters */}
                        <div>
                          <p style={{ color: '#6B7280' }} className="text-xs font-semibold uppercase">
                            Encounters
                          </p>
                          <p className="text-lg font-bold mt-1" style={{ color: color.text }}>
                            {patient.total_encounters}
                          </p>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {patient.email && (
                          <div>
                            <p style={{ color: '#6B7280' }} className="text-sm">
                              📧 {patient.email}
                            </p>
                          </div>
                        )}
                        {patient.phone_number && (
                          <div>
                            <p style={{ color: '#6B7280' }} className="text-sm">
                              📱 {patient.phone_number}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full lg:w-auto flex flex-col gap-3">
                      <Link
                        href={`/nurse/encounters?patientId=${patient.patient_id}`}
                        style={{
                          backgroundColor: color.border,
                          color: '#FFFFFF',
                        }}
                        className="px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition text-center flex items-center justify-center gap-2"
                      >
                        <Activity size={18} />
                        View Encounters
                      </Link>
                      <Link
                        href={`/nurse/patients/${patient.patient_id}/medical-history`}
                        style={{
                          backgroundColor: color.border,
                          color: '#FFFFFF',
                        }}
                        className="px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition text-center flex items-center justify-center gap-2"
                      >
                        <Calendar size={18} />
                        Medical History
                      </Link>
                      <Link
                        href={`/nurse/vitals?patientId=${patient.patient_id}`}
                        style={{
                          backgroundColor: `${color.border}20`,
                          color: color.border,
                          border: `2px solid ${color.border}`,
                        }}
                        className="px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition text-center flex items-center justify-center gap-2"
                      >
                        <Heart size={18} />
                        Record Vitals
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NursePatientsPage;
