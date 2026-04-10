'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Loader, AlertCircle, Phone, Mail, MapPin, User, Calendar, Heart, AlertTriangle } from 'lucide-react';

export default function DoctorPatientsClient() {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedPatients, setDisplayedPatients] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const LIMIT = 10;

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredPatients(
        patients.filter(p =>
          p.first_name.toLowerCase().includes(query) ||
          p.last_name.toLowerCase().includes(query) ||
          p.mrn.includes(query) ||
          (p.phone_number && p.phone_number.includes(query))
        )
      );
    }
    setOffset(0);
    setDisplayedPatients([]);
  }, [searchQuery, patients]);

  useEffect(() => {
    if (displayedPatients.length === 0 && filteredPatients.length > 0) {
      const nextPatients = filteredPatients.slice(0, LIMIT);
      setDisplayedPatients(nextPatients);
      setHasMore(filteredPatients.length > LIMIT);
    }
  }, [filteredPatients]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/doctor/patients');
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }

      const result = await response.json();
      setPatients(result.data || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSeeMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      const newOffset = offset + LIMIT;
      const nextPatients = filteredPatients.slice(0, newOffset + LIMIT);
      setDisplayedPatients(nextPatients);
      setOffset(newOffset);
      setHasMore(filteredPatients.length > newOffset + LIMIT);
      setLoadingMore(false);
    }, 300);
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} color="#3B82F6" className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }} className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold" style={{ color: '#1E40AF' }}>
          My Patients
        </h1>
        <p style={{ color: '#3B82F6' }} className="text-sm mt-2">
          View and manage your patients
        </p>
      </div>

      <div className="mb-8 max-w-2xl">
        <div className="relative">
          <Search size={20} style={{ color: '#9CA3AF' }} className="absolute left-4 top-4" />
          <input
            type="text"
            placeholder="Search by name, MRN, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-3 rounded-lg border-2 outline-none"
            style={{
              borderColor: '#E5E7EB',
              backgroundColor: '#FFFFFF',
              color: '#1F2937',
            }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-8 p-6 rounded-2xl flex gap-4 border-l-4" style={{ backgroundColor: '#FFE4D6', borderColor: '#E74C3C' }}>
          <AlertCircle size={24} color="#E74C3C" />
          <div>
            <p className="font-bold" style={{ color: '#C0392B' }}>Error</p>
            <p style={{ color: '#922B21' }} className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {displayedPatients.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: '#FFFFFF' }}>
          <Users size={48} color="#D1D5DB" className="mx-auto mb-4" />
          <p style={{ color: '#6B7280' }} className="text-lg font-semibold">No patients found</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 mb-12">
            {displayedPatients.map(patient => {
              // Calculate age from date of birth
              const calculateAge = (dob) => {
                if (!dob) return null;
                const today = new Date();
                const birthDate = new Date(dob);
                let age = today.getFullYear() - birthDate.getFullYear();
                const month = today.getMonth() - birthDate.getMonth();
                if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
                  age--;
                }
                return age;
              };

              const age = calculateAge(patient.date_of_birth);
              const formattedDOB = patient.date_of_birth 
                ? new Date(patient.date_of_birth).toLocaleDateString()
                : 'N/A';

              return (
                <div
                  key={patient.patient_id}
                  className="p-6 rounded-lg transition-all hover:shadow-lg hover:scale-[1.01]"
                  style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}
                >
                  {/* Header: Name and MRN */}
                  <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold" style={{ color: '#1E40AF' }}>
                        {patient.first_name} {patient.last_name}
                      </h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                          MRN: {patient.mrn}
                        </span>
                        {patient.gender && (
                          <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: '#F0FDF4', color: '#166534' }}>
                            {patient.gender === 'M' || patient.gender === 'Male' ? '👨 Male' : patient.gender === 'F' || patient.gender === 'Female' ? '👩 Female' : patient.gender}
                          </span>
                        )}
                        {age && (
                          <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                            {age} years old
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Two-column details layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Contact Information */}
                    <div>
                      <h4 className="font-bold text-sm mb-3" style={{ color: '#4B5563' }}>📞 Contact Information</h4>
                      <div className="space-y-2">
                        {patient.phone_number && (
                          <div className="flex items-center gap-3">
                            <Phone size={18} style={{ color: '#3B82F6' }} className="flex-shrink-0" />
                            <div>
                              <p className="text-xs" style={{ color: '#9CA3AF' }}>Phone</p>
                              <span className="text-sm font-semibold" style={{ color: '#1F2937' }}>{patient.phone_number}</span>
                            </div>
                          </div>
                        )}
                        {patient.email && (
                          <div className="flex items-center gap-3">
                            <Mail size={18} style={{ color: '#3B82F6' }} className="flex-shrink-0" />
                            <div>
                              <p className="text-xs" style={{ color: '#9CA3AF' }}>Email</p>
                              <span className="text-sm font-semibold break-all" style={{ color: '#1F2937' }}>{patient.email}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Personal Information */}
                    <div>
                      <h4 className="font-bold text-sm mb-3" style={{ color: '#4B5563' }}>👤 Personal Information</h4>
                      <div className="space-y-2">
                        {patient.date_of_birth && (
                          <div className="flex items-center gap-3">
                            <Calendar size={18} style={{ color: '#8B5CF6' }} className="flex-shrink-0" />
                            <div>
                              <p className="text-xs" style={{ color: '#9CA3AF' }}>Date of Birth</p>
                              <span className="text-sm font-semibold" style={{ color: '#1F2937' }}>{formattedDOB}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address Section */}
                  {(patient.address || patient.city) && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-bold text-sm mb-3" style={{ color: '#4B5563' }}>📍 Address</h4>
                      <div className="flex items-start gap-3">
                        <MapPin size={18} style={{ color: '#EF4444' }} className="flex-shrink-0 mt-1" />
                        <div>
                          {patient.address && (
                            <p className="text-sm" style={{ color: '#1F2937' }}>{patient.address}</p>
                          )}
                          {patient.city && (
                            <p className="text-sm" style={{ color: '#6B7280' }}>{patient.city}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Emergency Contact Section */}
                  {(patient.emergency_contact || patient.emergency_phone) && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: '#DC2626' }}>
                        <AlertTriangle size={18} />
                        Emergency Contact
                      </h4>
                      <div className="space-y-2">
                        {patient.emergency_contact && (
                          <div className="flex items-center gap-3">
                            <User size={18} style={{ color: '#6366F1' }} className="flex-shrink-0" />
                            <div>
                              <p className="text-xs" style={{ color: '#9CA3AF' }}>Name</p>
                              <span className="text-sm font-semibold" style={{ color: '#1F2937' }}>{patient.emergency_contact}</span>
                            </div>
                          </div>
                        )}
                        {patient.emergency_phone && (
                          <div className="flex items-center gap-3">
                            <Phone size={18} style={{ color: '#6366F1' }} className="flex-shrink-0" />
                            <div>
                              <p className="text-xs" style={{ color: '#9CA3AF' }}>Phone</p>
                              <span className="text-sm font-semibold" style={{ color: '#1F2937' }}>{patient.emergency_phone}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <button
                onClick={handleSeeMore}
                disabled={loadingMore}
                className="px-8 py-3 rounded-lg font-semibold transition-all hover:shadow-lg disabled:opacity-50"
                style={{
                  backgroundColor: '#3B82F6',
                  color: '#FFFFFF',
                }}
              >
                {loadingMore ? 'Loading...' : `See More (${filteredPatients.length - displayedPatients.length} remaining)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
