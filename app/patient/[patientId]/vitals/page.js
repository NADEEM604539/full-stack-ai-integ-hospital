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
      case 'blood_pressure_systolic':
        if (numValue < 120) return { color: '#10B981', status: 'Normal' };
        if (numValue < 140) return { color: '#F59E0B', status: 'Elevated' };
        return { color: '#D97706', status: 'High' };
      
      case 'heart_rate':
        if (numValue >= 60 && numValue <= 100) return { color: '#10B981', status: 'Normal' };
        if (numValue < 60) return { color: '#F59E0B', status: 'Low' };
        return { color: '#D97706', status: 'High' };
      
      case 'temperature_c':
        if (numValue >= 36.1 && numValue <= 37.2) return { color: '#10B981', status: 'Normal' };
        if (numValue < 36.1) return { color: '#F59E0B', status: 'Low' };
        return { color: '#D97706', status: 'High' };
      
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
      case 'blood_pressure_systolic':
      case 'blood_pressure_diastolic':
        return Heart;
      case 'heart_rate':
        return Activity;
      case 'temperature_c':
        return Thermometer;
      case 'oxygen_saturation':
        return Droplet;
      case 'weight_kg':
      case 'height_cm':
        return Activity;
      default:
        return Heart;
    }
  };

  const getVitalLabel = (type) => {
    switch (type) {
      case 'blood_pressure_systolic':
        return 'Blood Pressure (Systolic)';
      case 'blood_pressure_diastolic':
        return 'Blood Pressure (Diastolic)';
      case 'heart_rate':
        return 'Heart Rate';
      case 'temperature_c':
        return 'Body Temperature';
      case 'oxygen_saturation':
        return 'Oxygen Saturation';
      case 'weight_kg':
        return 'Weight';
      case 'height_cm':
        return 'Height';
      default:
        return type;
    }
  };

  const getVitalUnit = (type) => {
    switch (type) {
      case 'blood_pressure_systolic':
      case 'blood_pressure_diastolic':
        return 'mmHg';
      case 'heart_rate':
        return 'bpm';
      case 'temperature_c':
        return '°C';
      case 'oxygen_saturation':
        return '%';
      case 'weight_kg':
        return 'kg';
      case 'height_cm':
        return 'cm';
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
                {vitals[0] && (
                  <>
                    {/* Blood Pressure */}
                    {(vitals[0].blood_pressure_systolic || vitals[0].blood_pressure_diastolic) && (
                      <div
                        style={{
                          backgroundColor: '#F0FDF4',
                          borderLeft: `4px solid ${getVitalStatus('blood_pressure_systolic', vitals[0].blood_pressure_systolic).color}`,
                        }}
                        className="rounded-xl p-5"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p style={{ color: '#10B981' }} className="text-sm font-bold uppercase tracking-wider">
                            Blood Pressure
                          </p>
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: getVitalStatus('blood_pressure_systolic', vitals[0].blood_pressure_systolic).color }}
                          >
                            <Heart size={18} className="text-white" />
                          </div>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <p style={{ color: '#065F46' }} className="text-2xl font-bold">
                            {vitals[0].blood_pressure_systolic || '--'}/{vitals[0].blood_pressure_diastolic || '--'}
                          </p>
                          <p style={{ color: '#10B981' }} className="text-sm font-semibold">
                            mmHg
                          </p>
                        </div>
                        <p
                          className="text-xs font-bold"
                          style={{ color: getVitalStatus('blood_pressure_systolic', vitals[0].blood_pressure_systolic).color }}
                        >
                          {getVitalStatus('blood_pressure_systolic', vitals[0].blood_pressure_systolic).status}
                        </p>
                      </div>
                    )}

                    {/* Heart Rate */}
                    {vitals[0].heart_rate && (
                      <div
                        style={{
                          backgroundColor: '#F0FDF4',
                          borderLeft: `4px solid ${getVitalStatus('heart_rate', vitals[0].heart_rate).color}`,
                        }}
                        className="rounded-xl p-5"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p style={{ color: '#10B981' }} className="text-sm font-bold uppercase tracking-wider">
                            Heart Rate
                          </p>
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: getVitalStatus('heart_rate', vitals[0].heart_rate).color }}
                          >
                            <Activity size={18} className="text-white" />
                          </div>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <p style={{ color: '#065F46' }} className="text-2xl font-bold">
                            {vitals[0].heart_rate}
                          </p>
                          <p style={{ color: '#10B981' }} className="text-sm font-semibold">
                            bpm
                          </p>
                        </div>
                        <p
                          className="text-xs font-bold"
                          style={{ color: getVitalStatus('heart_rate', vitals[0].heart_rate).color }}
                        >
                          {getVitalStatus('heart_rate', vitals[0].heart_rate).status}
                        </p>
                      </div>
                    )}

                    {/* Temperature */}
                    {vitals[0].temperature_c && (
                      <div
                        style={{
                          backgroundColor: '#F0FDF4',
                          borderLeft: `4px solid ${getVitalStatus('temperature_c', vitals[0].temperature_c).color}`,
                        }}
                        className="rounded-xl p-5"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p style={{ color: '#10B981' }} className="text-sm font-bold uppercase tracking-wider">
                            Temperature
                          </p>
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: getVitalStatus('temperature_c', vitals[0].temperature_c).color }}
                          >
                            <Thermometer size={18} className="text-white" />
                          </div>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <p style={{ color: '#065F46' }} className="text-2xl font-bold">
                            {vitals[0].temperature_c}
                          </p>
                          <p style={{ color: '#10B981' }} className="text-sm font-semibold">
                            °C
                          </p>
                        </div>
                        <p
                          className="text-xs font-bold"
                          style={{ color: getVitalStatus('temperature_c', vitals[0].temperature_c).color }}
                        >
                          {getVitalStatus('temperature_c', vitals[0].temperature_c).status}
                        </p>
                      </div>
                    )}

                    {/* Oxygen Saturation */}
                    {vitals[0].oxygen_saturation && (
                      <div
                        style={{
                          backgroundColor: '#F0FDF4',
                          borderLeft: `4px solid ${getVitalStatus('oxygen_saturation', vitals[0].oxygen_saturation).color}`,
                        }}
                        className="rounded-xl p-5"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p style={{ color: '#10B981' }} className="text-sm font-bold uppercase tracking-wider">
                            O₂ Saturation
                          </p>
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: getVitalStatus('oxygen_saturation', vitals[0].oxygen_saturation).color }}
                          >
                            <Droplet size={18} className="text-white" />
                          </div>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <p style={{ color: '#065F46' }} className="text-2xl font-bold">
                            {vitals[0].oxygen_saturation}
                          </p>
                          <p style={{ color: '#10B981' }} className="text-sm font-semibold">
                            %
                          </p>
                        </div>
                        <p
                          className="text-xs font-bold"
                          style={{ color: getVitalStatus('oxygen_saturation', vitals[0].oxygen_saturation).color }}
                        >
                          {getVitalStatus('oxygen_saturation', vitals[0].oxygen_saturation).status}
                        </p>
                      </div>
                    )}

                    {/* Weight */}
                    {vitals[0].weight_kg && (
                      <div
                        style={{
                          backgroundColor: '#F0FDF4',
                          borderLeft: `4px solid #10B981`,
                        }}
                        className="rounded-xl p-5"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p style={{ color: '#10B981' }} className="text-sm font-bold uppercase tracking-wider">
                            Weight
                          </p>
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: '#10B981' }}
                          >
                            <Activity size={18} className="text-white" />
                          </div>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <p style={{ color: '#065F46' }} className="text-2xl font-bold">
                            {vitals[0].weight_kg}
                          </p>
                          <p style={{ color: '#10B981' }} className="text-sm font-semibold">
                            kg
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Height */}
                    {vitals[0].height_cm && (
                      <div
                        style={{
                          backgroundColor: '#F0FDF4',
                          borderLeft: `4px solid #10B981`,
                        }}
                        className="rounded-xl p-5"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p style={{ color: '#10B981' }} className="text-sm font-bold uppercase tracking-wider">
                            Height
                          </p>
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: '#10B981' }}
                          >
                            <Activity size={18} className="text-white" />
                          </div>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <p style={{ color: '#065F46' }} className="text-2xl font-bold">
                            {vitals[0].height_cm}
                          </p>
                          <p style={{ color: '#10B981' }} className="text-sm font-semibold">
                            cm
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Vitals by Appointment */}
          {vitals.length > 0 && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '3px solid #10B981',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)',
              }}
              className="rounded-2xl p-6"
            >
              <h3 className="text-2xl font-bold mb-6" style={{ color: '#065F46' }}>
                Vitals by Appointment
              </h3>

              <div className="space-y-6">
                {Object.values(
                  vitals.reduce((acc, vital) => {
                    const encounterId = vital.encounter_id || 'unknown';
                    if (!acc[encounterId]) {
                      acc[encounterId] = {
                        encounter_id: encounterId,
                        encounter_type: vital.encounter_type || 'General Appointment',
                        admission_date: vital.admission_date,
                        doctor_name: vital.doctor_name || 'Not assigned',
                        vitals: [],
                      };
                    }
                    acc[encounterId].vitals.push(vital);
                    return acc;
                  }, {})
                ).map((appointment, idx) => (
                  <div
                    key={appointment.encounter_id}
                    style={{
                      backgroundColor: '#F0FDF4',
                      border: '2px solid #E8F8F5',
                    }}
                    className="rounded-xl p-6"
                  >
                    {/* Appointment Header */}
                    <div className="mb-6 pb-4 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div style={{ backgroundColor: '#E8F8F5' }} className="rounded-lg p-2">
                            <Calendar size={20} style={{ color: '#10B981' }} />
                          </div>
                          <div>
                            <p style={{ color: '#059669' }} className="text-sm font-bold uppercase">
                              {appointment.encounter_type}
                            </p>
                            <p style={{ color: '#065F46' }} className="text-lg font-bold">
                              {new Date(appointment.admission_date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p style={{ color: '#10B981' }} className="text-xs font-bold uppercase">
                            Physician
                          </p>
                          <p style={{ color: '#065F46' }} className="font-semibold">
                            {appointment.doctor_name}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Vitals for this Appointment */}
                    <div className="space-y-4">
                      {appointment.vitals.map((vital, vitalIdx) => (
                        <div key={vital.vital_id || vitalIdx} className={vitalIdx > 0 ? 'border-t border-gray-200 pt-4' : ''}>
                          <div className="flex items-center gap-2 mb-4" style={{ color: '#10B981' }}>
                            <Clock size={14} />
                            <span className="text-sm font-semibold">
                              {new Date(vital.recorded_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {vital.blood_pressure_systolic && (
                              <div style={{ backgroundColor: '#FFFFFF' }} className="rounded-lg p-3 border border-gray-200">
                                <p style={{ color: '#059669' }} className="text-xs font-bold uppercase mb-1">BP Sys</p>
                                <p style={{ color: '#065F46' }} className="text-lg font-bold">{vital.blood_pressure_systolic}</p>
                                <p style={{ color: '#10B981' }} className="text-xs">mmHg</p>
                              </div>
                            )}
                            {vital.blood_pressure_diastolic && (
                              <div style={{ backgroundColor: '#FFFFFF' }} className="rounded-lg p-3 border border-gray-200">
                                <p style={{ color: '#059669' }} className="text-xs font-bold uppercase mb-1">BP Dia</p>
                                <p style={{ color: '#065F46' }} className="text-lg font-bold">{vital.blood_pressure_diastolic}</p>
                                <p style={{ color: '#10B981' }} className="text-xs">mmHg</p>
                              </div>
                            )}
                            {vital.heart_rate && (
                              <div style={{ backgroundColor: '#FFFFFF' }} className="rounded-lg p-3 border border-gray-200">
                                <p style={{ color: '#059669' }} className="text-xs font-bold uppercase mb-1">HR</p>
                                <p style={{ color: '#065F46' }} className="text-lg font-bold">{vital.heart_rate}</p>
                                <p style={{ color: '#10B981' }} className="text-xs">bpm</p>
                              </div>
                            )}
                            {vital.temperature_c && (
                              <div style={{ backgroundColor: '#FFFFFF' }} className="rounded-lg p-3 border border-gray-200">
                                <p style={{ color: '#059669' }} className="text-xs font-bold uppercase mb-1">Temp</p>
                                <p style={{ color: '#065F46' }} className="text-lg font-bold">{vital.temperature_c}</p>
                                <p style={{ color: '#10B981' }} className="text-xs">°C</p>
                              </div>
                            )}
                            {vital.oxygen_saturation && (
                              <div style={{ backgroundColor: '#FFFFFF' }} className="rounded-lg p-3 border border-gray-200">
                                <p style={{ color: '#059669' }} className="text-xs font-bold uppercase mb-1">O₂</p>
                                <p style={{ color: '#065F46' }} className="text-lg font-bold">{vital.oxygen_saturation}</p>
                                <p style={{ color: '#10B981' }} className="text-xs">%</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
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
