'use client';

import { useState, useEffect } from 'react';
import { FileText, Loader, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DoctorEncountersClient() {
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEncounters();
  }, []);

  const fetchEncounters = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/doctor/encounters');
      if (!response.ok) {
        throw new Error('Failed to fetch encounters');
      }

      const result = await response.json();
      setEncounters(result.data || []);
    } catch (err) {
      console.error('Error fetching encounters:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} color="#3B82F6" className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading encounters...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }} className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold" style={{ color: '#1E40AF' }}>
          Patient Encounters
        </h1>
        <p style={{ color: '#3B82F6' }} className="text-sm mt-2">
          View and manage patient encounters and SOAP notes
        </p>
      </div>

      {error && (
        <div className="p-6 rounded-2xl flex gap-4 border-l-4" style={{ backgroundColor: '#FFE4D6', borderColor: '#E74C3C' }}>
          <AlertCircle size={24} color="#E74C3C" />
          <div>
            <p className="font-bold" style={{ color: '#C0392B' }}>Error</p>
            <p style={{ color: '#922B21' }} className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {encounters.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: '#FFFFFF' }}>
          <FileText size={48} color="#D1D5DB" className="mx-auto mb-4" />
          <p style={{ color: '#6B7280' }} className="text-lg font-semibold">No encounters yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {encounters.map((encounter) => (
            <div
              key={encounter.encounter_id}
              className="p-6 rounded-lg transition-all hover:shadow-lg"
              style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB', borderLeft: '4px solid #3B82F6' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="text-xl font-bold" style={{ color: '#1E40AF' }}>
                      {encounter.patient_first_name && encounter.patient_last_name 
                        ? `${encounter.patient_first_name} ${encounter.patient_last_name}` 
                        : encounter.patient_id ? `Patient ID: ${encounter.patient_id}` : 'Unknown Patient'}
                    </p>
                    <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-600">
                      MRN: {encounter.mrn || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>Encounter Type</p>
                      <p className="text-md font-medium" style={{ color: '#374151' }}>
                        {encounter.encounter_type || 'General'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>Date</p>
                      <p className="text-md font-medium" style={{ color: '#374151' }}>
                        {encounter.admission_date ? new Date(encounter.admission_date).toLocaleDateString() : 'No date'}
                        {encounter.discharge_date && ` - ${new Date(encounter.discharge_date).toLocaleDateString()}`}
                      </p>
                    </div>
                    
                    {encounter.chief_complaint && (
                      <div className="md:col-span-2">
                        <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>Chief Complaint</p>
                        <p className="text-md mt-1 italic" style={{ color: '#4B5563' }}>
                          "{encounter.chief_complaint}"
                        </p>
                      </div>
                    )}
                  </div>

                  <span
                    className="inline-block mt-4 px-3 py-1 rounded-lg text-xs font-bold"
                    style={{
                      backgroundColor: encounter.status === 'Active' ? '#D1FAE5' : '#F3F4F6',
                      color: encounter.status === 'Active' ? '#065F46' : '#374151',
                    }}
                  >
                    {encounter.status || 'Unknown'}
                  </span>
                </div>
                
                <div className="flex flex-col items-end ml-4 gap-2">
                  <Link
                    href={`/doctor/encounters/${encounter.encounter_id}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all"
                    style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1D4ED8')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2563EB')}
                  >
                    View Details
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
