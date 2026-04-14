'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, FileText, CheckCircle, AlertCircle, TrendingUp, Calendar, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const FinanceDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('appointments');
  const [generatingInvoice, setGeneratingInvoice] = useState(null);
  const [filters, setFilters] = useState({
    departmentId: '',
    status: 'Unpaid'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const convertAppointmentNumbers = (apts) => {
    return (apts || []).map(apt => ({
      ...apt,
      consultation_fee: Number(apt.consultation_fee || 0),
      medicines_total: Number(apt.medicines_total || 0)
    }));
  };

  const convertInvoiceNumbers = (invs) => {
    return (invs || []).map(inv => ({
      ...inv,
      total_amount: Number(inv.total_amount || 0),
      amount_paid: Number(inv.amount_paid || 0)
    }));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cApts, invsRes, sumRes] = await Promise.all([
        fetch('/api/finance/completed-appointments?limit=100').then(r => r.json()),
        fetch('/api/finance/invoices?status=Unpaid&limit=50').then(r => r.json()),
        fetch('/api/finance/summary').then(r => r.json())
      ]);

      setOrders(convertAppointmentNumbers(cApts.data));
      setInvoices(convertInvoiceNumbers(invsRes.data));
      
      // Convert numeric string values to numbers
      const summaryData = sumRes.data || {};
      const convertedSummary = {
        ...summaryData,
        total_revenue: Number(summaryData.total_revenue || 0),
        total_paid: Number(summaryData.total_paid || 0),
        total_outstanding: Number(summaryData.total_outstanding || 0),
        total_invoices: Number(summaryData.total_invoices || 0),
        paid_invoices: Number(summaryData.paid_invoices || 0),
        unpaid_invoices: Number(summaryData.unpaid_invoices || 0),
        partial_invoices: Number(summaryData.partial_invoices || 0),
        overdue_count: Number(summaryData.overdue_count || 0),
        overdue_amount: Number(summaryData.overdue_amount || 0)
      };
      
      setSummary(convertedSummary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        alert('Invoice generated successfully!');
        fetchData();
      } else {
        alert(result.error || 'Failed to generate invoice');
      }
    } catch (err) {
      alert('Error generating invoice: ' + err.message);
    } finally {
      setGeneratingInvoice(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl font-semibold" style={{ color: '#10B981' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold" style={{ color: '#065F46' }}>Financial Management</h1>
        <p style={{ color: '#10B981' }} className="mt-2 font-medium">
          Manage invoices, track payments, and generate financial reports
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderTop: '4px solid #10B981',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)',
          }}
          className="rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p style={{ color: '#10B981' }} className="text-sm font-medium">
                Total Revenue
              </p>
              <p style={{ color: '#065F46' }} className="text-2xl font-bold mt-1">
                ${(summary.total_revenue || 0).toFixed(2)}
              </p>
            </div>
            <TrendingUp size={32} style={{ color: '#10B981' }} />
          </div>
        </div>

        {/* Total Paid */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderTop: '4px solid #10B981',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)',
          }}
          className="rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p style={{ color: '#10B981' }} className="text-sm font-medium">
                Total Paid
              </p>
              <p style={{ color: '#10B981' }} className="text-2xl font-bold mt-1">
                ${(summary.total_paid || 0).toFixed(2)}
              </p>
            </div>
            <CheckCircle size={32} style={{ color: '#10B981' }} />
          </div>
        </div>

        {/* Outstanding Balance */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderTop: '4px solid #F59E0B',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)',
          }}
          className="rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p style={{ color: '#F59E0B' }} className="text-sm font-medium">
                Outstanding
              </p>
              <p style={{ color: '#D97706' }} className="text-2xl font-bold mt-1">
                ${(summary.total_outstanding || 0).toFixed(2)}
              </p>
            </div>
            <DollarSign size={32} style={{ color: '#F59E0B' }} />
          </div>
        </div>

        {/* Overdue Count */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderTop: '4px solid #EF4444',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)',
          }}
          className="rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p style={{ color: '#EF4444' }} className="text-sm font-medium">
                Overdue
              </p>
              <p style={{ color: '#DC2626' }} className="text-2xl font-bold mt-1">
                {summary.overdue_count || 0}
              </p>
            </div>
            <AlertCircle size={32} style={{ color: '#EF4444' }} />
          </div>
        </div>

        {/* Total Invoices */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderTop: '4px solid #8B5CF6',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)',
          }}
          className="rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p style={{ color: '#8B5CF6' }} className="text-sm font-medium">
                Total Invoices
              </p>
              <p style={{ color: '#7C3AED' }} className="text-2xl font-bold mt-1">
                {summary.total_invoices || 0}
              </p>
            </div>
            <FileText size={32} style={{ color: '#8B5CF6' }} />
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Appointments Card */}
        <Link href="/finance/appointments">
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '2px solid #E5E7EB',
              borderRadius: '12px',
              transition: 'all 0.3s ease'
            }}
            className="p-6 hover:shadow-lg hover:border-green-400 cursor-pointer h-full"
          >
            <div className="flex items-center justify-between mb-4">
              <Calendar size={32} style={{ color: '#10B981' }} />
              <ArrowRight size={20} style={{ color: '#10B981' }} />
            </div>
            <h3 style={{ color: '#065F46' }} className="font-bold text-lg">
              Complete Appointments
            </h3>
            <p style={{ color: '#6B7280' }} className="text-sm mt-2">
              View and manage completed appointments without invoices
            </p>
          </div>
        </Link>

        {/* Invoices Card */}
        <Link href="/finance/invoices">
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '2px solid #E5E7EB',
              borderRadius: '12px',
              transition: 'all 0.3s ease'
            }}
            className="p-6 hover:shadow-lg hover:border-green-400 cursor-pointer h-full"
          >
            <div className="flex items-center justify-between mb-4">
              <FileText size={32} style={{ color: '#10B981' }} />
              <ArrowRight size={20} style={{ color: '#10B981' }} />
            </div>
            <h3 style={{ color: '#065F46' }} className="font-bold text-lg">
              All Invoices
            </h3>
            <p style={{ color: '#6B7280' }} className="text-sm mt-2">
              View, update status, and manage all invoices
            </p>
          </div>
        </Link>

        {/* Patients Card */}
        <Link href="/finance/patients">
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '2px solid #E5E7EB',
              borderRadius: '12px',
              transition: 'all 0.3s ease'
            }}
            className="p-6 hover:shadow-lg hover:border-green-400 cursor-pointer h-full"
          >
            <div className="flex items-center justify-between mb-4">
              <Users size={32} style={{ color: '#10B981' }} />
              <ArrowRight size={20} style={{ color: '#10B981' }} />
            </div>
            <h3 style={{ color: '#065F46' }} className="font-bold text-lg">
              Patients & Challans
            </h3>
            <p style={{ color: '#6B7280' }} className="text-sm mt-2">
              View all patients with their invoices and payment status
            </p>
          </div>
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`pb-4 px-2 font-semibold transition ${
              activeTab === 'appointments'
                ? 'border-b-2 text-green-600'
                : 'text-gray-600'
            }`}
            style={
              activeTab === 'appointments' ? { borderBottomColor: '#10B981', color: '#10B981' } : {}
            }
          >
            📅 Completed Appointments
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-4 px-2 font-semibold transition ${
              activeTab === 'invoices'
                ? 'border-b-2 text-green-600'
                : 'text-gray-600'
            }`}
            style={
              activeTab === 'invoices' ? { borderBottomColor: '#10B981', color: '#10B981' } : {}
            }
          >
            💳 Invoices
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold" style={{ color: '#065F46' }}>
            Completed Appointments Ready for Invoicing
          </h2>
          
          {orders.length === 0 ? (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
              }}
              className="rounded-lg p-12 text-center"
            >
              <Calendar size={48} style={{ color: '#10B981' }} className="mx-auto mb-4" />
              <p style={{ color: '#6B7280' }}>No completed appointments found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {orders.map((apt) => (
                <div
                  key={apt.appointment_id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                  }}
                  className="rounded-lg p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg" style={{ color: '#065F46' }}>
                        {apt.patient_name} (MRN: {apt.mrn})
                      </h3>
                      <div style={{ color: '#6B7280' }} className="text-sm mt-2 space-y-1">
                        <p>📅 {new Date(apt.appointment_date).toLocaleDateString()} at {apt.appointment_time}</p>
                        <p>👨‍⚕️ Dr. {apt.doctor_first_name} {apt.doctor_last_name} - {apt.department_name}</p>
                        <p>💊 Consultation Fee: ${apt.consultation_fee}</p>
                        {apt.medicines_total > 0 && (
                          <p>💊 Medicines Total: ${apt.medicines_total}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p style={{ color: '#10B981' }} className="text-sm font-medium">
                        Expected Total
                      </p>
                      <p style={{ color: '#065F46' }} className="text-2xl font-bold">
                        ${(apt.consultation_fee + (apt.medicines_total || 0) + (apt.consultation_fee + (apt.medicines_total || 0)) * 0.1).toFixed(2)}
                      </p>

                      {apt.invoice_status === 'Generated' ? (
                        <span
                          style={{ backgroundColor: '#D1FAE5', color: '#059669' }}
                          className="inline-block mt-4 px-3 py-1 rounded text-sm font-medium"
                        >
                          ✓ Invoice Generated
                        </span>
                      ) : (
                        <button
                          onClick={() => handleGenerateInvoice(apt.appointment_id)}
                          disabled={generatingInvoice === apt.appointment_id}
                          style={{
                            backgroundColor: generatingInvoice === apt.appointment_id ? '#D1D5DB' : '#10B981',
                            color: '#FFFFFF',
                          }}
                          className="mt-4 px-4 py-2 rounded font-medium transition w-full"
                        >
                          {generatingInvoice === apt.appointment_id ? 'Generating...' : 'Generate Invoice'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold" style={{ color: '#065F46' }}>
            All Invoices
          </h2>

          {invoices.length === 0 ? (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
              }}
              className="rounded-lg p-12 text-center"
            >
              <FileText size={48} style={{ color: '#10B981' }} className="mx-auto mb-4" />
              <p style={{ color: '#6B7280' }}>No invoices found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#F3F4F6', borderBottom: '2px solid #E5E7EB' }}>
                    <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: '#065F46' }}>
                      Invoice ID
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: '#065F46' }}>
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: '#065F46' }}>
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: '#065F46' }}>
                      Paid
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: '#065F46' }}>
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: '#065F46' }}>
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.invoice_id}
                      style={{ borderBottom: '1px solid #E5E7EB' }}
                    >
                      <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#065F46' }}>
                        INV-{invoice.invoice_id}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#6B7280' }}>
                        {invoice.patient_name}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#065F46' }}>
                        ${invoice.total_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#10B981' }}>
                        ${invoice.amount_paid.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          style={{
                            backgroundColor:
                              invoice.status === 'Paid'
                                ? '#D1FAE5'
                                : invoice.status === 'Overdue'
                                ? '#FEE2E2'
                                : '#FEF3C7',
                            color:
                              invoice.status === 'Paid'
                                ? '#059669'
                                : invoice.status === 'Overdue'
                                ? '#DC2626'
                                : '#D97706',
                          }}
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#6B7280' }}>
                        {new Date(invoice.invoice_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FinanceDashboard;
