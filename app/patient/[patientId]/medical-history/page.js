'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Plus, AlertCircle, CheckCircle, Edit2, Trash2, X } from 'lucide-react';

const MedicalHistoryPage = () => {
  const { patientId } = useParams();
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    condition_type: 'Allergy',
    description: '',
    severity: 'Mild',
    status: 'Active',
  });

  useEffect(() => {
    fetchMedicalHistory();
  }, [patientId]);

  const fetchMedicalHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/patient/${patientId}/medical-history`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch medical history');
      }

      const data = await response.json();
      setHistory(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching medical history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (record = null) => {
    if (record) {
      setEditingId(record.history_id);
      setFormData({
        condition_type: record.condition_type,
        description: record.description,
        severity: record.severity,
        status: record.status,
      });
    } else {
      setEditingId(null);
      setFormData({
        condition_type: 'Allergy',
        description: '',
        severity: 'Mild',
        status: 'Active',
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      condition_type: 'Allergy',
      description: '',
      severity: 'Mild',
      status: 'Active',
    });
  };

  const handleSave = async () => {
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    try {
      setError(null);
      const url = editingId
        ? `/api/patient/${patientId}/medical-history/${editingId}`
        : `/api/patient/${patientId}/medical-history`;

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save medical history');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      handleCloseForm();
      fetchMedicalHistory();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (historyId) => {
    if (!confirm('Are you sure you want to delete this medical history record?')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(
        `/api/patient/${patientId}/medical-history/${historyId}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete medical history');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      fetchMedicalHistory();
    } catch (err) {
      setError(err.message);
    }
  };

  const getConditionColor = (type) => {
    const colors = {
      'Allergy': { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
      'Chronic Condition': { bg: '#DBEAFE', text: '#0C2D6B', border: '#93C5FD' },
      'Previous Surgery': { bg: '#DCE4FF', text: '#312E81', border: '#B1C3FF' },
      'Family History': { bg: '#F3E8FF', text: '#581C87', border: '#E9D5FF' },
    };
    return colors[type] || { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' };
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'Mild': { bg: '#DBEAFE', text: '#0C2D6B' },
      'Moderate': { bg: '#FEF3C7', text: '#92400E' },
      'Severe': { bg: '#FECACA', text: '#7F1D1D' },
      'Life-Threatening': { bg: '#DC2626', text: 'white' },
    };
    return colors[severity] || { bg: '#F3F4F6', text: '#374151' };
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF' }} className="min-h-screen">
      {/* Header */}
      <div
        className="shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-emerald-100 hover:text-white transition mb-6 font-semibold"
          >
            <ChevronLeft size={20} />
            Back
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">Medical History</h1>
              <p className="text-emerald-100 text-lg">
                Manage your medical conditions, allergies, and past surgeries
              </p>
            </div>
            <button
              onClick={() => handleOpenForm()}
              className="flex items-center gap-2 text-white px-6 py-3 rounded-full font-semibold transition hover:bg-emerald-700 hover:shadow-lg bg-emerald-600"
            >
              <Plus size={20} />
              Add Record
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Success Message */}
        {success && (
          <div
            style={{
              backgroundColor: '#E8F8F5',
              borderLeft: '5px solid #10B981',
            }}
            className="rounded-lg p-5 mb-8 flex items-start gap-4"
          >
            <CheckCircle size={24} style={{ color: '#10B981' }} className="flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold" style={{ color: '#065F46' }}>
                Success!
              </h3>
              <p style={{ color: '#065F46' }} className="text-sm mt-1">
                Your medical history has been updated successfully.
              </p>
            </div>
          </div>
        )}

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
                Error
              </h3>
              <p style={{ color: '#065F46' }} className="text-sm mt-1">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  backgroundColor: '#F3F4F6',
                  border: '2px solid #E5E7EB',
                }}
                className="rounded-xl p-8 h-40 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {history.length === 0 && !loading && (
          <div
            style={{
              backgroundColor: '#E8F8F5',
              border: '3px solid #10B981',
            }}
            className="rounded-2xl shadow-md p-16 text-center"
          >
            <p className="text-6xl mb-4">📋</p>
            <h3 className="text-2xl font-bold" style={{ color: '#065F46' }}>
              No Medical History Records
            </h3>
            <p style={{ color: '#10B981' }} className="mt-3 text-lg mb-8">
              You haven't added any medical history records yet.
            </p>
            <button
              onClick={() => handleOpenForm()}
              className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-full font-semibold transition hover:bg-emerald-700 hover:shadow-lg"
              style={{ backgroundColor: '#10B981' }}
            >
              <Plus size={20} />
              Add Your First Record
            </button>
          </div>
        )}

        {/* Records List */}
        {history.length > 0 && !loading && (
          <div className="space-y-6">
            {history.map((record) => {
              const typeColor = getConditionColor(record.condition_type);
              const severityColor = getSeverityColor(record.severity);

              return (
                <div
                  key={record.history_id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: `3px solid ${typeColor.border}`,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  }}
                  className="rounded-xl p-8 hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                    {/* Left - Information */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          style={{
                            backgroundColor: typeColor.bg,
                            color: typeColor.text,
                          }}
                          className="px-4 py-2 rounded-full text-sm font-semibold"
                        >
                          {record.condition_type}
                        </div>
                        <div
                          style={{
                            backgroundColor: severityColor.bg,
                            color: severityColor.text,
                          }}
                          className="px-4 py-2 rounded-full text-sm font-semibold"
                        >
                          {record.severity}
                        </div>
                        <div
                          style={{
                            backgroundColor: record.status === 'Active' ? '#E8F8F5' : '#F3F4F6',
                            color: record.status === 'Active' ? '#065F46' : '#6B7280',
                          }}
                          className="px-4 py-2 rounded-full text-sm font-semibold"
                        >
                          {record.status}
                        </div>
                      </div>
                      <p style={{ color: '#065F46' }} className="text-lg leading-relaxed">
                        {record.description}
                      </p>
                      <p style={{ color: '#6B7280' }} className="text-sm mt-4">
                        Recorded on {new Date(record.documented_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>

                    {/* Right - Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleOpenForm(record)}
                        className="p-3 rounded-lg transition hover:shadow-md"
                        style={{
                          backgroundColor: '#E8F8F5',
                          color: '#10B981',
                        }}
                        title="Edit"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(record.history_id)}
                        className="p-3 rounded-lg transition hover:shadow-md"
                        style={{
                          backgroundColor: '#FFD9E8',
                          color: '#DC2626',
                        }}
                        title="Delete"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div style={{ backgroundColor: '#FFFFFF' }} className="rounded-2xl max-w-2xl w-full shadow-2xl">
            {/* Modal Header */}
            <div
              className="px-8 py-6 flex justify-between items-center"
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              }}
            >
              <h2 className="text-3xl font-bold text-white">
                {editingId ? 'Edit Medical History' : 'Add Medical History'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="text-white hover:bg-emerald-700 p-2 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              {/* Condition Type */}
              <div>
                <label style={{ color: '#065F46' }} className="block text-sm font-semibold mb-3">
                  Condition Type
                </label>
                <select
                  value={formData.condition_type}
                  onChange={(e) => setFormData({ ...formData, condition_type: e.target.value })}
                  style={{
                    backgroundColor: '#F3F4F6',
                    borderColor: '#E5E7EB',
                    color: '#065F46',
                  }}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Allergy">Allergy</option>
                  <option value="Chronic Condition">Chronic Condition</option>
                  <option value="Previous Surgery">Previous Surgery</option>
                  <option value="Family History">Family History</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label style={{ color: '#065F46' }} className="block text-sm font-semibold mb-3">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your medical condition..."
                  style={{
                    backgroundColor: '#F3F4F6',
                    borderColor: '#E5E7EB',
                    color: '#065F46',
                  }}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows="4"
                />
              </div>

              {/* Severity */}
              <div>
                <label style={{ color: '#065F46' }} className="block text-sm font-semibold mb-3">
                  Severity Level
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  style={{
                    backgroundColor: '#F3F4F6',
                    borderColor: '#E5E7EB',
                    color: '#065F46',
                  }}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                  <option value="Life-Threatening">Life-Threatening</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label style={{ color: '#065F46' }} className="block text-sm font-semibold mb-3">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{
                    backgroundColor: '#F3F4F6',
                    borderColor: '#E5E7EB',
                    color: '#065F46',
                  }}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Active">Active</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 flex gap-4 justify-end border-t" style={{ borderColor: '#E5E7EB' }}>
              <button
                onClick={handleCloseForm}
                style={{
                  backgroundColor: '#E5E7EB',
                  color: '#065F46',
                }}
                className="font-semibold px-6 py-2 rounded-lg transition hover:shadow-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="font-semibold px-6 py-2 rounded-lg transition hover:shadow-lg text-white"
                style={{ backgroundColor: '#10B981' }}
              >
                {editingId ? 'Update' : 'Add'} Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalHistoryPage;
