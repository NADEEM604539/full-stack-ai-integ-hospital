'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  AlertCircle,
  Heart,
  Wind,
  Thermometer,
  Droplet,
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
} from 'lucide-react';

const VitalsPage = () => {
  const { patientId } = useParams();
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVitals();
  }, [patientId]);

  const fetchVitals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/patient/${patientId}/vitals`);

      if (!response.ok) {
        // If API doesn't exist yet, show placeholder
        if (response.status === 404) {
          setVitals([]);
          setError('No vital signs recorded yet. Vitals will appear here when recorded by healthcare staff.');
          setLoading(false);
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch vitals');
      }

      const data = await response.json();
      setVitals(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching vitals:', err);
    } finally {
      setLoading(false);
    }
  };

  const getVitalStatus = (type, value) => {
    if (!value) return { color: '#10B981', status: 'Unknown' };
    
    const numValue = parseFloat(value);
    
    switch (type) {
      case 'blood_pressure':
        // Format: 120/80
        const [systolic] = value.split('/').map(Number);
        if (systolic < 120) return { color: '#10B981', status: 'Normal' };
        if (systolic < 140) return { color: '#F59E0B', status: 'Elevated' };
        return { color: '#D97706', status: 'High' };
      
      case 'heart_rate':
        if (numValue >= 60 && numValue <= 100) return { color: '#10B981', status: 'Normal' };
        if (numValue < 60) return { color: '#F59E0B', status: 'Low' };
        return { color: '#D97706', status: 'High' };
      
      case 'body_temperature':
        if (numValue >= 36.1 && numValue <= 37.2) return { color: '#10B981', status: 'Normal' };
        if (numValue < 36.1) return { color: '#F59E0B', status: 'Low' };
        return { color: '#D97706', status: 'High' };
      
      case 'respiratory_rate':
        if (numValue >= 12 && numValue <= 20) return { color: '#10B981', status: 'Normal' };
        return { color: '#D97706', status: 'Abnormal' };
      
      case 'oxygen_saturation':
        if (numValue >= 95) return { color: '#10B981', status: 'Normal' };
        if (numValue >= 90) return { color: '#F59E0B', status: 'Low' };
        return { color: '#D97706', status: 'Critical' };
      
      default:
        return { color: '#10B981', status: 'Normal' };
    }
  };

  const getVitalIcon = (type) => {
    switch (type) {
      case 'blood_pressure':
        return Heart;
      case 'heart_rate':
        return Activity;
      case 'body_temperature':
        return Thermometer;
      case 'respiratory_rate':
        return Wind;
      case 'oxygen_saturation':
        return Droplet;
      default:
        return Heart;
    }
  };

  const getVitalLabel = (type) => {
    switch (type) {
      case 'blood_pressure':
        return 'Blood Pressure';
      case 'heart_rate':
        return 'Heart Rate';
      case 'body_temperature':
        return 'Body Temperature';
      case 'respiratory_rate':
        return 'Respiratory Rate';
      case 'oxygen_saturation':
        return 'Oxygen Saturation';
      default:
        return type;
    }
  };

  const getVitalUnit = (type) => {
    switch (type) {
      case 'blood_pressure':
        return 'mmHg';
      case 'heart_rate':
        return 'bpm';
      case 'body_temperature':
        return '°C';
      case 'respiratory_rate':
        return 'breaths/min';
      case 'oxygen_saturation':
        return '%';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F0FDF4' }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-emerald-600"></div>
          <p className="mt-6 text-lg" style={{ color: '#065F46' }}>
            Loading vital signs...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold" style={{ color: '#065F46' }}>
          Vital Signs
        </h2>
        <p style={{ color: '#10B981' }} className="mt-2 font-medium">
          Monitor your health metrics and vital signs
        </p>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#FFF4E6',
            borderLeft: '4px solid #F59E0B',
          }}
          className="rounded-lg p-4 mb-8 flex gap-3"
        >
          <AlertCircle size={20} style={{ color: '#D97706' }} className="flex-shrink-0 mt-0.5" />
          <p style={{ color: '#065F46' }} className="font-medium">
            {error}
          </p>
        </div>
      )}

      {vitals.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '3px solid #10B981',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)',
          }}
          className="rounded-2xl p-12 text-center"
        >
          <div style={{ backgroundColor: '#E8F8F5' }} className="rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Heart size={40} style={{ color: '#10B981' }} />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: '#065F46' }}>
            No Vital Signs Recorded
          </h3>
          <p style={{ color: '#10B981' }} className="mt-2 font-medium">
            Your vital signs will appear here when recorded by healthcare staff during your visits
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Latest Vitals Card */}
          {vitals.length > 0 && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '3px solid #10B981',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)',
              }}
              className="rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold" style={{ color: '#065F46' }}>
                  Latest Vitals
                </h3>
                {vitals[0]?.recorded_at && (
                  <div className="flex items-center gap-2" style={{ color: '#10B981' }}>
                    <Clock size={16} />
                    <span className="text-sm font-medium">
                      {new Date(vitals[0].recorded_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vitals[0] && Object.entries(vitals[0]).map(([key, value]) => {
                  if (!value || key === 'vital_id' || key === 'encounter_id' || key === 'recorded_at' || key === 'created_at') {
                    return null;
                  }

                  const VitalIcon = getVitalIcon(key);
                  const label = getVitalLabel(key);
                  const unit = getVitalUnit(key);
                  const { color, status } = getVitalStatus(key, value);

                  return (
                    <div
                      key={key}
                      style={{
                        backgroundColor: '#F0FDF4',
                        borderLeft: `4px solid ${color}`,
                      }}
                      className="rounded-xl p-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p style={{ color: '#10B981' }} className="text-sm font-bold uppercase tracking-wider">
                          {label}
                        </p>
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: color }}
                        >
                          <VitalIcon size={18} className="text-white" />
                        </div>
                      </div>

                      <div className="flex items-baseline gap-2 mb-2">
                        <p style={{ color: '#065F46' }} className="text-2xl font-bold">
                          {value}
                        </p>
                        <p style={{ color: '#10B981' }} className="text-sm font-semibold">
                          {unit}
                        </p>
                      </div>

                      <p
                        className="text-xs font-bold"
                        style={{ color: color }}
                      >
                        {status}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vitals History */}
          {vitals.length > 1 && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '3px solid #10B981',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)',
              }}
              className="rounded-2xl p-6"
            >
              <h3 className="text-2xl font-bold mb-6" style={{ color: '#065F46' }}>
                Vitals History
              </h3>

              <div className="space-y-4">
                {vitals.slice(1).map((vital, index) => (
                  <div
                    key={vital.vital_id || index}
                    style={{
                      backgroundColor: '#F0FDF4',
                      borderLeft: '3px solid #10B981',
                    }}
                    className="rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2" style={{ color: '#10B981' }}>
                        <Calendar size={16} />
                        <span className="font-semibold">
                          {new Date(vital.recorded_at).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: '2-digit',
                          })}
                        </span>
                        <Clock size={14} />
                        <span className="text-sm">
                          {new Date(vital.recorded_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {Object.entries(vital).map(([key, value]) => {
                        if (!value || key === 'vital_id' || key === 'encounter_id' || key === 'recorded_at' || key === 'created_at') {
                          return null;
                        }

                        return (
                          <div key={key}>
                            <p style={{ color: '#10B981' }} className="text-xs font-bold uppercase mb-1">
                              {getVitalLabel(key)}
                            </p>
                            <p style={{ color: '#065F46' }} className="text-lg font-bold">
                              {value}
                              <span style={{ color: '#10B981' }} className="text-sm font-semibold ml-1">
                                {getVitalUnit(key)}
                              </span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VitalsPage;
