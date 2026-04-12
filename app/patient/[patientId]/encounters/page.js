'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Stethoscope,
  AlertCircle,
  User,
  Activity,
  Pill,
  FileText,
  Thermometer,
  Heart,
  Wind,
} from 'lucide-react';

const EncountersPage = () => {
  const { patientId } = useParams();
  const router = useRouter();
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchEncounters();
  }, [patientId]);

  const fetchEncounters = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/patient/${patientId}/encounters`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch encounters');
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

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold" style={{ color: '#065F46' }}>Medical Encounters</h2>
        <p style={{ color: '#10B981' }} className="mt-2 font-medium">
          View details of your medical visits and consultations
        </p>
      </div>

      {error && (
        <div
          style={{ backgroundColor: '#FFD9E8', borderLeft: '4px solid #F59E0B' }}
          className="rounded-lg p-4 mb-8 flex gap-3"
        >
          <AlertCircle size={20} style={{ color: '#D97706' }} className="flex-shrink-0 mt-0.5" />
          <p style={{ color: '#065F46' }} className="font-medium">
            {error}
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                backgroundColor: '#FFFFFF',
                borderLeft: '4px solid #10B981',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)',
              }}
              className="rounded-lg p-6 h-32 animate-pulse"
            >
              <div style={{ backgroundColor: '#E8F8F5' }} className="h-4 rounded mb-3"></div>
              <div style={{ backgroundColor: '#E8F8F5' }} className="h-4 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : encounters.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderTop: '4px solid #10B981',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)',
          }}
          className="rounded-lg p-12 text-center"
        >
          <Stethoscope size={48} style={{ color: '#10B981' }} className="mx-auto mb-4" />
          <h3 className="text-lg font-semibold" style={{ color: '#065F46' }}>
            No Encounters
          </h3>
          <p style={{ color: '#10B981' }} className="mt-2 font-medium">
            You don't have any recorded medical encounters yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {encounters.map((encounter, index) => (
            <div
              key={encounter.encounter_id}
              style={{
                backgroundColor: '#FFFFFF',
                borderLeft: '4px solid #10B981',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)',
              }}
              className="rounded-lg overflow-hidden"
            >
              {/* Header */}
              <button
                onClick={() =>
                  setExpandedId(expandedId === encounter.encounter_id ? null : encounter.encounter_id)
                }
                className="w-full p-6 text-left flex items-center justify-between hover:opacity-90 transition"
                style={{
                  backgroundColor: expandedId === encounter.encounter_id ? '#F0FDF4' : '#FFFFFF',
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div style={{ backgroundColor: '#E8F8F5' }} className="rounded-lg p-2">
                      <Stethoscope size={20} style={{ color: '#10B981' }} />
                    </div>
                    <h3 className="font-semibold" style={{ color: '#065F46' }}>
                      {new Date(encounter.admission_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </h3>
                    <span
                      style={{
                        backgroundColor: '#E8F8F5',
                        color: '#10B981',
                        borderColor: '#10B981',
                        border: '1px solid',
                      }}
                      className="text-xs px-2 py-1 rounded-full font-medium"
                    >
                      {encounter.encounter_type}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm" style={{ color: '#10B981' }}>
                    <User size={14} />
                    <span>{encounter.doctor_name || 'Not assigned'}</span>
                    <span style={{ color: '#D1D5DB' }}>•</span>
                    <span>{encounter.department_name || 'General'}</span>
                  </div>

                  {encounter.status && (
                    <div className="mt-2">
                      <span
                        style={{
                          backgroundColor: encounter.status === 'Active' ? '#E8F8F5' : '#FFE4F5',
                          color: encounter.status === 'Active' ? '#10B981' : '#D97706',
                        }}
                        className="text-xs px-2 py-1 rounded-full font-medium"
                      >
                        {encounter.status}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ color: '#10B981' }} className="text-lg font-bold">
                  {expandedId === encounter.encounter_id ? '−' : '+'}
                </div>
              </button>

              {/* Expanded Content */}
              {expandedId === encounter.encounter_id && (
                <div
                  style={{ backgroundColor: '#F0FDF4', borderTop: '1px solid #E8F8F5' }}
                  className="p-6 space-y-6"
                >
                  {/* Admission Period */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderLeft: '3px solid #10B981',
                      }}
                      className="rounded-lg p-4"
                    >
                      <p style={{ color: '#10B981' }} className="text-sm font-medium">
                        Admission Date
                      </p>
                      <p style={{ color: '#065F46' }} className="font-semibold">
                        {new Date(encounter.admission_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {encounter.discharge_date && (
                      <div
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderLeft: '3px solid #059669',
                        }}
                        className="rounded-lg p-4"
                      >
                        <p style={{ color: '#10B981' }} className="text-sm font-medium">
                          Discharge Date
                        </p>
                        <p style={{ color: '#065F46' }} className="font-semibold">
                          {new Date(encounter.discharge_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Chief Complaint */}
                  {encounter.chief_complaint && (
                    <div>
                      <h4 className="font-semibold mb-2" style={{ color: '#065F46' }}>
                        Chief Complaint
                      </h4>
                      <div
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderLeft: '4px solid #F59E0B',
                        }}
                        className="rounded-lg p-4"
                      >
                        <p style={{ color: '#10B981' }}>{encounter.chief_complaint}</p>
                      </div>
                    </div>
                  )}

                  {/* Doctor Information */}
                  {encounter.doctor_name && (
                    <div
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderLeft: '4px solid #10B981',
                      }}
                      className="rounded-lg p-4"
                    >
                      <p style={{ color: '#10B981' }} className="text-sm font-medium mb-1">
                        Attending Physician
                      </p>
                      <p style={{ color: '#065F46' }} className="font-semibold">
                        {encounter.doctor_name}
                      </p>
                      {encounter.specialization && (
                        <p style={{ color: '#10B981' }} className="text-sm mt-1">
                          {encounter.specialization}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <p style={{ color: '#10B981' }} className="text-sm font-medium mb-2">
                      Status
                    </p>
                    <span
                      style={{
                        backgroundColor: encounter.status === 'Active' ? '#E8F8F5' : '#FFE4F5',
                        color: encounter.status === 'Active' ? '#10B981' : '#D97706',
                        borderLeft: `3px solid ${encounter.status === 'Active' ? '#10B981' : '#D97706'}`,
                      }}
                      className="inline-block px-3 py-2 rounded-lg font-medium"
                    >
                      {encounter.status}
                    </span>
                  </div>

                  {/* View SOAP Button */}
                  {encounter.status === 'Active' && (
                    <button
                      onClick={() => router.push(`/patient/${patientId}/encounters/${encounter.encounter_id}`)}
                      className="w-full mt-6 px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 text-white hover:opacity-90"
                      style={{
                        backgroundColor: '#10B981',
                      }}
                    >
                      <FileText size={20} />
                      View SOAP Note
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EncountersPage;
