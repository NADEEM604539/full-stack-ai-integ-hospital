'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Loader, AlertCircle, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

const MedicalHistoryPage = () => {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [formData, setFormData] = useState({
    conditionType: '',
    description: '',
    severity: 'Moderate',
    status: 'Active',
  });

  useEffect(() => {
    fetchPatientAndHistory();
  }, [patientId]);

  const fetchPatientAndHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get patient info
      const patientResponse = await fetch(`/api/nurse/patients`);
      if (patientResponse.ok) {
        const patientData = await patientResponse.json();
        const patient = patientData.data?.find(p => p.patient_id === parseInt(patientId));
        setPatientInfo(patient);
      }

      // Get medical history
      const historyResponse = await fetch(
        `/api/nurse/medical-history?patientId=${patientId}`
      );

      if (!historyResponse.ok) {
        throw new Error('Failed to fetch medical history');
      }

      const data = await historyResponse.json();
      setRecords(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      conditionType: '',
      description: '',
      severity: 'Moderate',
      status: 'Active',
    });
    setEditingId(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (record) => {
    setFormData({
      conditionType: record.condition_type,
      description: record.description || '',
      severity: record.severity || 'Moderate',
      status: record.status || 'Active',
    });
    setEditingId(record.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingId
        ? '/api/nurse/medical-history'
        : '/api/nurse/medical-history';

      const method = editingId ? 'PUT' : 'POST';

      const payload = editingId
        ? {
            id: editingId,
            ...formData,
          }
        : {
            patientId: parseInt(patientId),
            ...formData,
          };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save record');
      }

      setShowModal(false);
      resetForm();
      await fetchPatientAndHistory();
    } catch (err) {
      alert('Error: ' + err.message);
      console.error('Error saving record:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (recordId) => {
    try {
      const response = await fetch(
        `/api/nurse/medical-history?id=${recordId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete record');
      }

      setDeleteConfirm(null);
      await fetchPatientAndHistory();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} color="#8B5CF6" className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading medical history...</p>
        </div>
      </div>
    );
  }

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
            Back
          </button>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Medical History
            </h1>
            {patientInfo && (
              <p className="text-purple-100 text-lg">
                {patientInfo.full_name} (MRN: {patientInfo.mrn})
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {error && (
          <div
            style={{
              backgroundColor: '#FFE0E6',
              borderLeft: '5px solid #EF4444',
            }}
            className="rounded-lg p-5 mb-8 flex items-start gap-4"
          >
            <AlertCircle size={24} style={{ color: '#DC2626' }} className="flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-red-900">Error</h3>
              <p className="text-sm text-red-800 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Add Button */}
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold" style={{ color: '#1F2937' }}>
            Medical Records ({records.length})
          </h2>
          <button
            onClick={handleAddNew}
            style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF' }}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
          >
            <Plus size={20} />
            Add Record
          </button>
        </div>

        {/* Records Table */}
        {records.length === 0 ? (
          <div
            style={{
              backgroundColor: '#F3F0FF',
              border: '3px solid #8B5CF6',
            }}
            className="rounded-2xl p-12 text-center"
          >
            <p style={{ color: '#8B5CF6' }} className="text-lg">
              No medical history records found
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div
                key={record.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #E5E7EB',
                }}
                className="rounded-lg p-6 hover:shadow-md transition"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold" style={{ color: '#1F2937' }}>
                      {record.condition_type}
                    </h3>
                    {record.description && (
                      <p style={{ color: '#6B7280' }} className="text-sm mt-2">
                        {record.description}
                      </p>
                    )}
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <p style={{ color: '#9CA3AF' }} className="text-xs uppercase font-semibold">
                          Severity
                        </p>
                        <span
                          style={{
                            backgroundColor:
                              record.severity === 'Mild' ? '#DBEAFE' :
                              record.severity === 'Moderate' ? '#FEF3C7' :
                              record.severity === 'Severe' ? '#FED7AA' :
                              '#FEE2E2',
                            color:
                              record.severity === 'Mild' ? '#1E40AF' :
                              record.severity === 'Moderate' ? '#92400E' :
                              record.severity === 'Severe' ? '#92400E' :
                              '#7F1D1D',
                          }}
                          className="text-xs font-semibold px-2 py-1 rounded inline-block mt-1"
                        >
                          {record.severity}
                        </span>
                      </div>
                      <div>
                        <p style={{ color: '#9CA3AF' }} className="text-xs uppercase font-semibold">
                          Documented
                        </p>
                        <p className="text-sm font-semibold" style={{ color: '#1F2937' }}>
                          {record.documented_at
                            ? new Date(record.documented_at).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#9CA3AF' }} className="text-xs uppercase font-semibold">
                          Status
                        </p>
                        <span
                          style={{
                            backgroundColor:
                              record.status === 'Active'
                                ? '#D1FAE5'
                                : record.status === 'Resolved' ? '#DBEAFE' : '#FEE2E2',
                            color:
                              record.status === 'Active'
                                ? '#065F46'
                                : record.status === 'Resolved' ? '#1E40AF' : '#7F1D1D',
                          }}
                          className="text-xs font-semibold px-2 py-1 rounded-full inline-block mt-1"
                        >
                          {record.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(record)}
                      style={{ backgroundColor: '#3B82F6', color: '#FFFFFF' }}
                      className="p-2 rounded-lg hover:shadow-lg transition"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(record.id)}
                      style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}
                      className="p-2 rounded-lg hover:shadow-lg transition"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 50,
          }}
          className="flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1rem',
              boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
            }}
            className="w-full max-w-md p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#1F2937' }}>
                {editingId ? 'Edit Record' : 'Add Medical Record'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Condition Type */}
              <div>
                <label style={{ color: '#374151' }} className="block text-sm font-semibold mb-2">
                  Condition Type *
                </label>
                <select
                  value={formData.conditionType}
                  onChange={(e) =>
                    setFormData({ ...formData, conditionType: e.target.value })
                  }
                  required
                  style={{
                    backgroundColor: '#F9FAFB',
                    border: '2px solid #E5E7EB',
                  }}
                  className="w-full px-4 py-2 rounded-lg focus:outline-none focus:border-purple-400 transition"
                >
                  <option value="">Select condition type...</option>
                  <option value="Allergy">Allergy</option>
                  <option value="Chronic Condition">Chronic Condition</option>
                  <option value="Previous Surgery">Previous Surgery</option>
                  <option value="Family History">Family History</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label style={{ color: '#374151' }} className="block text-sm font-semibold mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  style={{
                    backgroundColor: '#F9FAFB',
                    border: '2px solid #E5E7EB',
                  }}
                  className="w-full px-4 py-2 rounded-lg focus:outline-none focus:border-purple-400 transition"
                  placeholder="Additional details about the condition"
                  rows={3}
                />
              </div>

              {/* Severity */}
              <div>
                <label style={{ color: '#374151' }} className="block text-sm font-semibold mb-2">
                  Severity
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) =>
                    setFormData({ ...formData, severity: e.target.value })
                  }
                  style={{
                    backgroundColor: '#F9FAFB',
                    border: '2px solid #E5E7EB',
                  }}
                  className="w-full px-4 py-2 rounded-lg focus:outline-none focus:border-purple-400 transition"
                >
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                  <option value="Life-Threatening">Life-Threatening</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label style={{ color: '#374151' }} className="block text-sm font-semibold mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  style={{
                    backgroundColor: '#F9FAFB',
                    border: '2px solid #E5E7EB',
                  }}
                  className="w-full px-4 py-2 rounded-lg focus:outline-none focus:border-purple-400 transition"
                >
                  <option value="Active">Active</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    backgroundColor: '#E5E7EB',
                    color: '#1F2937',
                  }}
                  className="flex-1 px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.conditionType}
                  style={{
                    backgroundColor: '#8B5CF6',
                    color: '#FFFFFF',
                    opacity: submitting || !formData.conditionType ? 0.6 : 1,
                  }}
                  className="flex-1 px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader size={18} className="animate-spin" /> : <Check size={18} />}
                  {editingId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 50,
          }}
          className="flex items-center justify-center p-4"
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1rem',
            }}
            className="w-full max-w-sm p-8"
          >
            <h2 className="text-2xl font-bold" style={{ color: '#1F2937' }}>
              Delete Record?
            </h2>
            <p style={{ color: '#6B7280' }} className="mt-4">
              Are you sure you want to delete this medical history record? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  backgroundColor: '#E5E7EB',
                  color: '#1F2937',
                }}
                className="flex-1 px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={{
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                }}
                className="flex-1 px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalHistoryPage;
