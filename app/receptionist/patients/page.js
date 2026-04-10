'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Phone, Mail, MapPin, AlertCircle, Loader } from 'lucide-react';

export default function ReceptionistPatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchPatients() {
      try {
        setLoading(true);
        setError(null);

        // Fetch patients from receptionist service with department filtering
        const response = await fetch('/api/receptionist/patients?limit=100&offset=0');
        
        if (!response.ok) {
          throw new Error(response.status === 403 ? 'Access Denied' : 'Failed to fetch patients');
        }

        const result = await response.json();
        if (result.success) {
          setPatients(result.data || []);
          setFilteredPatients(result.data || []);
        } else {
          setError(result.error || 'Failed to load patients');
        }
      } catch (err) {
        console.error('Patients fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPatients();
  }, []);

  // Search and filter
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPatients(patients);
      setCurrentPage(1);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = patients.filter(patient =>
        patient.first_name?.toLowerCase().includes(term) ||
        patient.last_name?.toLowerCase().includes(term) ||
        patient.mrn?.toLowerCase().includes(term) ||
        patient.phone_number?.includes(term) ||
        patient.email?.toLowerCase().includes(term)
      );
      setFilteredPatients(filtered);
      setCurrentPage(1);
    }
  }, [searchTerm, patients]);

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedPatients = filteredPatients.slice(startIdx, startIdx + itemsPerPage);

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8">
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <Loader size={32} className="animate-spin mx-auto mb-4" style={{ color: '#10B981' }} />
            <p style={{ color: '#10B981' }} className="font-medium">Loading patients...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#065F46' }}>
              Patient Management
            </h1>
            <p style={{ color: '#10B981' }} className="text-sm font-semibold">
              Total Patients: {filteredPatients.length}
            </p>
          </div>
          <a
            href="/receptionist/patients/register"
            className="px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg flex items-center gap-2"
            style={{
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              textDecoration: 'none',
            }}
          >
            <Plus size={18} />
            Register New Patient
          </a>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2" style={{ color: '#10B981' }}>
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Search by name, MRN, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 outline-none transition-all"
            style={{
              borderColor: searchTerm ? '#10B981' : '#E5E7EB',
              backgroundColor: '#F9FAFB',
            }}
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div 
          className="mb-6 p-5 rounded-xl flex gap-4 border-l-4"
          style={{ 
            backgroundColor: '#FFE4D6',
            borderColor: '#E74C3C'
          }}
        >
          <AlertCircle size={24} color="#E74C3C" />
          <div>
            <p className="font-bold" style={{ color: '#C0392B' }}>
              Error Loading Patients
            </p>
            <p style={{ color: '#922B21' }} className="text-sm mt-1">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Patients Table */}
      {filteredPatients.length > 0 ? (
        <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'rgba(16, 185, 129, 0.15)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: '#F0FDF4' }}>
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold" style={{ color: '#065F46', borderBottom: '2px solid rgba(16, 185, 129, 0.15)' }}>
                    Patient Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold" style={{ color: '#065F46', borderBottom: '2px solid rgba(16, 185, 129, 0.15)' }}>
                    MRN
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold" style={{ color: '#065F46', borderBottom: '2px solid rgba(16, 185, 129, 0.15)' }}>
                    Date of Birth
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold" style={{ color: '#065F46', borderBottom: '2px solid rgba(16, 185, 129, 0.15)' }}>
                    Contact Info
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold" style={{ color: '#065F46', borderBottom: '2px solid rgba(16, 185, 129, 0.15)' }}>
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold" style={{ color: '#065F46', borderBottom: '2px solid rgba(16, 185, 129, 0.15)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedPatients.map((patient, idx) => (
                  <tr
                    key={patient.patient_id}
                    className="border-b hover:bg-green-50 transition-colors"
                    style={{ borderColor: 'rgba(16, 185, 129, 0.1)' }}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold" style={{ color: '#065F46' }}>
                          {patient.first_name} {patient.last_name}
                        </p>
                        <p style={{ color: '#10B981' }} className="text-xs">
                          {patient.gender} • {patient.blood_type}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-mono text-sm font-semibold" style={{ color: '#059669' }}>
                        {patient.mrn}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p style={{ color: '#374151' }} className="text-sm">
                        {new Date(patient.date_of_birth).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Phone size={14} color="#10B981" />
                          <p style={{ color: '#374151' }} className="text-sm">
                            {patient.phone_number}
                          </p>
                        </div>
                        {patient.email && (
                          <div className="flex items-center gap-2">
                            <Mail size={14} color="#10B981" />
                            <p style={{ color: '#374151' }} className="text-xs">
                              {patient.email}
                            </p>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: patient.is_active ? '#E8F8F5' : '#FFE4D6',
                          color: patient.is_active ? '#10B981' : '#E74C3C',
                        }}
                      >
                        {patient.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <a
                        href={`/receptionist/patients/${patient.patient_id}`}
                        className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-md"
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          color: '#10B981',
                          textDecoration: 'none',
                        }}
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 flex justify-between items-center" style={{ borderTop: '1px solid rgba(16, 185, 129, 0.15)', backgroundColor: '#F9FAFB' }}>
              <p style={{ color: '#374151' }} className="text-sm">
                Page {currentPage} of {totalPages} ({filteredPatients.length} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: currentPage === 1 ? '#E5E7EB' : '#10B981',
                    color: currentPage === 1 ? '#9CA3AF' : '#FFFFFF',
                  }}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: currentPage === totalPages ? '#E5E7EB' : '#10B981',
                    color: currentPage === totalPages ? '#9CA3AF' : '#FFFFFF',
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div 
          className="p-12 rounded-2xl text-center border-2"
          style={{ 
            backgroundColor: '#F9FAFB',
            borderColor: 'rgba(16, 185, 129, 0.15)',
            borderStyle: 'dashed'
          }}
        >
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
          >
            <AlertCircle size={28} color="#10B981" />
          </div>
          <p className="text-lg font-semibold mb-2" style={{ color: '#065F46' }}>
            {searchTerm ? 'No patients found' : 'No patients yet'}
          </p>
          <p style={{ color: '#10B981' }} className="text-sm mb-6">
            {searchTerm 
              ? 'Try adjusting your search criteria' 
              : 'Register your first patient to get started'}
          </p>
          <a
            href="/receptionist/patients/register"
            className="px-6 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-md inline-block"
            style={{
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              textDecoration: 'none',
            }}
          >
            Register Patient
          </a>
        </div>
      )}
    </div>
  );
}
