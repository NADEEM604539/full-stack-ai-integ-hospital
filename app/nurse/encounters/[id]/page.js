'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Loader,
  AlertCircle,
  Heart,
  Calendar,
  User,
  FileText,
  Activity,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const EncounterDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const encounterId = params.id;

  const [encounter, setEncounter] = useState(null);
  const [soapNotes, setSoapNotes] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEncounterDetails();
  }, [encounterId]);

  const fetchEncounterDetails = async () => {
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
      setSoapNotes(data.data.soapNotes);
      const vital = data.data.vitals;
      setVitals(vital);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching encounter details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} color="#8B5CF6" className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading encounter details...</p>
        </div>
      </div>
    );
  }

  if (error || !encounter) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition mb-6 font-semibold"
        >
          <ChevronLeft size={20} />
          Back
        </button>
        <div
          style={{
            backgroundColor: '#FFE0E6',
            borderLeft: '5px solid #EF4444',
          }}
          className="rounded-lg p-6 flex items-start gap-4"
        >
          <AlertCircle size={28} style={{ color: '#DC2626' }} />
          <div>
            <h3 className="font-bold text-red-900">Error</h3>
            <p className="text-sm text-red-800 mt-1">
              {error || 'Encounter not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statusColor =
    encounter.status === 'Active'
      ? { bg: '#D1FAE5', text: '#065F46' }
      : encounter.status === 'Discharged'
      ? { bg: '#DDD6FE', text: '#3730A3' }
      : { bg: '#FEE2E2', text: '#7F1D1D' };

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      {/* Header */}
      <div
        className="shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-purple-100 hover:text-white transition mb-6 font-semibold"
          >
            <ChevronLeft size={20} />
            Back to Encounters
          </button>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Encounter Details
            </h1>
            <p className="text-purple-100 text-lg">
              {encounter.patient_name} (MRN: {encounter.mrn})
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Encounter Overview */}
        <div
          style={{
            backgroundColor: '#F3F0FF',
            border: '3px solid #8B5CF6',
          }}
          className="rounded-2xl p-8 mb-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Encounter Type */}
            <div>
              <p style={{ color: '#6B7280' }} className="text-sm font-semibold uppercase">
                Encounter Type
              </p>
              <p className="text-xl font-bold mt-2" style={{ color: '#1F2937' }}>
                {encounter.encounter_type}
              </p>
            </div>

            {/* Status */}
            <div>
              <p style={{ color: '#6B7280' }} className="text-sm font-semibold uppercase">
                Status
              </p>
              <span
                style={{
                  backgroundColor: statusColor.bg,
                  color: statusColor.text,
                }}
                className="text-lg font-bold px-4 py-2 rounded-lg inline-block mt-2"
              >
                {encounter.status}
              </span>
            </div>

            {/* Admission Date */}
            <div>
              <p style={{ color: '#6B7280' }} className="text-sm font-semibold uppercase">
                Admission Date
              </p>
              <p className="text-lg font-bold mt-2" style={{ color: '#1F2937' }}>
                {new Date(encounter.admission_date).toLocaleDateString()}
              </p>
            </div>

            {/* Chief Complaint */}
            {encounter.chief_complaint && (
              <div className="md:col-span-2 lg:col-span-3">
                <p style={{ color: '#6B7280' }} className="text-sm font-semibold uppercase">
                  Chief Complaint
                </p>
                <p className="text-lg mt-2" style={{ color: '#1F2937' }}>
                  {encounter.chief_complaint}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Patient & Doctor Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Patient Information */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '2px solid #E5E7EB',
            }}
            className="rounded-xl p-8"
          >
            <h3 className="text-xl font-bold mb-6" style={{ color: '#1F2937' }}>
              <User className="inline mr-2" size={20} style={{ color: '#8B5CF6' }} />
              Patient Information
            </h3>
            <div className="space-y-4">
              <div>
                <p style={{ color: '#6B7280' }} className="text-sm">
                  Full Name
                </p>
                <p className="font-semibold" style={{ color: '#1F2937' }}>
                  {encounter.patient_name}
                </p>
              </div>
              <div>
                <p style={{ color: '#6B7280' }} className="text-sm">
                  MRN
                </p>
                <p className="font-semibold" style={{ color: '#1F2937' }}>
                  {encounter.mrn}
                </p>
              </div>
              <div>
                <p style={{ color: '#6B7280' }} className="text-sm">
                  Gender
                </p>
                <p className="font-semibold" style={{ color: '#1F2937' }}>
                  {encounter.gender}
                </p>
              </div>
              <div>
                <p style={{ color: '#6B7280' }} className="text-sm">
                  Blood Type
                </p>
                <p className="font-semibold" style={{ color: '#1F2937' }}>
                  {encounter.blood_type || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Doctor Information */}
          {encounter.doctor_name && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '2px solid #E5E7EB',
              }}
              className="rounded-xl p-8"
            >
              <h3 className="text-xl font-bold mb-6" style={{ color: '#1F2937' }}>
                <Activity className="inline mr-2" size={20} style={{ color: '#8B5CF6' }} />
                Doctor Information
              </h3>
              <div className="space-y-4">
                <div>
                  <p style={{ color: '#6B7280' }} className="text-sm">
                    Doctor Name
                  </p>
                  <p className="font-semibold" style={{ color: '#1F2937' }}>
                    {encounter.doctor_name}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#6B7280' }} className="text-sm">
                    Specialization
                  </p>
                  <p className="font-semibold" style={{ color: '#1F2937' }}>
                    {encounter.specialization || 'N/A'}
                  </p>
                </div>
                {encounter.license_number && (
                  <div>
                    <p style={{ color: '#6B7280' }} className="text-sm">
                      License Number
                    </p>
                    <p className="font-semibold" style={{ color: '#1F2937' }}>
                      {encounter.license_number}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SOAP Notes */}
        {soapNotes && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#1F2937' }}>
              <FileText className="inline mr-2" size={24} style={{ color: '#8B5CF6' }} />
              SOAP Notes
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Subjective */}
              {soapNotes.subjective_text && (
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '2px solid #FEF3C7',
                  }}
                  className="rounded-xl p-6"
                >
                  <h3 className="text-lg font-bold mb-4" style={{ color: '#F59E0B' }}>
                    Subjective
                  </h3>
                  <p style={{ color: '#1F2937' }} className="text-sm leading-relaxed">
                    {soapNotes.subjective_text}
                  </p>
                </div>
              )}

              {/* Objective */}
              {soapNotes.objective_text && (
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '2px solid #DBEAFE',
                  }}
                  className="rounded-xl p-6"
                >
                  <h3 className="text-lg font-bold mb-4" style={{ color: '#3B82F6' }}>
                    Objective
                  </h3>
                  <p style={{ color: '#1F2937' }} className="text-sm leading-relaxed">
                    {soapNotes.objective_text}
                  </p>
                </div>
              )}

              {/* Assessment */}
              {soapNotes.assessment_text && (
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '2px solid #DCFCE7',
                  }}
                  className="rounded-xl p-6"
                >
                  <h3 className="text-lg font-bold mb-4" style={{ color: '#10B981' }}>
                    Assessment
                  </h3>
                  <p style={{ color: '#1F2937' }} className="text-sm leading-relaxed">
                    {soapNotes.assessment_text}
                  </p>
                </div>
              )}

              {/* Plan */}
              {soapNotes.plan_text && (
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '2px solid #E9D5FF',
                  }}
                  className="rounded-xl p-6"
                >
                  <h3 className="text-lg font-bold mb-4" style={{ color: '#A855F7' }}>
                    Plan
                  </h3>
                  <p style={{ color: '#1F2937' }} className="text-sm leading-relaxed">
                    {soapNotes.plan_text}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vitals Record - View & Link */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold" style={{ color: '#1F2937' }}>
              <Heart className="inline mr-2" size={24} style={{ color: '#8B5CF6' }} />
              Vital Signs
            </h2>
            <button
              onClick={() => router.push(`/nurse/vitals/encounter/${encounterId}`)}
              style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF' }}
              className="px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition text-sm"
            >
              {vitals ? 'View/Edit Vitals' : 'Record Vitals'}
            </button>
          </div>

          {!vitals ? (
            <div
              style={{
                backgroundColor: '#F3F0FF',
                border: '2px solid #8B5CF6',
              }}
              className="rounded-xl p-8 text-center"
            >
              <p style={{ color: '#8B5CF6' }} className="text-lg">
                No vital signs recorded yet
              </p>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: `2px solid #10B981`,
              }}
              className="rounded-lg p-6"
            >
              <p style={{ color: '#6B7280' }} className="text-sm mb-4">
                Last updated: {vitals && new Date(vitals.recorded_at).toLocaleString()}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p style={{ color: '#9CA3AF' }} className="text-xs uppercase font-semibold">
                    Temperature
                  </p>
                  <p className="font-bold text-lg" style={{ color: '#1F2937' }}>
                    {vitals?.temperature_c ? Number(vitals.temperature_c).toFixed(1) : '-'}°C
                  </p>
                </div>
                <div>
                  <p style={{ color: '#9CA3AF' }} className="text-xs uppercase font-semibold">
                    BP
                  </p>
                  <p className="font-bold text-lg" style={{ color: '#1F2937' }}>
                    {vitals?.blood_pressure_systolic && vitals?.blood_pressure_diastolic
                      ? `${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#9CA3AF' }} className="text-xs uppercase font-semibold">
                    HR
                  </p>
                  <p className="font-bold text-lg" style={{ color: '#1F2937' }}>
                    {vitals?.heart_rate ? `${vitals.heart_rate} bpm` : '-'}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#9CA3AF' }} className="text-xs uppercase font-semibold">
                    O₂ Sat
                  </p>
                  <p className="font-bold text-lg" style={{ color: '#1F2937' }}>
                    {vitals?.oxygen_saturation ? `${vitals.oxygen_saturation}%` : '-'}
                  </p>
                </div>
                {vitals?.weight_kg && (
                  <div>
                    <p style={{ color: '#9CA3AF' }} className="text-xs uppercase font-semibold">
                      Weight
                    </p>
                    <p className="font-bold text-lg" style={{ color: '#1F2937' }}>
                      {Number(vitals.weight_kg).toFixed(1)} kg
                    </p>
                  </div>
                )}
                {vitals?.height_cm && (
                  <div>
                    <p style={{ color: '#9CA3AF' }} className="text-xs uppercase font-semibold">
                      Height
                    </p>
                    <p className="font-bold text-lg" style={{ color: '#1F2937' }}>
                      {vitals.height_cm} cm
                    </p>
                  </div>
                )}
                {vitals?.ai_risk_category && (
                  <div
                    style={{
                      backgroundColor:
                        vitals.ai_risk_category === 'Critical'
                          ? '#FEE2E2'
                          : vitals.ai_risk_category === 'High'
                          ? '#FEF3C7'
                          : vitals.ai_risk_category === 'Moderate'
                          ? '#DBEAFE'
                          : '#D1FAE5',
                      color:
                        vitals.ai_risk_category === 'Critical'
                          ? '#7F1D1D'
                          : vitals.ai_risk_category === 'High'
                          ? '#92400E'
                          : vitals.ai_risk_category === 'Moderate'
                          ? '#0C4A6E'
                          : '#065F46',
                      borderRadius: '0.5rem',
                      padding: '0.5rem',
                    }}
                  >
                    <p className="text-xs uppercase font-bold">Risk</p>
                    <p className="font-bold text-sm">
                      {vitals.ai_risk_category}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EncounterDetailPage;
