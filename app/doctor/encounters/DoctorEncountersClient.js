'use client';

import { useState, useEffect } from 'react';
import { FileText, Loader, AlertCircle } from 'lucide-react';

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
                  <p className="font-bold" style={{ color: '#6B7280' }}>Patient ID: {encounter.patient_id}</p>
                  <p className="text-lg font-bold mt-2" style={{ color: '#1E40AF' }}>
                    {encounter.encounter_type} Encounter
                  </p>
                  <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
                    {new Date(encounter.admission_date).toLocaleDateString()}
                  </p>
                  <span
                    className="inline-block mt-2 px-3 py-1 rounded-lg text-xs font-bold"
                    style={{
                      backgroundColor: '#D1FAE5',
                      color: '#065F46',
                    }}
                  >
                    {encounter.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
