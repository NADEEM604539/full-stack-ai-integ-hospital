'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Loader,
  AlertCircle,
  Heart,
  Calendar,
  User,
  Save,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const VitalDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const encounterId = params.encounterId;

  const [encounter, setEncounter] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    temperature_c: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    heart_rate: '',
    oxygen_saturation: '',
    weight_kg: '',
    height_cm: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (encounterId) {
      fetchEncounterVitals();
    }
  }, [encounterId]);

  const fetchEncounterVitals = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/nurse/encounters/${encounterId}`);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Encounter not found or you do not have access');
        }
        throw new Error('Failed to fetch encounter details');
      }

      const data = await response.json();
      setEncounter(data.data.encounter);
      const vital = data.data.vitals;
      setVitals(vital);
      
      if (vital) {
        setFormData({
          temperature_c: vital.temperature_c || '',
          blood_pressure_systolic: vital.blood_pressure_systolic || '',
          blood_pressure_diastolic: vital.blood_pressure_diastolic || '',
          heart_rate: vital.heart_rate || '',
          oxygen_saturation: vital.oxygen_saturation || '',
          weight_kg: vital.weight_kg || '',
          height_cm: vital.height_cm || '',
        });
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching encounter vitals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : value,
    }));
  };

  const handleSaveVitals = async (e) => {
    e.preventDefault();
    
    if (!encounterId) {
      setError('Encounter ID is missing');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/nurse/encounters/${encounterId}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temperature_c: formData.temperature_c ? Number(formData.temperature_c) : null,
          blood_pressure_systolic: formData.blood_pressure_systolic ? Number(formData.blood_pressure_systolic) : null,
          blood_pressure_diastolic: formData.blood_pressure_diastolic ? Number(formData.blood_pressure_diastolic) : null,
          heart_rate: formData.heart_rate ? Number(formData.heart_rate) : null,
          oxygen_saturation: formData.oxygen_saturation ? Number(formData.oxygen_saturation) : null,
          weight_kg: formData.weight_kg ? Number(formData.weight_kg) : null,
          height_cm: formData.height_cm ? Number(formData.height_cm) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save vitals');
      }

      const data = await response.json();
      setVitals(data.data);
      setEditing(false);
      setSuccessMessage('Vitals updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message);
      console.error('Error saving vitals:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9FAFB' }}>
        <Loader size={40} style={{ color: '#8B5CF6' }} className="animate-spin" />
      </div>
    );
  }

  if (!encounter) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="text-center">
          <AlertCircle size={40} style={{ color: '#EF4444' }} className="mx-auto mb-4" />
          <h2 className="text-xl font-bold" style={{ color: '#1F2937' }}>Encounter not found</h2>
          <Link href="/nurse/vitals" className="mt-4 text-purple-600 hover:underline inline-block">
            Back to Vitals
          </Link>
        </div>
      </div>
    );
  }

  const getRiskColor = (category) => {
    const colors = {
      'Low': { bg: '#ECFDF5', text: '#047857' },
      'Moderate': { bg: '#FEF3C7', text: '#92400E' },
      'High': { bg: '#FFECDF', text: '#9A3412' },
      'Critical': { bg: '#FFE5E5', text: '#991B1B' },
    };
    return colors[category] || colors['Low'];
  };

  return (
    <div style={{ backgroundColor: '#F9FAFB' }} className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ChevronLeft size={24} style={{ color: '#6B7280' }} />
          </button>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#1F2937' }}>Vital Signs Details</h1>
            <p style={{ color: '#6B7280' }} className="mt-2">Record and manage vitals for this encounter</p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div
            style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #FECACA',
              color: '#991B1B',
            }}
            className="rounded-lg p-4 mb-6 flex gap-3 items-center"
          >
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div
            style={{
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#047857',
            }}
            className="rounded-lg p-4 mb-6 flex gap-3 items-center"
          >
            <Heart size={20} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Encounter Info */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
          className="rounded-xl p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label style={{ color: '#6B7280' }} className="block text-sm font-semibold mb-1">
              Patient
            </label>
            <p className="text-lg font-semibold" style={{ color: '#1F2937' }}>
              {encounter.patient_name}
            </p>
          </div>
          <div>
            <label style={{ color: '#6B7280' }} className="block text-sm font-semibold mb-1">
              Encounter Type
            </label>
            <p className="text-lg font-semibold" style={{ color: '#1F2937' }}>
              {encounter.encounter_type}
            </p>
          </div>
          <div>
            <label style={{ color: '#6B7280' }} className="block text-sm font-semibold mb-1">
              Admission Date
            </label>
            <p className="text-lg font-semibold" style={{ color: '#1F2937' }}>
              {new Date(encounter.admission_date).toLocaleDateString()}
            </p>
          </div>
          <div>
            <label style={{ color: '#6B7280' }} className="block text-sm font-semibold mb-1">
              Status
            </label>
            <p className="text-lg font-semibold" style={{ color: '#1F2937' }}>
              {encounter.status}
            </p>
          </div>
        </div>

        {/* Vitals Section */}
        {!editing ? (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
            className="rounded-xl p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#1F2937' }}>
                {vitals ? 'Current Vitals' : 'No Vitals Recorded'}
              </h2>
              <button
                onClick={() => setEditing(true)}
                className="px-6 py-2 rounded-lg font-semibold text-white transition hover:shadow-lg flex items-center gap-2"
                style={{ backgroundColor: '#8B5CF6' }}
              >
                {vitals ? '✏️ Edit' : '➕ Record First Vitals'}
              </button>
            </div>

            {vitals ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  style={{
                    backgroundColor: '#F9FAFB',
                    border: '2px solid #E5E7EB',
                  }}
                  className="rounded-lg p-4"
                >
                  <p style={{ color: '#6B7280' }} className="text-sm font-semibold mb-2">Temperature</p>
                  <p className="text-2xl font-bold" style={{ color: '#1F2937' }}>
                    {vitals.temperature_c ? `${Number(vitals.temperature_c).toFixed(1)}°C` : '-'}
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: '#F9FAFB',
                    border: '2px solid #E5E7EB',
                  }}
                  className="rounded-lg p-4"
                >
                  <p style={{ color: '#6B7280' }} className="text-sm font-semibold mb-2">Heart Rate</p>
                  <p className="text-2xl font-bold" style={{ color: '#1F2937' }}>
                    {vitals.heart_rate ? `${vitals.heart_rate} bpm` : '-'}
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: '#F9FAFB',
                    border: '2px solid #E5E7EB',
                  }}
                  className="rounded-lg p-4"
                >
                  <p style={{ color: '#6B7280' }} className="text-sm font-semibold mb-2">Blood Pressure</p>
                  <p className="text-2xl font-bold" style={{ color: '#1F2937' }}>
                    {vitals.blood_pressure_systolic && vitals.blood_pressure_diastolic
                      ? `${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic} mmHg`
                      : '-'}
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: '#F9FAFB',
                    border: '2px solid #E5E7EB',
                  }}
                  className="rounded-lg p-4"
                >
                  <p style={{ color: '#6B7280' }} className="text-sm font-semibold mb-2">O₂ Saturation</p>
                  <p className="text-2xl font-bold" style={{ color: '#1F2937' }}>
                    {vitals.oxygen_saturation ? `${vitals.oxygen_saturation}%` : '-'}
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: '#F9FAFB',
                    border: '2px solid #E5E7EB',
                  }}
                  className="rounded-lg p-4"
                >
                  <p style={{ color: '#6B7280' }} className="text-sm font-semibold mb-2">Weight</p>
                  <p className="text-2xl font-bold" style={{ color: '#1F2937' }}>
                    {vitals.weight_kg ? `${Number(vitals.weight_kg).toFixed(1)} kg` : '-'}
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: '#F9FAFB',
                    border: '2px solid #E5E7EB',
                  }}
                  className="rounded-lg p-4"
                >
                  <p style={{ color: '#6B7280' }} className="text-sm font-semibold mb-2">Height</p>
                  <p className="text-2xl font-bold" style={{ color: '#1F2937' }}>
                    {vitals.height_cm ? `${Number(vitals.height_cm).toFixed(1)} cm` : '-'}
                  </p>
                </div>

                {vitals.ai_risk_category && (
                  <div className="md:col-span-2">
                    <p style={{ color: '#6B7280' }} className="text-sm font-semibold mb-2">Risk Assessment</p>
                    <span
                      style={{
                        backgroundColor: getRiskColor(vitals.ai_risk_category).bg,
                        color: getRiskColor(vitals.ai_risk_category).text,
                      }}
                      className="px-4 py-2 rounded-full font-semibold inline-block"
                    >
                      {vitals.ai_risk_category} Risk
                    </span>
                  </div>
                )}

                {vitals.recorded_at && (
                  <div className="md:col-span-2">
                    <p style={{ color: '#6B7280' }} className="text-sm font-semibold mb-1">Last Updated</p>
                    <p style={{ color: '#1F2937' }}>{new Date(vitals.recorded_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: '#6B7280' }} className="text-center py-8">
                No vital signs have been recorded for this encounter yet.
              </p>
            )}
          </div>
        ) : (
          /* Edit Form */
          <div
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
            className="rounded-xl p-6"
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#1F2937' }}>
              {vitals ? 'Edit Vitals' : 'Record Vitals'}
            </h2>

            <form onSubmit={handleSaveVitals}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label style={{ color: '#6B7280' }} className="block text-sm font-semibold mb-2">
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    name="temperature_c"
                    value={formData.temperature_c}
                    onChange={handleInputChange}
                    placeholder="36.5"
                    step="0.1"
                    style={{
                      backgroundColor: '#F9FAFB',
                      border: '2px solid #E5E7EB',
                    }}
                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label style={{ color: '#6B7280' }} className="block text-sm font-semibold mb-2">
                    Heart Rate (bpm)
                  </label>
                  <input
                    type="number"
                    name="heart_rate"
                    value={formData.heart_rate}
                    onChange={handleInputChange}
                    placeholder="72"
                    style={{
                      backgroundColor: '#F9FAFB',
                      border: '2px solid #E5E7EB',
                    }}
                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label style={{ color: '#6B7280' }} className="block text-sm font-semibold mb-2">
                    Blood Pressure - Systolic (mmHg)
                  </label>
                  <input
                    type="number"
                    name="blood_pressure_systolic"
                    value={formData.blood_pressure_systolic}
                    onChange={handleInputChange}
                    placeholder="120"
                    style={{
                      backgroundColor: '#F9FAFB',
                      border: '2px solid #E5E7EB',
                    }}
                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label style={{ color: '#6B7280' }} className="block text-sm font-semibold mb-2">
                    Blood Pressure - Diastolic (mmHg)
                  </label>
                  <input
                    type="number"
                    name="blood_pressure_diastolic"
                    value={formData.blood_pressure_diastolic}
                    onChange={handleInputChange}
                    placeholder="80"
                    style={{
                      backgroundColor: '#F9FAFB',
                      border: '2px solid #E5E7EB',
                    }}
                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label style={{ color: '#6B7280' }} className="block text-sm font-semibold mb-2">
                    O₂ Saturation (%)
                  </label>
                  <input
                    type="number"
                    name="oxygen_saturation"
                    value={formData.oxygen_saturation}
                    onChange={handleInputChange}
                    placeholder="98"
                    min="0"
                    max="100"
                    style={{
                      backgroundColor: '#F9FAFB',
                      border: '2px solid #E5E7EB',
                    }}
                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label style={{ color: '#6B7280' }} className="block text-sm font-semibold mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    name="weight_kg"
                    value={formData.weight_kg}
                    onChange={handleInputChange}
                    placeholder="70"
                    step="0.1"
                    style={{
                      backgroundColor: '#F9FAFB',
                      border: '2px solid #E5E7EB',
                    }}
                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label style={{ color: '#6B7280' }} className="block text-sm font-semibold mb-2">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    name="height_cm"
                    value={formData.height_cm}
                    onChange={handleInputChange}
                    placeholder="175"
                    step="0.1"
                    style={{
                      backgroundColor: '#F9FAFB',
                      border: '2px solid #E5E7EB',
                    }}
                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  style={{
                    backgroundColor: '#E5E7EB',
                    color: '#1F2937',
                  }}
                  className="flex-1 font-semibold py-3 rounded-lg transition hover:shadow-lg"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#8B5CF6',
                    color: '#FFFFFF',
                  }}
                  className="flex-1 font-semibold py-3 rounded-lg transition hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={submitting}
                >
                  <Save size={20} />
                  {submitting ? 'Saving...' : 'Save Vitals'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default VitalDetailPage;
