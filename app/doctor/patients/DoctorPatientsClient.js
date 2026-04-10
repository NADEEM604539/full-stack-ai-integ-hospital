'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Loader, AlertCircle, Phone, Mail } from 'lucide-react';

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
          <div className="grid gap-4 mb-12">
            {displayedPatients.map(patient => (
              <div
                key={patient.patient_id}
                className="p-6 rounded-lg transition-all hover:shadow-lg"
                style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold" style={{ color: '#1E40AF' }}>
                      {patient.first_name} {patient.last_name}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
                      MRN: {patient.mrn}
                    </p>
                    <div className="flex gap-4 mt-3">
                      {patient.phone_number && (
                        <div className="flex items-center gap-2">
                          <Phone size={16} style={{ color: '#3B82F6' }} />
                          <span className="text-sm" style={{ color: '#6B7280' }}>{patient.phone_number}</span>
                        </div>
                      )}
                      {patient.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={16} style={{ color: '#3B82F6' }} />
                          <span className="text-sm" style={{ color: '#6B7280' }}>{patient.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
