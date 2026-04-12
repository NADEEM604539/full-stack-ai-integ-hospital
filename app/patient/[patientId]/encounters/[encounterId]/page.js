'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  FileText,
  Download,
  User,
  Calendar,
  Stethoscope,
  Activity,
  Pill,
  ClipboardList,
  Heart,
  Thermometer,
  Wind,
  Droplet,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const EncounterDetailPage = () => {
  const { patientId, encounterId } = useParams();
  const router = useRouter();
  const soapRef = useRef();
  const [soap, setSOAP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchSOAP();
  }, [patientId, encounterId]);

  const fetchSOAP = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/patient/${patientId}/encounters/${encounterId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch SOAP details');
      }

      const data = await response.json();
      setSOAP(data.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching SOAP:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      setDownloading(true);
      const element = soapRef.current;
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297; // A4 height in mm

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      pdf.save(`SOAP_${soap.encounter.encounter_id}_${new Date().toISOString().split('T')[0]}.pdf`);
      setDownloading(false);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download PDF');
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF' }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-emerald-600"></div>
          <p className="mt-6 text-lg" style={{ color: '#065F46' }}>
            Loading SOAP details...
          </p>
        </div>
      </div>
    );
  }

  if (!soap) {
    return (
      <div style={{ backgroundColor: '#FFFFFF' }} className="min-h-screen flex items-center justify-center p-6">
        <div
          style={{
            backgroundColor: '#FFD9E8',
            border: '3px solid #F59E0B',
          }}
          className="rounded-2xl p-12 text-center max-w-md"
        >
          <AlertCircle size={48} style={{ color: '#D97706' }} className="mx-auto mb-4" />
          <h3 className="text-xl font-bold" style={{ color: '#065F46' }}>
            SOAP Not Found
          </h3>
          <p style={{ color: '#065F46' }} className="mt-2">
            This encounter does not have a SOAP note yet.
          </p>
        </div>
      </div>
    );
  }

  const enc = soap.encounter;

  return (
    <div style={{ backgroundColor: '#F0FDF4' }} className="min-h-screen py-8 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-emerald-100 hover:text-white transition mb-6 font-semibold"
          style={{ color: '#10B981' }}
        >
          <ChevronLeft size={20} />
          Back
        </button>

        {/* Title and Download Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#065F46' }}>
              SOAP Note
            </h1>
            <p style={{ color: '#10B981' }} className="text-lg">
              {new Date(enc.admission_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          {soap.soapComplete && (
            <button
              onClick={downloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 text-white px-6 py-3 rounded-lg font-semibold transition hover:opacity-90"
              style={{
                backgroundColor: downloading ? '#10B98166' : '#10B981',
              }}
            >
              <Download size={20} />
              {downloading ? 'Generating PDF...' : 'Download PDF'}
            </button>
          )}
        </div>

        {/* Completeness Status */}
        <div className="mb-8 p-4 rounded-lg flex items-center gap-3" style={{
          backgroundColor: soap.soapComplete ? '#E8F8F5' : '#FFE4F5',
          borderLeft: `4px solid ${soap.soapComplete ? '#10B981' : '#F59E0B'}`,
        }}>
          {soap.soapComplete ? (
            <>
              <CheckCircle2 size={24} style={{ color: '#10B981' }} />
              <div>
                <p style={{ color: '#10B981' }} className="font-semibold">SOAP Complete</p>
                <p style={{ color: '#065F46' }} className="text-sm">All components documented</p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle size={24} style={{ color: '#F59E0B' }} />
              <div>
                <p style={{ color: '#D97706' }} className="font-semibold">SOAP Incomplete</p>
                <p style={{ color: '#065F46' }} className="text-sm">Some components are missing</p>
              </div>
            </>
          )}
        </div>

        {/* SOAP Document */}
        <div
          ref={soapRef}
          style={{
            backgroundColor: '#FFFFFF',
            border: '3px solid #10B981',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
          className="rounded-2xl overflow-hidden"
        >
          {/* Encounter Header */}
          <div style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }} className="p-8 text-white">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-white text-sm font-bold uppercase tracking-wide">Encounter Type</p>
                <p className="text-2xl font-bold mt-2">{enc.encounter_type}</p>
              </div>
              <div>
                <p className="text-white text-sm font-bold uppercase tracking-wide">Department</p>
                <p className="text-2xl font-bold mt-2">{enc.department_name || 'General'}</p>
              </div>
              <div>
                <p className="text-white text-sm font-bold uppercase tracking-wide">Attending Physician</p>
                <p className="text-2xl font-bold mt-2">{enc.doctor_name || 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-white text-sm font-bold uppercase tracking-wide">Status</p>
                <p className="text-2xl font-bold mt-2">{enc.status}</p>
              </div>
            </div>
            {enc.chief_complaint && (
              <div style={{ backgroundColor: 'rgba(0,0,0,0.15)' }} className="rounded-lg p-4">
                <p className="text-white text-sm font-bold uppercase tracking-wide">Chief Complaint</p>
                <p className="text-white mt-2 text-lg font-semibold">{enc.chief_complaint}</p>
              </div>
            )}
          </div>

          {/* SOAP Content */}
          <div className="p-8 space-y-8" style={{ backgroundColor: '#FFFFFF' }}>
            {/* Subjective */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div style={{ backgroundColor: '#E8F8F5' }} className="rounded-lg p-3">
                  <User size={24} style={{ color: '#10B981' }} />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: '#065F46' }}>
                  Subjective (S)
                </h2>
              </div>
              {soap.subjective ? (
                <div style={{ backgroundColor: '#FFFFFF', border: '2px solid #E8F8F5' }} className="rounded-lg p-6 space-y-4">
                  <div>
                    <p style={{ color: '#059669' }} className="text-sm font-bold uppercase">Patient Complaint</p>
                    <p style={{ color: '#065F46' }} className="mt-2 text-lg font-semibold">{soap.subjective.patient_complaint}</p>
                  </div>
                  {soap.subjective.symptom_duration && (
                    <div>
                      <p style={{ color: '#059669' }} className="text-sm font-bold uppercase">Duration</p>
                      <p style={{ color: '#065F46' }} className="mt-1 font-semibold">{soap.subjective.symptom_duration}</p>
                    </div>
                  )}
                  {soap.subjective.severity_level && (
                    <div>
                      <p style={{ color: '#059669' }} className="text-sm font-bold uppercase">Severity</p>
                      <p style={{ color: '#065F46' }} className="mt-1 font-semibold">{soap.subjective.severity_level}/10</p>
                    </div>
                  )}
                  {soap.subjective.affecting_daily_activities && (
                    <div style={{ backgroundColor: '#FFE4D6', borderLeft: '4px solid #F59E0B' }} className="p-4 rounded">
                      <p style={{ color: '#D97706' }} className="font-bold">⚠️ Affecting Daily Activities</p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ backgroundColor: '#FFE4F5', borderLeft: '4px solid #F59E0B' }} className="rounded-lg p-6">
                  <AlertCircle size={20} style={{ color: '#D97706' }} className="inline mr-2" />
                  <p style={{ color: '#D97706' }} className="font-medium">Not documented</p>
                </div>
              )}
            </div>

            {/* Objective */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div style={{ backgroundColor: '#E8F8F5' }} className="rounded-lg p-3">
                  <Activity size={24} style={{ color: '#10B981' }} />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: '#065F46' }}>
                  Objective (O)
                </h2>
              </div>
              {soap.objective ? (
                <div style={{ backgroundColor: '#FFFFFF', border: '2px solid #E8F8F5' }} className="rounded-lg p-6 space-y-4">
                  {soap.objective.physical_examination && (
                    <div>
                      <p style={{ color: '#059669' }} className="text-sm font-bold uppercase">Physical Examination</p>
                      <p style={{ color: '#065F46' }} className="mt-2 font-semibold">{soap.objective.physical_examination}</p>
                    </div>
                  )}
                  {soap.objective.lab_findings && (
                    <div>
                      <p style={{ color: '#059669' }} className="text-sm font-bold uppercase">Lab Findings</p>
                      <p style={{ color: '#065F46' }} className="mt-2 font-semibold">{soap.objective.lab_findings}</p>
                    </div>
                  )}
                  {soap.objective.imaging_results && (
                    <div>
                      <p style={{ color: '#059669' }} className="text-sm font-bold uppercase">Imaging Results</p>
                      <p style={{ color: '#065F46' }} className="mt-2 font-semibold">{soap.objective.imaging_results}</p>
                    </div>
                  )}
                  {soap.objective.other_findings && (
                    <div>
                      <p style={{ color: '#059669' }} className="text-sm font-bold uppercase">Other Findings</p>
                      <p style={{ color: '#065F46' }} className="mt-2 font-semibold">{soap.objective.other_findings}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ backgroundColor: '#FFE4F5', borderLeft: '4px solid #F59E0B' }} className="rounded-lg p-6">
                  <AlertCircle size={20} style={{ color: '#D97706' }} className="inline mr-2" />
                  <p style={{ color: '#D97706' }} className="font-medium">Not documented</p>
                </div>
              )}
            </div>

            {/* Assessment */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div style={{ backgroundColor: '#E8F8F5' }} className="rounded-lg p-3">
                  <Stethoscope size={24} style={{ color: '#10B981' }} />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: '#065F46' }}>
                  Assessment (A)
                </h2>
              </div>
              {soap.assessment ? (
                <div style={{ backgroundColor: '#FFFFFF', border: '2px solid #E8F8F5' }} className="rounded-lg p-6 space-y-4">
                  <div>
                    <p style={{ color: '#059669' }} className="text-sm font-bold uppercase">Primary Diagnosis</p>
                    <p style={{ color: '#065F46' }} className="mt-2 text-lg font-bold">{soap.assessment.primary_diagnosis}</p>
                    {soap.assessment.icd10_code && (
                      <p style={{ color: '#059669' }} className="text-sm font-semibold mt-1">ICD-10: {soap.assessment.icd10_code}</p>
                    )}
                  </div>
                  {soap.assessment.differential_diagnoses && (
                    <div>
                      <p style={{ color: '#059669' }} className="text-sm font-bold uppercase">Differential Diagnoses</p>
                      <p style={{ color: '#065F46' }} className="mt-2 font-semibold">{soap.assessment.differential_diagnoses}</p>
                    </div>
                  )}
                  {soap.assessment.clinical_reasoning && (
                    <div>
                      <p style={{ color: '#059669' }} className="text-sm font-bold uppercase">Clinical Reasoning</p>
                      <p style={{ color: '#065F46' }} className="mt-2 font-semibold">{soap.assessment.clinical_reasoning}</p>
                    </div>
                  )}
                  {soap.assessment.severity_level && (
                    <div>
                      <p style={{ color: '#059669' }} className="text-sm font-bold uppercase">Severity</p>
                      <p style={{ color: '#065F46' }} className="mt-1 font-semibold">{soap.assessment.severity_level}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ backgroundColor: '#FFE4F5', borderLeft: '4px solid #F59E0B' }} className="rounded-lg p-6">
                  <AlertCircle size={20} style={{ color: '#D97706' }} className="inline mr-2" />
                  <p style={{ color: '#D97706' }} className="font-medium">Not documented</p>
                </div>
              )}
            </div>

            {/* Plan */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div style={{ backgroundColor: '#E8F8F5' }} className="rounded-lg p-3">
                  <ClipboardList size={24} style={{ color: '#10B981' }} />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: '#065F46' }}>
                  Plan (P)
                </h2>
              </div>
              {soap.plan ? (
                <div style={{ backgroundColor: '#FFFFFF', border: '2px solid #E8F8F5' }} className="rounded-lg p-6 space-y-4">
                  {soap.plan.treatment_plan && (
                    <div>
                      <p style={{ color: '#059669' }} className="text-sm font-bold uppercase">Treatment Plan</p>
                      <p style={{ color: '#065F46' }} className="mt-2 font-semibold">{soap.plan.treatment_plan}</p>
                    </div>
                  )}
                  {soap.plan.medication_plan && (
                    <div>
                      <p style={{ color: '#059669' }} className="text-sm font-bold uppercase">Medications</p>
                      <p style={{ color: '#065F46' }} className="mt-2 font-semibold">{soap.plan.medication_plan}</p>
                    </div>
                  )}
                  {soap.plan.follow_up_plan && (
                    <div>
                      <p style={{ color: '#059669' }} className="text-sm font-bold uppercase">Follow-up Plan</p>
                      <p style={{ color: '#065F46' }} className="mt-2 font-semibold">{soap.plan.follow_up_plan}</p>
                    </div>
                  )}
                  {soap.plan.patient_education && (
                    <div>
                      <p style={{ color: '#059669' }} className="text-sm font-bold uppercase">Patient Education</p>
                      <p style={{ color: '#065F46' }} className="mt-2 font-semibold">{soap.plan.patient_education}</p>
                    </div>
                  )}
                  {soap.plan.referrals && (
                    <div>
                      <p style={{ color: '#059669' }} className="text-sm font-bold uppercase">Referrals</p>
                      <p style={{ color: '#065F46' }} className="mt-2 font-semibold">{soap.plan.referrals}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ backgroundColor: '#FFE4F5', borderLeft: '4px solid #F59E0B' }} className="rounded-lg p-6">
                  <AlertCircle size={20} style={{ color: '#D97706' }} className="inline mr-2" />
                  <p style={{ color: '#D97706' }} className="font-medium">Not documented</p>
                </div>
              )}
            </div>

            {/* Vitals */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div style={{ backgroundColor: '#E8F8F5' }} className="rounded-lg p-3">
                  <Heart size={24} style={{ color: '#10B981' }} />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: '#065F46' }}>
                  Vital Signs
                </h2>
              </div>
              {soap.vitals && soap.vitals.length > 0 ? (
                <div style={{ backgroundColor: '#FFFFFF', border: '2px solid #E8F8F5' }} className="rounded-lg p-6">
                  {soap.vitals.map((vital, idx) => (
                    <div key={vital.vital_id || idx} className={idx > 0 ? 'border-t border-gray-200 pt-6 mt-6' : ''}>
                      <p style={{ color: '#059669' }} className="text-sm font-bold uppercase mb-4">
                        Recorded: {new Date(vital.recorded_at).toLocaleString()}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {(vital.blood_pressure_systolic || vital.blood_pressure_diastolic) && (
                          <div style={{ backgroundColor: '#F0FDF4' }} className="rounded-lg p-4">
                            <p style={{ color: '#059669' }} className="text-xs font-bold uppercase">Blood Pressure</p>
                            <p style={{ color: '#065F46' }} className="text-xl font-bold mt-2">
                              {vital.blood_pressure_systolic || '--'}/{vital.blood_pressure_diastolic || '--'} mmHg
                            </p>
                          </div>
                        )}
                        {vital.heart_rate && (
                          <div style={{ backgroundColor: '#F0FDF4' }} className="rounded-lg p-4">
                            <p style={{ color: '#059669' }} className="text-xs font-bold uppercase">Heart Rate</p>
                            <p style={{ color: '#065F46' }} className="text-xl font-bold mt-2">{vital.heart_rate} bpm</p>
                          </div>
                        )}
                        {vital.temperature_c && (
                          <div style={{ backgroundColor: '#F0FDF4' }} className="rounded-lg p-4">
                            <p style={{ color: '#059669' }} className="text-xs font-bold uppercase">Temperature</p>
                            <p style={{ color: '#065F46' }} className="text-xl font-bold mt-2">{vital.temperature_c}°C</p>
                          </div>
                        )}
                        {vital.oxygen_saturation && (
                          <div style={{ backgroundColor: '#F0FDF4' }} className="rounded-lg p-4">
                            <p style={{ color: '#059669' }} className="text-xs font-bold uppercase">O₂ Saturation</p>
                            <p style={{ color: '#065F46' }} className="text-xl font-bold mt-2">{vital.oxygen_saturation}%</p>
                          </div>
                        )}
                        {vital.weight_kg && (
                          <div style={{ backgroundColor: '#F0FDF4' }} className="rounded-lg p-4">
                            <p style={{ color: '#059669' }} className="text-xs font-bold uppercase">Weight</p>
                            <p style={{ color: '#065F46' }} className="text-xl font-bold mt-2">{vital.weight_kg} kg</p>
                          </div>
                        )}
                        {vital.height_cm && (
                          <div style={{ backgroundColor: '#F0FDF4' }} className="rounded-lg p-4">
                            <p style={{ color: '#059669' }} className="text-xs font-bold uppercase">Height</p>
                            <p style={{ color: '#065F46' }} className="text-xl font-bold mt-2">{vital.height_cm} cm</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ backgroundColor: '#FFE4F5', borderLeft: '4px solid #F59E0B' }} className="rounded-lg p-6">
                  <AlertCircle size={20} style={{ color: '#D97706' }} className="inline mr-2" />
                  <p style={{ color: '#D97706' }} className="font-medium">No vital signs recorded</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EncounterDetailPage;
