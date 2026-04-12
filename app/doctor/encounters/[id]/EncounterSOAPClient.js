'use client';

import { useState, useEffect } from 'react';
import {
  Loader,
  AlertCircle,
  CheckCircle,
  Send,
  Zap,
  Edit2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import Link from 'next/link';
import DoctorMedicalHistorySection from '../DoctorMedicalHistorySection';

export default function EncounterSOAPClient({ encounterId }) {
  const [encounter, setEncounter] = useState(null);
  const [patientContext, setPatientContext] = useState(null);

  // SUBJECTIVE
  const [subjectiveInput, setSubjectiveInput] = useState('');

  // OBJECTIVE - Vitals & Physical Exam
  const [temperature, setTemperature] = useState('');
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [oxygenSat, setOxygenSat] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [physicalExamInput, setPhysicalExamInput] = useState('');
  const [labFindingsInput, setLabFindingsInput] = useState('');

  // ASSESSMENT
  const [assessmentInput, setAssessmentInput] = useState('');
  const [differentialInput, setDifferentialInput] = useState('');

  // PLAN
  const [planInput, setPlanInput] = useState('');
  const [medicationInput, setMedicationInput] = useState('');

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState(null);

  const [aiResponse, setAiResponse] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  const [expandedSections, setExpandedSections] = useState({
    context: true,
    vitals: true,
    exam: false,
    assessment: true,
    plan: true,
  });

  useEffect(() => {
    fetchEncounterData();
  }, [encounterId]);

  const fetchEncounterData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/doctor/encounters/${encounterId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch encounter data');
      }

      const data = await res.json();
      setEncounter(data.encounter);
      setPatientContext(data.patientContext);

      // Load existing SOAP notes and vitals
      if (data.patientContext?.vitals) {
        const v = data.patientContext.vitals;
        setTemperature(v.temperature || '');
        setBpSystolic(v.bpSystolic || '');
        setBpDiastolic(v.bpDiastolic || '');
        setHeartRate(v.heartRate || '');
        setOxygenSat(v.oxygenSaturation || '');
        setWeight(v.weight || '');
        setHeight(v.height || '');
      }

      if (data.soapNotes) {
        const s = data.soapNotes.subjective;
        setSubjectiveInput(
          typeof s === 'string' ? s : s?.complaint || ''
        );

        const o = data.soapNotes.objective;
        setPhysicalExamInput(
          typeof o === 'string' ? o : o?.examination || ''
        );
        setLabFindingsInput(
          typeof o === 'object' ? (o?.labFindings || '') : ''
        );

        const a = data.soapNotes.assessment;
        setAssessmentInput(
          typeof a === 'string' ? a : a?.primaryDiagnosis || ''
        );
        
        // Auto-fill differentials if exist
        if (typeof a === 'object' && a?.aiDifferentialRanks) {
          const ranks = a.aiDifferentialRanks;
          if (typeof ranks === 'string') {
             setDifferentialInput(ranks);
          } else if (Array.isArray(ranks)) {
            let diffText = '';
            ranks.forEach((diag, idx) => {
              diffText += `${idx + 1}. ${diag.diagnosis} ${diag.probability_percent ? `(${diag.probability_percent}%)` : ''}\n`;
              if (diag.reasoning) diffText += `   Reasoning: ${diag.reasoning}\n`;
            });
            setDifferentialInput(diffText.trim());
          }
        }

        const p = data.soapNotes.plan;
        setPlanInput(
          typeof p === 'string' ? p : p?.treatment || ''
        );

        // Auto-fill medications if exist
        if (typeof p === 'object' && p?.medication) {
          const meds = p.medication;
          if (typeof meds === 'string') {
             setMedicationInput(meds);
          } else if (Array.isArray(meds)) {
             let medText = '';
             meds.forEach((med, idx) => {
                medText += `${idx + 1}. ${med.drug_name}`;
                const details = [med.strength, med.route, med.frequency].filter(Boolean).join(' • ');
                if (details) medText += `\n   Dose: ${details}`;
                if (med.indication) medText += `\n   Indication: ${med.indication}\n`;
                else medText += '\n';
             });
             setMedicationInput(medText.trim());
          }
        }
      }
    } catch (err) {
      console.error('Error fetching encounter:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeWithAI = async () => {
    try {
      setAnalyzing(true);
      setAiError(null);
      setAiResponse(null);
      setShowAISuggestions(false);

      // Build clinical data with patient context
      const clinicalData = buildClinicalDataWithContext();

      const res = await fetch('/api/doctor/soap-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encounterId,
          clinicalData,
          subjective: subjectiveInput,
          objective: buildObjectiveText(),
          assessment: assessmentInput,
          plan: planInput,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error ||
            (res.status === 504 ? 'AI analysis timeout (30-35 second limit)' : 'Failed to analyze SOAP')
        );
      }

      const data = await res.json();
      console.log('🤖 RAW AI RESPONSE:', JSON.stringify(data, null, 2));

      // Parse AI response and populate textareas
      if (data.aiSuggestions) {
        const suggestions = data.aiSuggestions;
        console.log('📊 PARSING AI SUGGESTIONS...');
        
        // Try to extract from structured_soap if available
        if (suggestions.structured_soap) {
          const soap = suggestions.structured_soap;
          console.log('✅ Found structured_soap in response');

          // ============ SUBJECTIVE ============
          if (soap.subjective) {
            const subj = soap.subjective;
            const subjectiveText = [
              subj.chief_complaint && `Chief Complaint: ${subj.chief_complaint}`,
              subj.history_of_present_illness && `History: ${subj.history_of_present_illness}`,
              subj.relevant_medical_history && subj.relevant_medical_history !== 'Not provided' && `Medical History: ${subj.relevant_medical_history}`,
              subj.current_medications && subj.current_medications !== 'Not provided' && `Medications: ${subj.current_medications}`,
              subj.allergies && subj.allergies !== 'Not provided' && `Allergies: ${subj.allergies}`,
            ]
              .filter(Boolean)
              .join('\n');

            if (subjectiveText) {
              console.log('📝 SETTING SUBJECTIVE:', subjectiveText);
              setSubjectiveInput(subjectiveText);
            }
          }

          // ============ OBJECTIVE ============
          if (soap.objective) {
            const obj = soap.objective;
            
            // Physical Examination
            let physicalExamText = '';
            if (obj.physical_examination && obj.physical_examination !== 'Not provided') {
              physicalExamText = obj.physical_examination;
              console.log('🔬 SETTING PHYSICAL EXAM:', physicalExamText);
              setPhysicalExamInput(physicalExamText);
            }

            // Lab Findings & Imaging Results
            let labText = '';
            if (obj.lab_results && obj.lab_results !== 'Not provided') {
              labText += obj.lab_results;
            }
            if (obj.imaging_results && obj.imaging_results !== 'Not provided') {
              labText += (labText ? '\n' : '') + obj.imaging_results;
            }
            if (labText) {
              console.log('🧪 SETTING LAB FINDINGS:', labText);
              setLabFindingsInput(labText);
            }

            // Vital signs extraction (AUTO-FILL from AI response)
            if (obj.vital_signs) {
              const vs = obj.vital_signs;
              console.log('💉 EXTRACTING VITALS FROM AI RESPONSE:', vs);
              
              if (vs.temperature && vs.temperature !== 'Not provided') {
                const tempMatch = vs.temperature.match(/(\d+(?:\.\d+)?)/);
                if (tempMatch) {
                  console.log('  • Temperature:', tempMatch[1]);
                  setTemperature(tempMatch[1]);
                }
              }
              if (vs.blood_pressure && vs.blood_pressure !== 'Not provided') {
                const bpMatch = vs.blood_pressure.match(/(\d+)\s*\/\s*(\d+)/);
                if (bpMatch) {
                  console.log('  • BP:', bpMatch[1], '/', bpMatch[2]);
                  setBpSystolic(bpMatch[1]);
                  setBpDiastolic(bpMatch[2]);
                }
              }
              if (vs.heart_rate && vs.heart_rate !== 'Not provided') {
                const hrMatch = vs.heart_rate.match(/(\d+)/);
                if (hrMatch) {
                  console.log('  • Heart Rate:', hrMatch[1]);
                  setHeartRate(hrMatch[1]);
                }
              }
              if (vs.oxygen_saturation && vs.oxygen_saturation !== 'Not provided') {
                const o2Match = vs.oxygen_saturation.match(/(\d+(?:\.\d+)?)/);
                if (o2Match) {
                  console.log('  • O2 Saturation:', o2Match[1]);
                  setOxygenSat(o2Match[1]);
                }
              }
              if (vs.weight && vs.weight !== 'Not provided') {
                const weightMatch = vs.weight.match(/(\d+(?:\.\d+)?)/);
                if (weightMatch) {
                  console.log('  • Weight:', weightMatch[1]);
                  setWeight(weightMatch[1]);
                }
              }
              if (vs.height && vs.height !== 'Not provided') {
                const heightMatch = vs.height.match(/(\d+(?:\.\d+)?)/);
                if (heightMatch) {
                  console.log('  • Height:', heightMatch[1]);
                  setHeight(heightMatch[1]);
                }
              }
            }
          }

          // ============ ASSESSMENT ============
          if (soap.assessment || suggestions.differentialDiagnoses?.length > 0) {
            const ass = soap.assessment || {};
            let assessmentParts = [];
            
            if (ass.structured) assessmentParts.push(`Primary Diagnosis: ${ass.structured}`);
            if (ass.note) assessmentParts.push(`Clinical Analysis: ${ass.note}`);
            
            if (suggestions.differentialDiagnoses && suggestions.differentialDiagnoses.length > 0) {
              let diffText = '';
              suggestions.differentialDiagnoses.forEach((diag, idx) => {
                diffText += `${idx + 1}. ${diag.diagnosis} ${diag.probability_percent ? `(${diag.probability_percent}%)` : ''}\n`;
                if (diag.reasoning) diffText += `   Reasoning: ${diag.reasoning}\n`;
              });
              setDifferentialInput(diffText.trim());
            }

            const assessmentText = assessmentParts.join('\n\n');

            if (assessmentText) {
              console.log('🎯 SETTING ASSESSMENT:', assessmentText);
              setAssessmentInput(assessmentText);
            }
          }

          // ============ PLAN ============
          if (soap.plan || suggestions.medicationRecommendations?.length > 0) {
            const pl = soap.plan || {};
            let planParts = [];
            
            if (pl.immediate_actions) planParts.push(`Immediate Actions:\n${pl.immediate_actions}`);
            if (pl.follow_up) planParts.push(`Follow-up:\n${pl.follow_up}`);
            
            if (suggestions.medicationRecommendations && suggestions.medicationRecommendations.length > 0) {
              let medText = '';
              suggestions.medicationRecommendations.forEach((med, idx) => {
                medText += `${idx + 1}. ${med.drug_name}`;
                const details = [med.strength, med.route, med.frequency].filter(Boolean).join(' • ');
                if (details) medText += `\n   Dose: ${details}`;
                if (med.indication) medText += `\n   Indication: ${med.indication}\n`;
                else medText += '\n';
              });
              setMedicationInput(medText.trim());
            }

            if (pl.warnings) planParts.push(`⚠️ WARNINGS:\n${pl.warnings}`);

            const planText = planParts.join('\n\n');

            if (planText) {
              console.log('📋 SETTING PLAN:', planText);
              setPlanInput(planText);
            }
          }

          console.log('✅ ALL SECTIONS POPULATED FROM AI RESPONSE');
        } else {
          console.log('⚠️ No structured_soap found. Response structure:', Object.keys(suggestions));
        }

        setAiResponse(data.aiSuggestions);
        setShowAISuggestions(true);
      }
    } catch (err) {
      console.error('Error analyzing SOAP:', err);
      setAiError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const buildClinicalDataWithContext = () => {
    let context = '';

    // Patient demographics & history
    if (encounter) {
      context += `PATIENT PROFILE:\n`;
      context += `Name: ${encounter.first_name} ${encounter.last_name}\n`;
      context += `MRN: ${encounter.mrn}\n`;
      context += `DOB: ${encounter.date_of_birth}\n`;
      context += `Blood Type: ${encounter.blood_type}\n\n`;
    }

    // Medical history
    if (patientContext?.medicalHistory) {
      context += `MEDICAL HISTORY:\n`;
      
      if (patientContext.medicalHistory.allergies?.length > 0) {
        context += `ALLERGIES:\n`;
        patientContext.medicalHistory.allergies.forEach(a => {
          context += `- ${a.description}${a.severity ? ` (${a.severity})` : ''}\n`;
        });
        context += '\n';
      }

      if (patientContext.medicalHistory.chronicConditions?.length > 0) {
        context += `CHRONIC CONDITIONS:\n`;
        patientContext.medicalHistory.chronicConditions.forEach(c => {
          context += `- ${c.description}\n`;
        });
        context += '\n';
      }

      if (patientContext.medicalHistory.previousSurgeries?.length > 0) {
        context += `PREVIOUS SURGERIES:\n`;
        patientContext.medicalHistory.previousSurgeries.forEach(s => {
          context += `- ${s.description}\n`;
        });
        context += '\n';
      }

      if (patientContext.medicalHistory.familyHistory?.length > 0) {
        context += `FAMILY HISTORY:\n`;
        patientContext.medicalHistory.familyHistory.forEach(f => {
          context += `- ${f.description}\n`;
        });
        context += '\n';
      }
    }

    // Current vitals
    context += `CURRENT VITALS:\n`;
    context += `Temperature: ${temperature}°C\n`;
    context += `BP: ${bpSystolic}/${bpDiastolic} mmHg\n`;
    context += `Heart Rate: ${heartRate} bpm\n`;
    context += `O2 Saturation: ${oxygenSat}%\n`;
    context += `Weight: ${weight} kg\n`;
    context += `Height: ${height} cm\n\n`;

    // SOAP Notes
    context += `SUBJECTIVE (Chief Complaint & History):\n${subjectiveInput || 'Not entered'}\n\n`;
    context += `OBJECTIVE (Physical Exam, Labs, Imaging):\n${buildObjectiveText()}\n\n`;
    context += `ASSESSMENT (Diagnosis & Clinical Reasoning):\n${assessmentInput || 'Not entered'}\n\n`;
    context += `PLAN (Treatment, Medications, Follow-up):\n${planInput || 'Not entered'}\n`;

    return context;
  };

  const buildObjectiveText = () => {
    let objective = `Physical Examination: ${physicalExamInput}\n`;
    if (labFindingsInput) {
      objective += `Lab Findings: ${labFindingsInput}`;
    }
    return objective;
  };

  const handleSaveSOAPNotes = async () => {
    try {
      setSaving(true);
      setError(null);

      const res = await fetch(`/api/doctor/encounters/${encounterId}/soap-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjective: subjectiveInput,
          objective: buildObjectiveText(),
          assessment: assessmentInput,
          plan: planInput,
          // Include vitals
          temperature: temperature || null,
          bpSystolic: bpSystolic || null,
          bpDiastolic: bpDiastolic || null,
          heartRate: heartRate || null,
          oxygenSat: oxygenSat || null,
          weight: weight || null,
          height: height || null,
          // Include AI Extra Data for Database Storage
          aiDifferentialDiagnoses: differentialInput ? JSON.stringify(differentialInput) : null,
          aiMedicationPlan: medicationInput ? JSON.stringify(medicationInput) : null
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save SOAP notes');
      }

      const data = await res.json();
      console.log('✅ Save Response:', data);
      alert('✅ SOAP notes saved successfully!');
      setShowAISuggestions(false);
    } catch (err) {
      console.error('Error saving SOAP notes:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkDone = async () => {
    try {
      setCompleting(true);
      setError(null);

      // First, save SOAP notes if there are unsaved changes
      if (subjectiveInput.trim() || assessmentInput.trim() || planInput.trim()) {
        const saveRes = await fetch(`/api/doctor/encounters/${encounterId}/soap-notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjective: subjectiveInput,
            objective: buildObjectiveText(),
            assessment: assessmentInput,
            plan: planInput,
            temperature: temperature || null,
            bpSystolic: bpSystolic || null,
            bpDiastolic: bpDiastolic || null,
            heartRate: heartRate || null,
            oxygenSat: oxygenSat || null,
            weight: weight || null,
            height: height || null,
            aiDifferentialDiagnoses: differentialInput ? JSON.stringify(differentialInput) : null,
            aiMedicationPlan: medicationInput ? JSON.stringify(medicationInput) : null
          }),
        });

        if (!saveRes.ok) {
          throw new Error('Failed to save SOAP notes before completing encounter');
        }
      }

      // Then mark encounter as complete
      const completeRes = await fetch(`/api/doctor/encounters/${encounterId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!completeRes.ok) {
        const errorData = await completeRes.json();
        throw new Error(errorData.error || 'Failed to complete encounter');
      }

      const data = await completeRes.json();
      console.log('✅ Encounter Completed:', data);
      alert('✅ Encounter marked as complete and appointment updated!');
      
      // Redirect back to appointments
      setTimeout(() => {
        window.location.href = '/doctor/appointments';
      }, 1500);
    } catch (err) {
      console.error('Error completing encounter:', err);
      setError(err.message);
    } finally {
      setCompleting(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} color="#3B82F6" className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading encounter...</p>
        </div>
      </div>
    );
  }

  if (error && !encounter) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8">
        <div className="p-6 rounded-2xl flex gap-4 border-l-4" style={{ backgroundColor: '#FFE4D6', borderColor: '#E74C3C' }}>
          <AlertCircle size={24} color="#E74C3C" />
          <div>
            <p className="font-bold" style={{ color: '#C0392B' }}>Error</p>
            <p style={{ color: '#922B21' }} className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }} className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/doctor/appointments`}
          className="inline-flex items-center gap-2 text-sm font-semibold mb-4"
          style={{ color: '#3B82F6' }}
        >
          ← Back to Appointments
        </Link>
        <h1 className="text-4xl font-bold" style={{ color: '#1E40AF' }}>
          SOAP Notes - Encounter {encounterId}
        </h1>
        <p style={{ color: '#6B7280' }} className="text-sm mt-2">
          Document clinical findings and plan
        </p>
      </div>

      {error && (
        <div className="mb-8 p-6 rounded-2xl flex gap-4 border-l-4" style={{ backgroundColor: '#FFE4D6', borderColor: '#E74C3C' }}>
          <AlertCircle size={24} color="#E74C3C" />
          <div>
            <p className="font-bold" style={{ color: '#C0392B' }}>Error</p>
            <p style={{ color: '#922B21' }} className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main SOAP Form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Patient Context Section */}
          {patientContext && (
            <div className="rounded-2xl overflow-hidden shadow-sm p-6" style={{ backgroundColor: '#F3F4F6' }}>
              <h2 className="font-bold text-lg mb-4" style={{ color: '#1E40AF' }}>
                📋 Patient Medical Context
              </h2>

              {/* Allergies */}
              {patientContext.medicalHistory?.allergies?.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2" style={{ color: '#991B1B' }}>
                    ⚠️ ALLERGIES
                  </h3>
                  <div className="space-y-2">
                    {patientContext.medicalHistory.allergies.map((allergy, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg text-sm"
                        style={{ backgroundColor: '#FEE2E2', color: '#7F1D1D' }}
                      >
                        {allergy.description}
                        {allergy.severity && (
                          <span className="ml-2 font-semibold">({allergy.severity})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chronic Conditions */}
              {patientContext.medicalHistory?.chronicConditions?.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2" style={{ color: '#B45309' }}>
                    🏥 CHRONIC CONDITIONS
                  </h3>
                  <div className="space-y-2">
                    {patientContext.medicalHistory.chronicConditions.map((condition, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg text-sm"
                        style={{ backgroundColor: '#FEF3C7', color: '#78350F' }}
                      >
                        {condition.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Previous Surgeries */}
              {patientContext.medicalHistory?.previousSurgeries?.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2" style={{ color: '#0369A1' }}>
                    🔪 PREVIOUS SURGERIES
                  </h3>
                  <div className="space-y-2">
                    {patientContext.medicalHistory.previousSurgeries.map((surgery, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg text-sm"
                        style={{ backgroundColor: '#DBEAFE', color: '#0C2340' }}
                      >
                        {surgery.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Family History */}
              {patientContext.medicalHistory?.familyHistory?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: '#6D28D9' }}>
                    👨‍👩‍👧 FAMILY HISTORY
                  </h3>
                  <div className="space-y-2">
                    {patientContext.medicalHistory.familyHistory.map((family, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg text-sm"
                        style={{ backgroundColor: '#EDE9FE', color: '#4C1D95' }}
                      >
                        {family.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Current Vitals Section */}
          <div className="rounded-2xl overflow-hidden shadow-sm p-6" style={{ backgroundColor: '#FFFFFF' }}>
            <h2 className="font-bold text-lg mb-6" style={{ color: '#1E40AF' }}>
              📊 Current Vital Signs
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Temperature */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                  style={{ borderColor: '#D1D5DB', color: '#1F2937' }}
                  placeholder="36.5"
                />
              </div>

              {/* BP Systolic */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>
                  BP Systolic (mmHg)
                </label>
                <input
                  type="number"
                  value={bpSystolic}
                  onChange={(e) => setBpSystolic(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                  style={{ borderColor: '#D1D5DB', color: '#1F2937' }}
                  placeholder="120"
                />
              </div>

              {/* BP Diastolic */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>
                  BP Diastolic (mmHg)
                </label>
                <input
                  type="number"
                  value={bpDiastolic}
                  onChange={(e) => setBpDiastolic(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                  style={{ borderColor: '#D1D5DB', color: '#1F2937' }}
                  placeholder="80"
                />
              </div>

              {/* Heart Rate */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>
                  Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                  style={{ borderColor: '#D1D5DB', color: '#1F2937' }}
                  placeholder="72"
                />
              </div>

              {/* O2 Saturation */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>
                  O2 Saturation (%)
                </label>
                <input
                  type="number"
                  value={oxygenSat}
                  onChange={(e) => setOxygenSat(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                  style={{ borderColor: '#D1D5DB', color: '#1F2937' }}
                  placeholder="98"
                />
              </div>

              {/* Weight */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                  style={{ borderColor: '#D1D5DB', color: '#1F2937' }}
                  placeholder="70"
                />
              </div>

              {/* Height */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                  style={{ borderColor: '#D1D5DB', color: '#1F2937' }}
                  placeholder="175"
                />
              </div>
            </div>
          </div>

          {/* Medical History Management Section */}
          {encounter?.patient_id && (
            <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
              <div className="p-6 border-b" style={{ borderColor: '#E5E7EB' }}>
                <DoctorMedicalHistorySection patientId={encounter.patient_id} />
              </div>
            </div>
          )}

          {/* SUBJECTIVE Section */}
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
            {/* Header */}
            <button
              onClick={() => toggleSection('subjective')}
              className="w-full p-6 flex items-center justify-between transition-all hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 text-left">
                <span className="text-2xl">📋</span>
                <div>
                  <h2 className="font-bold text-lg" style={{ color: '#1E40AF' }}>
                    SUBJECTIVE
                  </h2>
                  <p className="text-xs" style={{ color: '#6B7280' }}>
                    Chief complaint, symptom duration, relevant history
                  </p>
                </div>
              </div>
              {expandedSections.subjective ? (
                <ChevronUp color="#6B7280" />
              ) : (
                <ChevronDown color="#6B7280" />
              )}
            </button>

            {/* Content */}
            {expandedSections.subjective && (
              <div className="p-6 border-t" style={{ borderColor: '#E5E7EB' }}>
                <textarea
                  value={subjectiveInput}
                  onChange={(e) => setSubjectiveInput(e.target.value)}
                  className="w-full p-3 border rounded-lg text-sm font-mono"
                  style={{ borderColor: '#D1D5DB', color: '#1F2937' }}
                  rows={6}
                  placeholder="Chief complaint: ... Duration: ... Medical history: ... Current medications: ..."
                />

                {aiResponse?.subjective && typeof aiResponse.subjective === 'string' && (
                  <SuggestionBlock
                    title="AI Suggestion"
                    aiSuggestion={aiResponse.subjective}
                    onAccept={() => setSubjectiveInput(aiResponse.subjective)}
                    onReject={() => {}}
                  />
                )}
              </div>
            )}
          </div>

          {/* OBJECTIVE Section */}
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
            {/* Header */}
            <button
              onClick={() => toggleSection('objective')}
              className="w-full p-6 flex items-center justify-between transition-all hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 text-left">
                <span className="text-2xl">🔬</span>
                <div>
                  <h2 className="font-bold text-lg" style={{ color: '#1E40AF' }}>
                    OBJECTIVE
                  </h2>
                  <p className="text-xs" style={{ color: '#6B7280' }}>
                    Physical examination, lab results, imaging findings
                  </p>
                </div>
              </div>
              {expandedSections.objective ? (
                <ChevronUp color="#6B7280" />
              ) : (
                <ChevronDown color="#6B7280" />
              )}
            </button>

            {/* Content */}
            {expandedSections.objective && (
              <div className="p-6 border-t" style={{ borderColor: '#E5E7EB' }}>
                {/* Physical Examination */}
                <div className="mb-6">
                  <label
                    className="block font-semibold mb-2"
                    style={{ color: '#1E40AF' }}
                  >
                    Physical Examination
                  </label>
                  <textarea
                    value={physicalExamInput}
                    onChange={(e) => setPhysicalExamInput(e.target.value)}
                    className="w-full p-3 border rounded-lg text-sm font-mono"
                    style={{ borderColor: '#D1D5DB', color: '#1F2937' }}
                    rows={5}
                    placeholder="Describe your physical examination findings... (visible signs, palpation results, etc.)"
                  />
                </div>

                {/* Lab Findings */}
                <div className="mb-4">
                  <label
                    className="block font-semibold mb-2"
                    style={{ color: '#1E40AF' }}
                  >
                    Lab Findings & Imaging Results
                  </label>
                  <textarea
                    value={labFindingsInput}
                    onChange={(e) => setLabFindingsInput(e.target.value)}
                    className="w-full p-3 border rounded-lg text-sm font-mono"
                    style={{ borderColor: '#D1D5DB', color: '#1F2937' }}
                    rows={5}
                    placeholder="Lab values, test results, imaging findings, etc."
                  />
                </div>

                {/* AI Suggestion */}
                {aiResponse?.objective && typeof aiResponse.objective === 'string' && (
                  <SuggestionBlock
                    title="AI Suggestion"
                    aiSuggestion={aiResponse.objective}
                    onAccept={() => {
                      const lines = aiResponse.objective.split('\n');
                      setPhysicalExamInput(lines[0]);
                      setLabFindingsInput(lines.slice(1).join('\n'));
                    }}
                    onReject={() => {}}
                  />
                )}
              </div>
            )}
          </div>

          {/* ASSESSMENT Section */}
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
            {/* Header */}
            <button
              onClick={() => toggleSection('assessment')}
              className="w-full p-6 flex items-center justify-between transition-all hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 text-left">
                <span className="text-2xl">🎯</span>
                <div>
                  <h2 className="font-bold text-lg" style={{ color: '#1E40AF' }}>
                    ASSESSMENT
                  </h2>
                  <p className="text-xs" style={{ color: '#6B7280' }}>
                    Primary diagnosis, differential diagnoses, clinical reasoning, ICD-10 code
                  </p>
                </div>
              </div>
              {expandedSections.assessment ? (
                <ChevronUp color="#6B7280" />
              ) : (
                <ChevronDown color="#6B7280" />
              )}
            </button>

            {/* Content */}
            {expandedSections.assessment && (
              <div className="p-6 border-t" style={{ borderColor: '#E5E7EB' }}>
                <div className="mb-6">
                  <label className="block font-semibold mb-2" style={{ color: '#1E40AF' }}>
                    Clinical Assessment & Primary Diagnosis
                  </label>
                  <textarea
                    value={assessmentInput}
                    onChange={(e) => setAssessmentInput(e.target.value)}
                    className="w-full p-3 border rounded-lg text-sm font-mono"
                    style={{ borderColor: '#D1D5DB', color: '#1F2937' }}
                    rows={6}
                    placeholder="Primary diagnosis: ... ICD-10: ... Clinical reasoning: ..."
                  />
                </div>

                {/* Differential Diagnoses */}
                <div className="mb-4">
                  <label className="block font-semibold mb-2" style={{ color: '#1E40AF' }}>
                    Differential Diagnoses
                  </label>
                  <textarea
                    value={differentialInput}
                    onChange={(e) => setDifferentialInput(e.target.value)}
                    className="w-full p-3 border rounded-lg text-sm font-mono"
                    style={{ borderColor: '#D1D5DB', color: '#1F2937' }}
                    rows={5}
                    placeholder="1. Diagnosis (xx%) - Reasoning..."
                  />
                </div>

                {aiResponse?.assessment && typeof aiResponse.assessment === 'string' && (
                  <SuggestionBlock
                    title="AI Suggestion"
                    aiSuggestion={aiResponse.assessment}
                    onAccept={() => setAssessmentInput((prev) => prev ? prev + '\n\n' + aiResponse.assessment : aiResponse.assessment)}
                    onReject={() => {}}
                  />
                )}
              </div>
            )}
          </div>

          {/* PLAN Section */}
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
            {/* Header */}
            <button
              onClick={() => toggleSection('plan')}
              className="w-full p-6 flex items-center justify-between transition-all hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 text-left">
                <span className="text-2xl">📝</span>
                <div>
                  <h2 className="font-bold text-lg" style={{ color: '#1E40AF' }}>
                    PLAN
                  </h2>
                  <p className="text-xs" style={{ color: '#6B7280' }}>
                    Treatment plan, medications, follow-up, patient education, referrals
                  </p>
                </div>
              </div>
              {expandedSections.plan ? (
                <ChevronUp color="#6B7280" />
              ) : (
                <ChevronDown color="#6B7280" />
              )}
            </button>

            {/* Content */}
            {expandedSections.plan && (
              <div className="p-6 border-t" style={{ borderColor: '#E5E7EB' }}>
                <div className="mb-6">
                  <label className="block font-semibold mb-2" style={{ color: '#1E40AF' }}>
                    Treatment Plan & Follow-up
                  </label>
                  <textarea
                    value={planInput}
                    onChange={(e) => setPlanInput(e.target.value)}
                    className="w-full p-3 border rounded-lg text-sm font-mono"
                    style={{ borderColor: '#D1D5DB', color: '#1F2937' }}
                    rows={6}
                    placeholder="Treatment plan: ... Follow-up: ... Patient education: ..."
                  />
                </div>

                <div className="mb-4">
                  <label className="block font-semibold mb-2" style={{ color: '#1E40AF' }}>
                    Medication Recommendations
                  </label>
                  <textarea
                    value={medicationInput}
                    onChange={(e) => setMedicationInput(e.target.value)}
                    className="w-full p-3 border rounded-lg text-sm font-mono"
                    style={{ borderColor: '#D1D5DB', color: '#1F2937' }}
                    rows={5}
                    placeholder="1. Drug Name - Dose... Indication..."
                  />
                </div>

                {aiResponse?.plan && typeof aiResponse.plan === 'string' && (
                  <SuggestionBlock
                    title="AI Suggestion"
                    aiSuggestion={aiResponse.plan}
                    onAccept={() => setPlanInput((prev) => prev ? prev + '\n\n' + aiResponse.plan : aiResponse.plan)}
                    onReject={() => {}}
                  />
                )}
              </div>
            )}
          </div>

          {/* AI Analysis Results */}
          {showAISuggestions && aiResponse && (
            <AIResponseDisplay
              response={aiResponse}
              onClose={() => setShowAISuggestions(false)}
              onAcceptDifferential={(diagnoses) => {
                let diffText = '';
                diagnoses.forEach((diag, idx) => {
                  diffText += `${idx + 1}. ${diag.diagnosis} ${diag.probability_percent ? `(${diag.probability_percent}%)` : ''}\n`;
                  if (diag.reasoning) diffText += `   Reasoning: ${diag.reasoning}\n`;
                });
                setDifferentialInput(diffText.trim());
                setExpandedSections(prev => ({ ...prev, assessment: true }));
              }}
              onAcceptMedications={(meds) => {
                let medText = '';
                meds.forEach((med, idx) => {
                  medText += `${idx + 1}. ${med.drug_name}`;
                  const details = [med.strength, med.route, med.frequency].filter(Boolean).join(' • ');
                  if (details) medText += `\n   Dose: ${details}`;
                  if (med.indication) medText += `\n   Indication: ${med.indication}\n`;
                  else medText += '\n';
                });
                setMedicationInput(medText.trim());
                setExpandedSections(prev => ({ ...prev, plan: true }));
              }}
            />
          )}
        </div>

        {/* Sidebar - Actions & Status */}
        <div className="space-y-6">
          {/* AI Assistant Button */}
          <button
            onClick={handleAnalyzeWithAI}
            disabled={analyzing || !subjectiveInput.trim()}
            className="w-full rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            style={{ backgroundColor: '#7C3AED', color: 'white', display: 'block' }}
          >
            <div className="p-6">
              {analyzing ? (
                <>
                  <div className="flex items-center justify-center gap-2">
                    <Loader size={20} className="animate-spin" />
                    <p className="text-sm font-semibold">Analyzing...</p>
                  </div>
                  <p className="text-xs mt-2 opacity-90 text-center">Wait 30-35 seconds</p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Zap size={20} />
                    <p className="text-sm font-semibold">Analyze with AI</p>
                  </div>
                  <p className="text-xs opacity-90 text-center">
                    Get AI suggestions for your SOAP notes
                  </p>
                </>
              )}
            </div>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSaveSOAPNotes}
            disabled={saving || !subjectiveInput.trim()}
            className="w-full rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            style={{ backgroundColor: '#10B981', color: 'white', display: 'block' }}
          >
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{saving ? 'Saving...' : 'Save Notes'}</p>
                <p className="text-xs mt-1 opacity-90">Save to database</p>
              </div>
              {saving ? <Loader size={20} className="animate-spin" /> : <Save size={20} />}
            </div>
          </button>

          {/* Mark Done Button */}
          <button
            onClick={handleMarkDone}
            disabled={completing || !assessmentInput.trim()}
            className="w-full rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            style={{ backgroundColor: '#059669', color: 'white', display: 'block' }}
          >
            <div className="p-6">
              {completing ? (
                <>
                  <div className="flex items-center justify-center gap-2">
                    <Loader size={20} className="animate-spin" />
                    <p className="text-sm font-semibold">Completing...</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle size={20} />
                    <p className="text-sm font-semibold">Mark Done</p>
                  </div>
                  <p className="text-xs opacity-90 text-center">
                    Complete encounter & appointment
                  </p>
                </>
              )}
            </div>
          </button>

          {/* Completion Status */}
          <div
            className="rounded-2xl overflow-hidden shadow-sm p-6"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <h3 className="font-bold mb-4" style={{ color: '#1E40AF' }}>
              Completion Status
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Vitals Entered', value: temperature && bpSystolic && bpDiastolic && heartRate && oxygenSat && weight && height },
                { label: 'Subjective', value: subjectiveInput.trim() },
                { label: 'Physical Exam', value: physicalExamInput.trim() },
                { label: 'Lab Findings', value: labFindingsInput.trim() },
                { label: 'Assessment', value: assessmentInput.trim() },
                { label: 'Plan', value: planInput.trim() },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  {value ? (
                    <CheckCircle size={18} color="#10B981" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: '#E5E7EB' }} />
                  )}
                  <p className="text-sm" style={{ color: value ? '#065F46' : '#6B7280' }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Status */}
          {aiError && (
            <div
              className="rounded-2xl overflow-hidden shadow-sm p-4"
              style={{ backgroundColor: '#FFE4D6', borderLeft: '4px solid #E74C3C' }}
            >
              <p className="text-xs font-bold" style={{ color: '#C0392B' }}>
                AI Analysis Failed
              </p>
              <p className="text-xs mt-2" style={{ color: '#922B21' }}>
                {aiError}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Suggestion Block Component
 */
function SuggestionBlock({
  title,
  aiSuggestion,
  onAccept,
  onReject,
}) {
  if (!aiSuggestion) return null;

  const [accepted, setAccepted] = useState(false);

  return (
    <div
      className="mt-4 p-4 rounded-lg"
      style={{ backgroundColor: '#F0F9FF', borderLeft: '4px solid #7C3AED' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb size={16} color="#7C3AED" />
        <span className="text-xs font-bold" style={{ color: '#1E40AF' }}>
          {title}
        </span>
        {accepted && (
          <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
            ✓ Accepted
          </span>
        )}
      </div>

      <p className="text-sm mt-2 whitespace-pre-line" style={{ color: '#374151' }}>
        {aiSuggestion}
      </p>

      {!accepted && (
        <div className="flex gap-3 mt-3">
          <button
            onClick={() => {
              setAccepted(true);
              onAccept();
            }}
            className="flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
            style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}
          >
            <ThumbsUp size={16} />
            Accept
          </button>
          <button
            onClick={onReject}
            className="flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
            style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
          >
            <ThumbsDown size={16} />
            Reject
          </button>
        </div>
      )}
    </div>
  );
}


/**
 * AI Response Display Component
 */
function AIResponseDisplay({ response, onClose, onAcceptDifferential, onAcceptMedications }) {
  const [expandedDiagnoses, setExpandedDiagnoses] = useState(false);
  const [expandedMeds, setExpandedMeds] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm p-6"
      style={{ backgroundColor: '#F0F9FF', borderLeft: '4px solid #7C3AED' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={20} color="#7C3AED" />
          <h3 className="font-bold text-lg" style={{ color: '#1E40AF' }}>
            AI Analysis Complete
          </h3>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>

      {/* Differential Diagnoses */}
      {response.differentialDiagnoses?.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setExpandedDiagnoses(!expandedDiagnoses)}
            className="w-full p-3 rounded-lg flex items-center justify-between transition-all"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <p className="font-semibold text-sm" style={{ color: '#1E40AF' }}>
              Differential Diagnoses ({response.differentialDiagnoses.length})
            </p>
            {expandedDiagnoses ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {expandedDiagnoses && (
            <div className="mt-2 space-y-2">
              <div className="flex justify-end">
                <button
                  onClick={() => onAcceptDifferential(response.differentialDiagnoses)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-2 mb-1"
                  style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}
                >
                  <ThumbsUp size={14} /> Send to Assessment Box to Edit
                </button>
              </div>
              {response.differentialDiagnoses.map((diag, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg text-sm"
                  style={{ backgroundColor: '#FFFFFF', borderLeft: '3px solid #7C3AED' }}
                >
                  <p className="font-semibold" style={{ color: '#065F46' }}>
                    {diag.diagnosis} {diag.probability_percent && `(${diag.probability_percent}%)`}
                  </p>
                  {diag.reasoning && (
                    <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                      {diag.reasoning}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Medication Recommendations */}
      {response.medicationRecommendations?.length > 0 && (
        <div>
          <button
            onClick={() => setExpandedMeds(!expandedMeds)}
            className="w-full p-3 rounded-lg flex items-center justify-between transition-all"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <p className="font-semibold text-sm" style={{ color: '#1E40AF' }}>
              Medication Recommendations ({response.medicationRecommendations.length})
            </p>
            {expandedMeds ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {expandedMeds && (
            <div className="mt-2 space-y-2">
               <div className="flex justify-end">
                <button
                  onClick={() => onAcceptMedications(response.medicationRecommendations)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-2 mb-1"
                  style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}
                >
                  <ThumbsUp size={14} /> Send to Plan Box to Edit
                </button>
              </div>
              {response.medicationRecommendations.map((med, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg text-sm"
                  style={{ backgroundColor: '#FFFFFF', borderLeft: '3px solid #7C3AED' }}
                >
                  <p className="font-semibold">{med.drug_name}</p>
                  {med.strength && (
                    <p className="text-xs" style={{ color: '#6B7280' }}>
                      {med.strength} • {med.route} • {med.frequency}
                    </p>
                  )}
                  {med.indication && (
                    <p className="text-xs mt-1" style={{ color: '#374151' }}>
                      {med.indication}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-xs mt-4 italic" style={{ color: '#6B7280' }}>
        Review suggestions carefully and accept/reject for each SOAP section
      </p>
    </div>
  );
}
