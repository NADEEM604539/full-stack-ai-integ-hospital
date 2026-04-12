'use client';

import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

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

  if (loading) return <div style={{ padding: '2rem', color: '#065F46' }}>Loading encounters...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', color: '#065F46' }}>Patient Encounters</h1>
        <p style={{ margin: 0, color: '#6B7280' }}>View all encounters and medical notes (read-only)</p>
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
            <tr style={{ backgroundColor: '#F0FDF4', borderBottom: '2px solid rgba(16, 185, 129, 0.15)' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Patient</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Doctor</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Date</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Type</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Patient Satisfaction</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {encounters.map(encounter => (
              <React.Fragment key={encounter.encounter_id}>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1rem', color: '#065F46' }}>
                    <div style={{ fontWeight: '500', color: '#065F46' }}>{encounter.patient_first_name} {encounter.patient_last_name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>MRN: {encounter.mrn}</div>
                  </td>
                  <td style={{ padding: '1rem', color: '#065F46' }}>
                    <div style={{ fontWeight: '500', color: '#065F46' }}>{encounter.doctor_first_name || '-'} {encounter.doctor_last_name || '-'}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>{encounter.doctor_email || '-'}</div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#065F46' }}>
                    {new Date(encounter.admission_date).toLocaleDateString()}
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
                    {encounter.satisfaction_rating ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.2rem' }}>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              size={16}
                              fill={i <= Math.round(parseFloat(encounter.satisfaction_rating)) ? '#FBBF24' : '#E5E7EB'}
                              color={i <= Math.round(parseFloat(encounter.satisfaction_rating)) ? '#FBBF24' : '#D1D5DB'}
                              style={{ cursor: 'pointer' }}
                            />
                          ))}
                        </div>
                        <span style={{ fontWeight: 'bold', color: '#D97706', fontSize: '0.9rem' }}>
                          {parseFloat(encounter.satisfaction_rating).toFixed(1)}/5
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>Not rated</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: encounter.status === 'Completed' ? '#E8F5E9' : '#FFF3E0',
                      color: encounter.status === 'Completed' ? '#2E7D32' : '#E65100',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold'
                    }}>
                      {encounter.status || 'Active'}
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
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {encounters.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
            No encounters found
          </div>
        )}
      </div>
    </div>
  );
}

function EncounterDetails({ encounterId, soapData: initialSoapData }) {
  const [soapData, setSoapData] = useState(initialSoapData);
  const [loading, setLoading] = useState(!initialSoapData);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch if we don't have initial data
    if (!initialSoapData) {
      fetchSOAP();
    }
  }, [encounterId, initialSoapData]);

  const fetchSOAP = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/encounters/${encounterId}/soap`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setSoapData(data);
    } catch (err) {
      console.error('Error fetching SOAP notes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '1rem', color: '#065F46' }}>Loading SOAP notes...</div>;
  if (error) return <div style={{ padding: '1rem', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: '4px' }}>Error: {error}</div>;

  return (
    <div>
      <h4 style={{ marginTop: 0, color: '#065F46' }}>SOAP Notes</h4>
      {soapData ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div>
            <h5 style={{ margin: '0 0 0.5rem 0', color: '#1565C0' }}>Subjective</h5>
            <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '4px', fontSize: '0.9rem', color: '#000' }}>
              {soapData.subjective ? (
                <>
                  <p><strong>Complaint:</strong> {soapData.subjective.patient_complaint || 'N/A'}</p>
                  <p><strong>Duration:</strong> {soapData.subjective.symptom_duration || 'N/A'}</p>
                  <p><strong>Severity:</strong> {soapData.subjective.severity_level || 'N/A'}/10</p>
                </>
              ) : 'N/A'}
            </div>
          </div>
          <div>
            <h5 style={{ margin: '0 0 0.5rem 0', color: '#1565C0' }}>Objective</h5>
            <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '4px', fontSize: '0.9rem', color: '#000' }}>
              {soapData.objective ? (
                <>
                  <p><strong>Examination:</strong> {soapData.objective.physical_examination || 'N/A'}</p>
                  <p><strong>Labs:</strong> {soapData.objective.lab_findings || 'N/A'}</p>
                  <p><strong>Imaging:</strong> {soapData.objective.imaging_results || 'N/A'}</p>
                </>
              ) : 'N/A'}
            </div>
          </div>
          <div>
            <h5 style={{ margin: '0 0 0.5rem 0', color: '#1565C0' }}>Assessment</h5>
            <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '4px', fontSize: '0.9rem', color: '#000' }}>
              {soapData.assessment ? (
                <>
                  <p><strong>Diagnosis:</strong> {soapData.assessment.primary_diagnosis || 'N/A'}</p>
                  <p><strong>Differential:</strong> {soapData.assessment.differential_diagnoses || 'N/A'}</p>
                  <p><strong>ICD-10:</strong> {soapData.assessment.icd10_code || 'N/A'}</p>
                </>
              ) : 'N/A'}
            </div>
          </div>
          <div>
            <h5 style={{ margin: '0 0 0.5rem 0', color: '#1565C0' }}>Plan</h5>
            <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '4px', fontSize: '0.9rem', color: '#000' }}>
              {soapData.plan ? (
                <>
                  <p><strong>Treatment:</strong> {soapData.plan.treatment_plan || 'N/A'}</p>
                  <p><strong>Medication:</strong> {soapData.plan.medication_plan || 'N/A'}</p>
                  <p><strong>Follow-up:</strong> {soapData.plan.follow_up_plan || 'N/A'}</p>
                </>
              ) : 'N/A'}
            </div>
          </div>
        </div>
      ) : (
        <p style={{ color: '#065F46' }}>No SOAP notes available</p>
      )}
    </div>
  );
}
