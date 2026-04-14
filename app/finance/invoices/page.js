'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Edit2, Filter, Loader2, AlertCircle, Eye } from 'lucide-react';
import Link from 'next/link';

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [searchTerm, filterStatus, invoices]);

  const convertInvoiceNumbers = (invs) => {
    return invs.map(inv => ({
      ...inv,
      total_amount: Number(inv.total_amount || 0),
      amount_paid: Number(inv.amount_paid || 0)
    }));
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/finance/invoices?limit=1000');
      const data = await response.json();
      
      if (data.success) {
        setInvoices(convertInvoiceNumbers(data.data || []));
      } else {
        setError(data.error || 'Failed to fetch invoices');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let result = invoices;

    // Filter by status
    if (filterStatus) {
      result = result.filter(inv => inv.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      result = result.filter(inv =>
        inv.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoice_id.toString().includes(searchTerm)
      );
    }

    setFiltered(result);
  };

  const handleUpdateStatus = async (invoiceId, newInvoiceStatus) => {
    try {
      const response = await fetch(`/api/finance/invoices/${invoiceId}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newInvoiceStatus })
      });

      const result = await response.json();
      if (result.success) {
        alert('✓ Invoice status updated successfully!');
        fetchInvoices();
        setEditingInvoice(null);
      } else {
        alert(`✗ ${result.error || 'Failed to update invoice'}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Paid': { bg: '#D1FAE5', text: '#059669', icon: '✓' },
      'Unpaid': { bg: '#FEE2E2', text: '#DC2626', icon: '✗' },
      'Partial': { bg: '#FEF3C7', text: '#D97706', icon: '◐' },
      'Overdue': { bg: '#FBCCCC', text: '#991B1B', icon: '!' }
    };

    const config = statusConfig[status] || { bg: '#F3F4F6', text: '#6B7280', icon: '○' };

    return (
      <span
        style={{ backgroundColor: config.bg, color: config.text }}
        className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
      >
        {config.icon} {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 size={40} style={{ color: '#10B981' }} className="animate-spin" />
      </div>
    );
  }

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'Paid').length,
    unpaid: invoices.filter(i => i.status === 'Unpaid').length,
    partial: invoices.filter(i => i.status === 'Partial').length,
    overdue: invoices.filter(i => i.status === 'Overdue').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: '#065F46' }}>
          💳 Invoices Management
        </h1>
        <p style={{ color: '#10B981' }} className="mt-2">
          View, update, and track all invoices
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }} className="rounded-lg p-4">
          <p style={{ color: '#6B7280' }} className="text-xs font-medium">Total</p>
          <p style={{ color: '#065F46' }} className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div style={{ backgroundColor: '#D1FAE5', border: '1px solid #86EFAC' }} className="rounded-lg p-4">
          <p style={{ color: '#059669' }} className="text-xs font-medium">Paid</p>
          <p style={{ color: '#065F46' }} className="text-2xl font-bold">{stats.paid}</p>
        </div>
        <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }} className="rounded-lg p-4">
          <p style={{ color: '#DC2626' }} className="text-xs font-medium">Unpaid</p>
          <p style={{ color: '#991B1B' }} className="text-2xl font-bold">{stats.unpaid}</p>
        </div>
        <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }} className="rounded-lg p-4">
          <p style={{ color: '#D97706' }} className="text-xs font-medium">Partial</p>
          <p style={{ color: '#92400E' }} className="text-2xl font-bold">{stats.partial}</p>
        </div>
        <div style={{ backgroundColor: '#FBCCCC', border: '1px solid #F87171' }} className="rounded-lg p-4">
          <p style={{ color: '#991B1B' }} className="text-xs font-medium">Overdue</p>
          <p style={{ color: '#7F1D1D' }} className="text-2xl font-bold">{stats.overdue}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by patient name, MRN, or invoice ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none"
          style={{ borderColor: '#E5E7EB', minWidth: '200px' }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none"
          style={{ borderColor: '#E5E7EB' }}
        >
          <option value="">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Partial">Partial</option>
          <option value="Overdue">Overdue</option>
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

      {/* Invoices Table */}
      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }} className="rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#065F46' }}>Invoice ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#065F46' }}>Patient</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#065F46' }}>Date</th>
                <th className="px-6 py-4 text-right text-sm font-semibold" style={{ color: '#065F46' }}>Amount</th>
                <th className="px-6 py-4 text-right text-sm font-semibold" style={{ color: '#065F46' }}>Paid</th>
                <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: '#065F46' }}>Status</th>
                <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: '#065F46' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <FileText size={48} style={{ color: '#10B981' }} className="mx-auto mb-4" />
                    <p style={{ color: '#6B7280' }}>No invoices found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.invoice_id} style={{ borderBottom: '1px solid #E5E7EB' }} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span style={{ color: '#065F46' }} className="font-semibold">
                        #{inv.invoice_id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p style={{ color: '#065F46' }} className="font-medium">{inv.patient_name}</p>
                        <p style={{ color: '#6B7280' }} className="text-xs">MRN: {inv.mrn}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p style={{ color: '#6B7280' }} className="text-sm">
                        {new Date(inv.invoice_date).toLocaleDateString()}
                      </p>
                      <p style={{ color: '#9CA3AF' }} className="text-xs">
                        Due: {new Date(inv.due_date).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p style={{ color: '#065F46' }} className="font-bold">${inv.total_amount.toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p style={{ color: '#10B981' }} className="font-semibold">${inv.amount_paid.toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {editingInvoice === inv.invoice_id ? (
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="px-2 py-1 border rounded text-sm"
                          style={{ borderColor: '#E5E7EB' }}
                        >
                          <option value="">Select Status</option>
                          <option value="Paid">Paid</option>
                          <option value="Unpaid">Unpaid</option>
                          <option value="Partial">Partial</option>
                          <option value="Overdue">Overdue</option>
                        </select>
                      ) : (
                        getStatusBadge(inv.status)
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {editingInvoice === inv.invoice_id ? (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(inv.invoice_id, newStatus)}
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingInvoice(null)}
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{ backgroundColor: '#E5E7EB', color: '#6B7280' }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingInvoice(inv.invoice_id);
                                setNewStatus(inv.status);
                              }}
                              className="p-1 rounded hover:bg-gray-100 transition"
                              title="Edit Status"
                            >
                              <Edit2 size={16} style={{ color: '#10B981' }} />
                            </button>
                            <Link
                              href={`/finance/invoices/${inv.invoice_id}`}
                              className="p-1 rounded hover:bg-gray-100 transition"
                              title="View Details"
                            >
                              <Eye size={16} style={{ color: '#065F46' }} />
                            </Link>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoicesPage;
