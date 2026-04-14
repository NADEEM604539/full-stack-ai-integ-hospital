'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingInvoice, setGeneratingInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('no-invoice');

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [searchTerm, filterStatus, appointments]);

  const convertAppointmentNumbers = (apts) => {
    return apts.map(apt => ({
      ...apt,
      consultation_fee: Number(apt.consultation_fee || 0),
      medicines_total: Number(apt.medicines_total || 0)
    }));
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/finance/completed-appointments?limit=1000');
      const data = await response.json();
      
      if (data.success) {
        setAppointments(convertAppointmentNumbers(data.data || []));
      } else {
        setError(data.error || 'Failed to fetch appointments');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let result = appointments;

    // Filter by status
    if (filterStatus === 'no-invoice') {
      result = result.filter(apt => apt.invoice_status !== 'Generated');
    } else if (filterStatus === 'invoiced') {
      result = result.filter(apt => apt.invoice_status === 'Generated');
    }

    // Filter by search term
    if (searchTerm) {
      result = result.filter(apt =>
        apt.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.doctor_first_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFiltered(result);
  };

  const handleGenerateInvoice = async (appointmentId) => {
    try {
      setGeneratingInvoice(appointmentId);
      const response = await fetch(`/api/finance/${appointmentId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1 })
      });

      const result = await response.json();
      if (result.success) {
        alert('✓ Invoice generated successfully!');
        fetchAppointments();
      } else {
        alert(`✗ ${result.error || 'Failed to generate invoice'}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setGeneratingInvoice(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 size={40} style={{ color: '#10B981' }} className="animate-spin" />
      </div>
    );
  }

  const noInvoiceCount = appointments.filter(apt => apt.invoice_status !== 'Generated').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: '#065F46' }}>
          📅 Completed Appointments
        </h1>
        <p style={{ color: '#10B981' }} className="mt-2">
          Manage invoices for completed appointments
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
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p style={{ color: '#6B7280' }} className="text-sm">Total Appointments</p>
            <p style={{ color: '#065F46' }} className="text-3xl font-bold">{appointments.length}</p>
          </div>
          <div>
            <p style={{ color: '#6B7280' }} className="text-sm">No Invoice</p>
            <p style={{ color: '#F59E0B' }} className="text-3xl font-bold">{noInvoiceCount}</p>
          </div>
          <div>
            <p style={{ color: '#6B7280' }} className="text-sm">Invoiced</p>
            <p style={{ color: '#10B981' }} className="text-3xl font-bold">{appointments.length - noInvoiceCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by patient name, MRN, or doctor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none"
          style={{ borderColor: '#E5E7EB', minWidth: '250px' }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none"
          style={{ borderColor: '#E5E7EB' }}
        >
          <option value="no-invoice">No Invoice</option>
          <option value="invoiced">Invoiced</option>
          <option value="all">All</option>
        </select>
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

      {/* Appointments List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
            }}
            className="rounded-lg p-12 text-center"
          >
            <Calendar size={48} style={{ color: '#10B981' }} className="mx-auto mb-4" />
            <p style={{ color: '#6B7280' }}>No appointments found</p>
          </div>
        ) : (
          filtered.map((apt) => (
            <div
              key={apt.appointment_id}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px'
              }}
              className="p-6 hover:shadow-lg transition"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                {/* Left: Patient & Appointment Info */}
                <div className="flex-1">
                  <h3 className="font-bold text-lg" style={{ color: '#065F46' }}>
                    {apt.patient_name} <span style={{ color: '#6B7280' }} className="text-sm font-normal">(MRN: {apt.mrn})</span>
                  </h3>
                  
                  <div className="mt-4 space-y-2" style={{ color: '#6B7280' }}>
                    <p className="flex items-center gap-2">
                      <Calendar size={16} />
                      {new Date(apt.appointment_date).toLocaleDateString()} at {apt.appointment_time}
                    </p>
                    <p>👨‍⚕️ Dr. {apt.doctor_first_name} {apt.doctor_last_name}</p>
                    <p>🏥 {apt.department_name}</p>
                    <p>📝 Reason: {apt.reason_for_visit}</p>
                  </div>
                </div>

                {/* Center: Fees & Medicines */}
                <div className="border-l border-gray-200 pl-6" style={{ minWidth: '200px' }}>
                  <p style={{ color: '#6B7280' }} className="text-sm font-medium mb-3">Invoice Breakdown</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span style={{ color: '#6B7280' }}>Consultation Fee:</span>
                      <span style={{ color: '#065F46' }} className="font-semibold">
                        ${apt.consultation_fee || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#6B7280' }}>Medicines:</span>
                      <span style={{ color: '#065F46' }} className="font-semibold">
                        ${apt.medicines_total || 0}
                      </span>
                    </div>
                    <div className="flex justify-between" style={{ borderTop: '1px solid #E5E7EB', paddingTop: '8px' }}>
                      <span style={{ color: '#6B7280' }}>Subtotal:</span>
                      <span style={{ color: '#065F46' }} className="font-bold">
                        ${((apt.consultation_fee || 0) + (apt.medicines_total || 0)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#6B7280' }}>Tax (10%):</span>
                      <span style={{ color: '#065F46' }} className="font-semibold">
                        ${(((apt.consultation_fee || 0) + (apt.medicines_total || 0)) * 0.1).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between bg-gray-50 -mx-2 px-2 py-2 rounded" style={{ borderTop: '2px solid #E5E7EB' }}>
                      <span style={{ color: '#065F46' }} className="font-bold">Total:</span>
                      <span style={{ color: '#10B981' }} className="text-xl font-bold">
                        ${(((apt.consultation_fee || 0) + (apt.medicines_total || 0)) * 1.1).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col gap-2" style={{ minWidth: '180px' }}>
                  {apt.invoice_status === 'Generated' ? (
                    <div
                      style={{ backgroundColor: '#D1FAE5', color: '#059669' }}
                      className="px-4 py-3 rounded-lg text-center font-semibold"
                    >
                      ✓ Invoiced
                    </div>
                  ) : (
                    <button
                      onClick={() => handleGenerateInvoice(apt.appointment_id)}
                      disabled={generatingInvoice === apt.appointment_id}
                      style={{
                        backgroundColor: generatingInvoice === apt.appointment_id ? '#D1D5DB' : '#10B981',
                        color: '#FFFFFF',
                      }}
                      className="px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                    >
                      {generatingInvoice === apt.appointment_id ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus size={16} />
                          Create Invoice
                        </>
                      )}
                    </button>
                  )}
                  
                  <Link
                    href={`/finance/appointments/${apt.appointment_id}`}
                    className="px-4 py-2 border rounded-lg text-center font-medium transition flex items-center justify-center gap-2"
                    style={{ borderColor: '#10B981', color: '#10B981' }}
                  >
                    Details
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;
