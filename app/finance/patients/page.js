'use client';

import React, { useState, useEffect } from 'react';
import { Users, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPatient, setExpandedPatient] = useState(null);
  const [patientInvoices, setPatientInvoices] = useState({});

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [searchTerm, patients]);

  const convertPatientNumbers = (patients) => {
    return patients.map(patient => ({
      ...patient,
      total_invoices: Number(patient.total_invoices || 0),
      total_amount: Number(patient.total_amount || 0),
      amount_paid: Number(patient.amount_paid || 0)
    }));
  };

  const convertInvoiceNumbers = (invoices) => {
    return invoices.map(inv => ({
      ...inv,
      total_amount: Number(inv.total_amount || 0),
      amount_paid: Number(inv.amount_paid || 0)
    }));
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/finance/patients?limit=1000');
      const data = await response.json();
      
      if (data.success) {
        setPatients(convertPatientNumbers(data.data || []));
      } else {
        setError(data.error || 'Failed to fetch patients');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientInvoices = async (patientId) => {
    if (patientInvoices[patientId]) return;

    try {
      const response = await fetch(`/api/finance/invoices?patientId=${patientId}&limit=100`);
      const data = await response.json();
      
      setPatientInvoices({
        ...patientInvoices,
        [patientId]: convertInvoiceNumbers(data.data || [])
      });
    } catch (err) {
      console.error('Error fetching patient invoices:', err);
    }
  };

  const filterPatients = () => {
    let result = patients;

    if (searchTerm) {
      result = result.filter(patient =>
        patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFiltered(result);
  };

  const handleExpandPatient = (patientId) => {
    if (expandedPatient === patientId) {
      setExpandedPatient(null);
    } else {
      setExpandedPatient(patientId);
      fetchPatientInvoices(patientId);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Paid': '#D1FAE5',
      'Unpaid': '#FEE2E2',
      'Partial': '#FEF3C7',
      'Overdue': '#FBCCCC'
    };
    return colors[status] || '#F3F4F6';
  };

  const getStatusTextColor = (status) => {
    const colors = {
      'Paid': '#059669',
      'Unpaid': '#DC2626',
      'Partial': '#D97706',
      'Overdue': '#991B1B'
    };
    return colors[status] || '#6B7280';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 size={40} style={{ color: '#10B981' }} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: '#065F46' }}>
          👥 Patients & Invoices
        </h1>
        <p style={{ color: '#10B981' }} className="mt-2">
          View all patients and their invoices/challans
        </p>
      </div>

      {/* Summary Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #10B981',
          borderRadius: '12px'
        }}
        className="p-6"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p style={{ color: '#6B7280' }} className="text-sm">Total Patients</p>
            <p style={{ color: '#065F46' }} className="text-3xl font-bold">{patients.length}</p>
          </div>
          <div>
            <p style={{ color: '#6B7280' }} className="text-sm">Patients with Invoices</p>
            <p style={{ color: '#10B981' }} className="text-3xl font-bold">
              {patients.filter(p => p.invoice_count > 0).length}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by name, MRN, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none"
          style={{ borderColor: '#E5E7EB' }}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{ backgroundColor: '#FEE2E2', borderLeft: '4px solid #EF4444' }}
          className="p-4 rounded"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={20} style={{ color: '#DC2626' }} />
            <p style={{ color: '#DC2626' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Patients List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
            }}
            className="rounded-lg p-12 text-center"
          >
            <Users size={48} style={{ color: '#10B981' }} className="mx-auto mb-4" />
            <p style={{ color: '#6B7280' }}>No patients found</p>
          </div>
        ) : (
          filtered.map((patient) => (
            <div key={patient.patient_id}>
              {/* Patient Header */}
              <button
                onClick={() => handleExpandPatient(patient.patient_id)}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB'
                }}
                className="w-full p-4 rounded-lg hover:shadow-md transition text-left flex items-center justify-between"
              >
                <div className="flex-1">
                  <h3 style={{ color: '#065F46' }} className="font-bold text-lg">
                    {patient.first_name} {patient.last_name}
                  </h3>
                  <div style={{ color: '#6B7280' }} className="text-sm mt-1 space-y-0.5">
                    <p>MRN: {patient.mrn} | Email: {patient.email}</p>
                    <p>DOB: {new Date(patient.date_of_birth).toLocaleDateString()} | Gender: {patient.gender}</p>
                    <p>Phone: {patient.phone_number}</p>
                  </div>
                </div>

                <div className="ml-4 text-right">
                  <div style={{ color: '#10B981' }} className="font-bold">
                    {patient.invoice_count || 0} Invoice{patient.invoice_count !== 1 ? 's' : ''}
                  </div>
                  {expandedPatient === patient.patient_id ? (
                    <ChevronUp size={24} style={{ color: '#10B981' }} />
                  ) : (
                    <ChevronDown size={24} style={{ color: '#10B981' }} />
                  )}
                </div>
              </button>

              {/* Invoices / Challans */}
              {expandedPatient === patient.patient_id && (
                <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderTop: 'none' }} className="p-4 rounded-b-lg">
                  {patientInvoices[patient.patient_id]?.length === 0 ? (
                    <p style={{ color: '#6B7280' }} className="text-center py-4">No invoices found</p>
                  ) : (
                    <div className="space-y-3">
                      {patientInvoices[patient.patient_id]?.map((invoice) => (
                        <div
                          key={invoice.invoice_id}
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px'
                          }}
                          className="p-4 flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <p style={{ color: '#065F46' }} className="font-semibold">
                              Invoice #{invoice.invoice_id}
                            </p>
                            <div style={{ color: '#6B7280' }} className="text-sm mt-1 space-y-0.5">
                              <p>Amount: ${invoice.total_amount.toFixed(2)}</p>
                              <p>Date: {new Date(invoice.invoice_date).toLocaleDateString()} | Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
                            </div>
                          </div>

                          <div className="ml-4 text-right">
                            <div
                              style={{
                                backgroundColor: getStatusColor(invoice.status),
                                color: getStatusTextColor(invoice.status)
                              }}
                              className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2"
                            >
                              {invoice.status}
                            </div>
                            <p style={{ color: '#065F46' }} className="font-bold text-sm">
                              Paid: ${invoice.amount_paid.toFixed(2)}
                            </p>
                            <p style={{ color: '#10B981' }} className="font-bold text-sm">
                              Pending: ${(invoice.total_amount - invoice.amount_paid).toFixed(2)}
                            </p>

                            <Link
                              href={`/finance/invoices/${invoice.invoice_id}`}
                              className="mt-2 inline-block px-3 py-1 rounded text-xs font-medium"
                              style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientsPage;
