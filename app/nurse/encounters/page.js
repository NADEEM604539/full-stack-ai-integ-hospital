'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Loader, AlertCircle, ChevronLeft, Plus, Heart, Clock, FileText, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const NurseEncountersPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');

  const [encounters, setEncounters] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewEncounterModal, setShowNewEncounterModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(patientId ? parseInt(patientId) : null);
  const [encounterType, setEncounterType] = useState('Outpatient');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch patients
      const patientsRes = await fetch('/api/nurse/patients');
      if (patientsRes.ok) {
        const pData = await patientsRes.json();
        setPatients(pData.data || []);
      }

      // Fetch encounters
      const encountersRes = await fetch('/api/nurse/encounters');
      if (!encountersRes.ok) {
        const errorData = await encountersRes.json();
        throw new Error(errorData.error || 'Failed to fetch encounters');
      }

      const eData = await encountersRes.json();
      setEncounters(eData.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEncounter = async () => {
    if (!selectedPatient || !encounterType) {
      alert('Please select a patient and encounter type');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/nurse/encounters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: selectedPatient,
          encounter_type: encounterType,
          chief_complaint: chiefComplaint || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start encounter');
      }

      const data = await response.json();
      
      // Reset form and close modal
      setSelectedPatient(null);
      setEncounterType('Outpatient');
      setChiefComplaint('');
      setShowNewEncounterModal(false);

      // Refresh encounters
      await fetchData();

      // Redirect to vitals recording
      router.push(`/nurse/vitals?encounterId=${data.data.encounter_id}`);
    } catch (err) {
      alert(`Error: ${err.message}`);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} color="#8B5CF6" className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading encounters...</p>
        </div>
      </div>
    );
  }

  const filteredEncounters = patientId
    ? encounters.filter(e => e.patient_id === parseInt(patientId))
    : encounters;

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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">
                Encounters
              </h1>
              <p className="text-purple-100 text-lg">
                View and manage patient encounters
              </p>
            </div>
            <button
              onClick={() => setShowNewEncounterModal(true)}
              className="flex items-center gap-2 text-white px-6 py-3 rounded-full font-semibold transition hover:bg-purple-700 hover:shadow-lg"
              style={{ backgroundColor: '#8B5CF6' }}
            >
              <Plus size={20} />
              Start Encounter
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
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
                Error Loading Encounters
              </h3>
              <p style={{ color: '#065F46' }} className="text-sm mt-1">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredEncounters.length === 0 && !loading && (
          <div
            style={{
              backgroundColor: '#F3F0FF',
              border: '3px solid #8B5CF6',
            }}
            className="rounded-2xl shadow-md p-16 text-center"
          >
            <Activity
              size={64}
              style={{ color: '#8B5CF6' }}
              className="mx-auto mb-6"
            />
            <h3 className="text-2xl font-bold" style={{ color: '#5B21B6' }}>
              No Encounters Yet
            </h3>
            <p style={{ color: '#8B5CF6' }} className="mt-3 text-lg mb-8">
              Start a new encounter to begin recording patient data.
            </p>
            <button
              onClick={() => setShowNewEncounterModal(true)}
              className="px-8 py-3 rounded-lg font-semibold text-white transition hover:shadow-lg inline-flex items-center gap-2"
              style={{ backgroundColor: '#8B5CF6' }}
            >
              <Plus size={20} />
              Start First Encounter
            </button>
          </div>
        )}

        {/* Encounters List */}
        {filteredEncounters.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold" style={{ color: '#1F2937' }}>
              Total Encounters: {filteredEncounters.length}
            </h2>

            {filteredEncounters.map((encounter, idx) => {
              const statusColors = {
                'Active': { bg: '#ECFDF5', text: '#047857', border: '#10B981' },
                'Discharged': { bg: '#F3F4F6', text: '#374151', border: '#9CA3AF' },
                'Transferred': { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
              };

              const statusColor = statusColors[encounter.status] || statusColors['Active'];
              const colors = [
                { border: '#8B5CF6' },
                { border: '#EC4899' },
                { border: '#F59E0B' },
                { border: '#10B981' },
              ];
              const color = colors[idx % colors.length];

              return (
                <div
                  key={encounter.encounter_id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: `3px solid ${color.border}`,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  }}
                  className="rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 p-8"
                >
                  <div className="flex flex-col lg:flex-row gap-8 justify-between">
                    {/* Encounter Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h3 className="text-2xl font-bold" style={{ color: '#1F2937' }}>
                            {encounter.patient_name}
                          </h3>
                          <p style={{ color: '#6B7280' }} className="text-sm mt-1">
                            MRN: {encounter.mrn}
                          </p>
                        </div>
                        <div
                          style={{
                            backgroundColor: statusColor.bg,
                            border: `2px solid ${statusColor.border}`,
                          }}
                          className="px-4 py-2 rounded-full"
                        >
                          <p style={{ color: statusColor.text }} className="text-sm font-bold">
                            {encounter.status}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {/* Type */}
                        <div>
                          <p style={{ color: '#6B7280' }} className="text-xs font-semibold uppercase">
                            Type
                          </p>
                          <p className="text-lg font-bold mt-1" style={{ color: color.border }}>
                            {encounter.encounter_type}
                          </p>
                        </div>

                        {/* Doctor */}
                        <div>
                          <p style={{ color: '#6B7280' }} className="text-xs font-semibold uppercase">
                            Doctor
                          </p>
                          <p className="text-sm font-semibold mt-1" style={{ color: '#1F2937' }}>
                            {encounter.doctor_name || 'Not assigned'}
                          </p>
                        </div>

                        {/* Admission Date */}
                        <div>
                          <p style={{ color: '#6B7280' }} className="text-xs font-semibold uppercase">
                            Admitted
                          </p>
                          <p className="text-sm font-semibold mt-1" style={{ color: '#1F2937' }}>
                            {new Date(encounter.admission_date).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Vitals Recorded */}
                        <div>
                          <p style={{ color: '#6B7280' }} className="text-xs font-semibold uppercase">
                            Vitals
                          </p>
                          <p className="text-lg font-bold mt-1" style={{ color: color.border }}>
                            {encounter.vitals_count || 0}
                          </p>
                        </div>
                      </div>

                      {/* Chief Complaint */}
                      {encounter.chief_complaint && (
                        <div className="mb-4">
                          <p style={{ color: '#6B7280' }} className="text-sm font-semibold">
                            Chief Complaint
                          </p>
                          <p style={{ color: '#1F2937' }} className="text-sm mt-2">
                            {encounter.chief_complaint}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="w-full lg:w-auto flex flex-col gap-3">
                      <Link
                        href={`/nurse/encounters/${encounter.encounter_id}`}
                        style={{
                          backgroundColor: color.border,
                          color: '#FFFFFF',
                        }}
                        className="px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition text-center"
                      >
                        View Details
                      </Link>
                      <Link
                        href={`/nurse/vitals?encounterId=${encounter.encounter_id}`}
                        style={{
                          backgroundColor: `${color.border}20`,
                          color: color.border,
                          border: `2px solid ${color.border}`,
                        }}
                        className="px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition text-center"
                      >
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

      {/* New Encounter Modal */}
      {showNewEncounterModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
          <div style={{ backgroundColor: '#FFFFFF' }} className="rounded-2xl max-w-md w-full shadow-2xl">
            {/* Header */}
            <div
              className="px-8 py-6"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
              }}
            >
              <h2 className="text-2xl font-bold text-white">Start New Encounter</h2>
              <p className="text-purple-100 text-sm mt-1">Record a new patient encounter</p>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Select Patient */}
              <div className="mb-6">
                <label style={{ color: '#6B7280' }} className="block text-sm font-semibold mb-2">
                  Select Patient *
                </label>
                <select
                  value={selectedPatient || ''}
                  onChange={(e) => setSelectedPatient(e.target.value ? parseInt(e.target.value) : null)}
                  style={{
                    backgroundColor: '#F9FAFB',
                    border: '2px solid #E5E7EB',
                  }}
                  className="w-full px-4 py-2 rounded-lg focus:outline-none focus:border-purple-400"
                >
                  <option value="">Choose a patient...</option>
                  {patients.map(p => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.full_name} ({p.mrn})
                    </option>
                  ))}
                </select>
              </div>

              {/* Encounter Type */}
              <div className="mb-6">
                <label style={{ color: '#6B7280' }} className="block text-sm font-semibold mb-2">
                  Encounter Type *
                </label>
                <div className="flex gap-3">
                  {['Outpatient', 'Inpatient', 'Emergency'].map(type => (
                    <button
                      key={type}
                      onClick={() => setEncounterType(type)}
                      style={{
                        backgroundColor: encounterType === type ? '#8B5CF6' : '#F3F4F6',
                        color: encounterType === type ? '#FFFFFF' : '#6B7280',
                      }}
                      className="flex-1 py-2 rounded-lg font-semibold transition"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chief Complaint */}
              <div className="mb-8">
                <label style={{ color: '#6B7280' }} className="block text-sm font-semibold mb-2">
                  Chief Complaint (Optional)
                </label>
                <textarea
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="Describe patient's main complaint..."
                  style={{
                    backgroundColor: '#F9FAFB',
                    border: '2px solid #E5E7EB',
                  }}
                  className="w-full px-4 py-2 rounded-lg focus:outline-none focus:border-purple-400 resize-none"
                  rows={3}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowNewEncounterModal(false)}
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
                  onClick={handleCreateEncounter}
                  style={{
                    backgroundColor: '#8B5CF6',
                    color: '#FFFFFF',
                  }}
                  className="flex-1 font-semibold py-3 rounded-lg transition hover:shadow-lg disabled:opacity-50"
                  disabled={submitting || !selectedPatient}
                >
                  {submitting ? 'Starting...' : 'Start Encounter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NurseEncountersPage;
