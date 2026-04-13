'use client';

import React, { useState, useEffect } from 'react';
import {
  Loader,
  AlertCircle,
  Heart,
  Calendar,
  Search,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const NurseVitalsPage = () => {
  const router = useRouter();
  const [encounters, setEncounters] = useState([]);
  const [filteredEncounters, setFilteredEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [vitalsData, setVitalsData] = useState({});
  const [loadingVitals, setLoadingVitals] = useState({});

  useEffect(() => {
    fetchEncounters();
  }, []);

  useEffect(() => {
    filterEncounters();
  }, [encounters, searchTerm]);

  useEffect(() => {
    // Fetch vitals for all encounters
    encounters.forEach(encounter => {
      if (!vitalsData[encounter.encounter_id]) {
        fetchVitalForEncounter(encounter.encounter_id);
      }
    });
  }, [encounters]);

  const fetchEncounters = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/nurse/encounters');

      if (!response.ok) {
        throw new Error('Failed to fetch encounters');
      }

      const data = await response.json();
      setEncounters(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching encounters:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVitalForEncounter = async (encounterId) => {
    try {
      setLoadingVitals(prev => ({ ...prev, [encounterId]: true }));
      const response = await fetch(`/api/nurse/encounters/${encounterId}`);
      if (response.ok) {
        const data = await response.json();
        setVitalsData(prev => ({
          ...prev,
          [encounterId]: data.data.vitals,
        }));
      }
    } catch (error) {
      console.error('Error fetching vital:', error);
    } finally {
      setLoadingVitals(prev => ({ ...prev, [encounterId]: false }));
    }
  };

  const filterEncounters = () => {
    const filtered = encounters.filter(encounter =>
      encounter.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      encounter.encounter_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      encounter.mrn?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEncounters(filtered);
  };

  const getRiskColor = (category) => {
    const colors = {
      'Low': { bg: '#ECFDF5', text: '#047857', border: '#6EE7B7' },
      'Moderate': { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
      'High': { bg: '#FFECDF', text: '#9A3412', border: '#FDBA74' },
      'Critical': { bg: '#FFE5E5', text: '#991B1B', border: '#FCA5A5' },
    };
    return colors[category] || colors['Low'];
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} style={{ color: '#8B5CF6' }} className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading vital records...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      {/* Header */}
      <div
        className="shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-4xl font-bold text-white mb-2">Vital Signs Management</h1>
          <p className="text-purple-100 text-lg">Monitor and record patient vitals across all encounters</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search size={20} style={{ color: '#9CA3AF' }} className="absolute left-4 top-3" />
            <input
              type="text"
              placeholder="Search by patient name, MRN, or encounter type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                backgroundColor: '#FFFFFF',
                border: '2px solid #E5E7EB',
              }}
              className="w-full pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>

        {/* Error Message */}
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

        {/* Encounters Grid */}
        {filteredEncounters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEncounters.map((encounter) => {
              const vital = vitalsData[encounter.encounter_id];
              const isLoadingVital = loadingVitals[encounter.encounter_id];
              const riskColor = vital?.ai_risk_category ? getRiskColor(vital.ai_risk_category) : null;

              return (
                <div
                  key={encounter.encounter_id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    border: '1px solid #E5E7EB',
                  }}
                  className="rounded-xl overflow-hidden hover:shadow-lg transition"
                >
                  {/* Card Header */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #F3F0FF 0%, #EDE9FE 100%)',
                      borderBottom: '1px solid #E5E7EB',
                    }}
                    className="p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p style={{ color: '#8B5CF6' }} className="text-sm font-semibold">
                          {encounter.encounter_type}
                        </p>
                        <h3 className="text-lg font-bold" style={{ color: '#1F2937' }}>
                          {encounter.patient_name}
                        </h3>
                        <p style={{ color: '#6B7280' }} className="text-sm mt-1">
                          MRN: {encounter.mrn}
                        </p>
                      </div>
                      <span
                        style={{
                          backgroundColor:
                            encounter.status === 'Active'
                              ? '#D1FAE5'
                              : encounter.status === 'Discharged'
                              ? '#DDD6FE'
                              : '#FEE2E2',
                          color:
                            encounter.status === 'Active'
                              ? '#065F46'
                              : encounter.status === 'Discharged'
                              ? '#3730A3'
                              : '#7F1D1D',
                        }}
                        className="text-xs font-bold px-3 py-1 rounded-full"
                      >
                        {encounter.status}
                      </span>
                    </div>
                    <p style={{ color: '#6B7280' }} className="text-xs flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(encounter.admission_date).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Card Body - Vitals Display */}
                  <div className="p-4">
                    {isLoadingVital ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader size={24} style={{ color: '#8B5CF6' }} className="animate-spin" />
                      </div>
                    ) : vital ? (
                      <div>
                        <p style={{ color: '#6B7280' }} className="text-xs font-semibold mb-3 uppercase">
                          Latest Vitals
                        </p>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div
                            style={{
                              backgroundColor: '#F9FAFB',
                              border: '1px solid #E5E7EB',
                            }}
                            className="rounded-lg p-3"
                          >
                            <p style={{ color: '#9CA3AF' }} className="text-xs uppercase font-semibold">
                              Temperature
                            </p>
                            <p className="font-bold text-lg" style={{ color: '#1F2937' }}>
                              {vital.temperature_c ? Number(vital.temperature_c).toFixed(1) : '-'}°C
                            </p>
                          </div>

                          <div
                            style={{
                              backgroundColor: '#F9FAFB',
                              border: '1px solid #E5E7EB',
                            }}
                            className="rounded-lg p-3"
                          >
                            <p style={{ color: '#9CA3AF' }} className="text-xs uppercase font-semibold">
                              BP
                            </p>
                            <p className="font-bold text-lg" style={{ color: '#1F2937' }}>
                              {vital.blood_pressure_systolic && vital.blood_pressure_diastolic
                                ? `${vital.blood_pressure_systolic}/${vital.blood_pressure_diastolic}`
                                : '-'}
                            </p>
                          </div>

                          <div
                            style={{
                              backgroundColor: '#F9FAFB',
                              border: '1px solid #E5E7EB',
                            }}
                            className="rounded-lg p-3"
                          >
                            <p style={{ color: '#9CA3AF' }} className="text-xs uppercase font-semibold">
                              HR
                            </p>
                            <p className="font-bold text-lg" style={{ color: '#1F2937' }}>
                              {vital.heart_rate ? `${vital.heart_rate}` : '-'}
                            </p>
                          </div>

                          <div
                            style={{
                              backgroundColor: '#F9FAFB',
                              border: '1px solid #E5E7EB',
                            }}
                            className="rounded-lg p-3"
                          >
                            <p style={{ color: '#9CA3AF' }} className="text-xs uppercase font-semibold">
                              O₂ Sat
                            </p>
                            <p className="font-bold text-lg" style={{ color: '#1F2937' }}>
                              {vital.oxygen_saturation ? `${vital.oxygen_saturation}%` : '-'}
                            </p>
                          </div>
                        </div>

                        {/* Risk Badge */}
                        {vital.ai_risk_category && riskColor && (
                          <div
                            style={{
                              backgroundColor: riskColor.bg,
                              border: `2px solid ${riskColor.border}`,
                              color: riskColor.text,
                            }}
                            className="rounded-lg p-2 mb-4 text-center"
                          >
                            <p className="text-xs uppercase font-bold">Risk Level</p>
                            <p className="font-bold">{vital.ai_risk_category}</p>
                          </div>
                        )}

                        <p style={{ color: '#9CA3AF' }} className="text-xs">
                          Updated: {new Date(vital.recorded_at).toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <div
                        style={{
                          backgroundColor: '#F3F0FF',
                          border: '1px solid #E9D5FF',
                        }}
                        className="rounded-lg p-4 text-center"
                      >
                        <Heart size={24} style={{ color: '#A855F7' }} className="mx-auto mb-2 opacity-50" />
                        <p style={{ color: '#8B5CF6' }} className="text-sm font-semibold">
                          No vitals recorded
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer - Action Buttons */}
                  <div
                    style={{
                      borderTop: '1px solid #E5E7EB',
                      backgroundColor: '#F9FAFB',
                    }}
                    className="p-4"
                  >
                    <button
                      onClick={() => router.push(`/nurse/vitals/encounter/${encounter.encounter_id}`)}
                      style={{
                        backgroundColor: '#8B5CF6',
                        color: '#FFFFFF',
                      }}
                      className="w-full px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2 text-sm"
                    >
                      {vital ? '✏️ Edit Vitals' : '➕ Record Vitals'}
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              backgroundColor: '#F3F0FF',
              border: '3px solid #8B5CF6',
            }}
            className="rounded-2xl shadow-md p-16 text-center"
          >
            <Heart
              size={64}
              style={{ color: '#8B5CF6' }}
              className="mx-auto mb-6 opacity-50"
            />
            <h3 className="text-2xl font-bold" style={{ color: '#5B21B6' }}>
              No Encounters Found
            </h3>
            <p style={{ color: '#8B5CF6' }} className="mt-3 text-lg">
              {searchTerm
                ? 'Try adjusting your search criteria'
                : 'No patient encounters available at this time'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NurseVitalsPage;
