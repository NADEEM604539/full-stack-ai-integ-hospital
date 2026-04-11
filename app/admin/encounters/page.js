'use client';

import { useEffect, useState } from 'react';

export default function EncountersPage() {
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [soapNotes, setSoapNotes] = useState({});

  useEffect(() => {
    fetchEncounters();
  }, []);

  const fetchEncounters = async () => {
    try {
      const response = await fetch('/api/admin/encounters');
      if (!response.ok) throw new Error('Failed to fetch encounters');
      
      const data = await response.json();
      setEncounters(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (encounterId) => {
    if (expandedId === encounterId) {
      setExpandedId(null);
    } else {
      // Fetch SOAP notes for this encounter if not already loaded
      if (!soapNotes[encounterId]) {
        try {
          const response = await fetch(`/api/admin/encounters/${encounterId}/soap`);
          if (response.ok) {
            const data = await response.json();
            setSoapNotes(prev => ({ ...prev, [encounterId]: data }));
          }
        } catch (err) {
          console.error('Failed to fetch SOAP notes:', err);
        }
      }
      setExpandedId(encounterId);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading encounters...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0' }}>Patient Encounters</h1>
        <p style={{ margin: 0, color: '#666' }}>View all encounters and medical notes (read-only)</p>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: '4px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflowX: 'auto'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Patient</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Doctor</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Date</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Type</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {encounters.map(encounter => (
              <tbody key={encounter.encounter_id}>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '500' }}>{encounter.patient_first_name} {encounter.patient_last_name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>MRN: {encounter.mrn}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '500' }}>{encounter.doctor_first_name || '-'} {encounter.doctor_last_name || '-'}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>{encounter.doctor_email || '-'}</div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                    {new Date(encounter.encounter_date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#E3F2FD',
                      color: '#1565C0',
                      borderRadius: '4px',
                      fontSize: '0.85rem'
                    }}>
                      {encounter.encounter_type || 'General'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: encounter.status === 'completed' ? '#E8F5E9' : '#FFF3E0',
                      color: encounter.status === 'completed' ? '#2E7D32' : '#E65100',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold'
                    }}>
                      {encounter.status?.charAt(0).toUpperCase() + encounter.status?.slice(1) || 'Open'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button
                      onClick={() => toggleExpand(encounter.encounter_id)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: expandedId === encounter.encounter_id ? '#FF9800' : '#2196F3',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      {expandedId === encounter.encounter_id ? 'Hide' : 'View'} Notes
                    </button>
                  </td>
                </tr>
                {expandedId === encounter.encounter_id && (
                  <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '1px solid #ddd' }}>
                    <td colSpan="6" style={{ padding: '1.5rem' }}>
                      <EncounterDetails encounterId={encounter.encounter_id} soapData={soapNotes[encounter.encounter_id]} />
                    </td>
                  </tr>
                )}
              </tbody>
            ))}
          </tbody>
        </table>
        {encounters.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
            No encounters found
          </div>
        )}
      </div>
    </div>
  );
}

function EncounterDetails({ encounterId, soapData }) {
  const [loading, setLoading] = useState(!soapData);

  useEffect(() => {
    if (!soapData && loading) {
      fetchSOAP();
    }
  }, []);

  const fetchSOAP = async () => {
    try {
      const response = await fetch(`/api/admin/encounters/${encounterId}/soap`);
      if (!response.ok) throw new Error('Failed to fetch SOAP notes');
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading SOAP notes...</div>;

  return (
    <div>
      <h4 style={{ marginTop: 0 }}>SOAP Notes</h4>
      {soapData ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div>
            <h5 style={{ margin: '0 0 0.5rem 0', color: '#1565C0' }}>Subjective</h5>
            <p style={{ margin: 0, padding: '1rem', backgroundColor: '#fff', borderRadius: '4px' }}>
              {soapData.subjective || 'N/A'}
            </p>
          </div>
          <div>
            <h5 style={{ margin: '0 0 0.5rem 0', color: '#1565C0' }}>Objective</h5>
            <p style={{ margin: 0, padding: '1rem', backgroundColor: '#fff', borderRadius: '4px' }}>
              {soapData.objective || 'N/A'}
            </p>
          </div>
          <div>
            <h5 style={{ margin: '0 0 0.5rem 0', color: '#1565C0' }}>Assessment</h5>
            <p style={{ margin: 0, padding: '1rem', backgroundColor: '#fff', borderRadius: '4px' }}>
              {soapData.assessment || 'N/A'}
            </p>
          </div>
          <div>
            <h5 style={{ margin: '0 0 0.5rem 0', color: '#1565C0' }}>Plan</h5>
            <p style={{ margin: 0, padding: '1rem', backgroundColor: '#fff', borderRadius: '4px' }}>
              {soapData.plan || 'N/A'}
            </p>
          </div>
        </div>
      ) : (
        <p>No SOAP notes available</p>
      )}
    </div>
  );
}
