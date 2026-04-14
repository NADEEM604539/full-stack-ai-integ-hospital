'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, AlertCircle, Download, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const InvoiceDetailPage = () => {
  const params = useParams();
  const invoiceId = params.invoiceId;
  
  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [invoiceId]);

  const convertInvoiceNumbers = (data) => {
    if (!data) return data;
    return {
      ...data,
      subtotal: Number(data.subtotal || 0),
      tax_amount: Number(data.tax_amount || 0),
      discount_amount: Number(data.discount_amount || 0),
      total_amount: Number(data.total_amount || 0),
      amount_paid: Number(data.amount_paid || 0),
      items: (data.items || []).map(item => ({
        ...item,
        quantity: Number(item.quantity || 1),
        unit_price: Number(item.unit_price || 0),
        line_total: Number(item.line_total || 0)
      }))
    };
  };

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/finance/invoices/${invoiceId}`);
      const data = await response.json();
      
      if (data.success) {
        const converted = convertInvoiceNumbers(data.data);
        setInvoice(converted);
        setItems(converted?.items || []);
        setNewStatus(converted?.status);
      } else {
        setError(data.error || 'Failed to fetch invoice');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/finance/invoices/${invoiceId}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();
      if (result.success) {
        alert('✓ Invoice status updated successfully!');
        fetchInvoiceDetails();
        setEditingStatus(false);
      } else {
        alert(`✗ ${result.error || 'Failed to update invoice'}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Paid': { bg: '#D1FAE5', text: '#059669' },
      'Unpaid': { bg: '#FEE2E2', text: '#DC2626' },
      'Partial': { bg: '#FEF3C7', text: '#D97706' },
      'Overdue': { bg: '#FBCCCC', text: '#991B1B' }
    };

    const config = statusConfig[status] || { bg: '#F3F4F6', text: '#6B7280' };

    return (
      <span
        style={{ backgroundColor: config.bg, color: config.text }}
        className="inline-block px-4 py-2 rounded-lg text-sm font-bold"
      >
        {status}
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

  if (error || !invoice) {
    return (
      <div className="space-y-6">
        <Link href="/finance/invoices" className="flex items-center gap-2" style={{ color: '#10B981' }}>
          <ArrowLeft size={20} />
          Back to Invoices
        </Link>
        <div
          style={{ backgroundColor: '#FEE2E2', borderLeft: '4px solid #EF4444' }}
          className="p-4 rounded"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={20} style={{ color: '#DC2626' }} />
            <p style={{ color: '#DC2626' }}>{error || 'Invoice not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Link href="/finance/invoices" className="flex items-center gap-2" style={{ color: '#10B981' }}>
        <ArrowLeft size={20} />
        Back to Invoices
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{ color: '#065F46' }}>
          Invoice #{invoice.invoice_id}
        </h1>
        <button
          className="p-2 rounded hover:bg-gray-100"
          title="Download PDF"
        >
          <Download size={20} style={{ color: '#10B981' }} />
        </button>
      </div>

      {/* Status and Status Editor */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px'
        }}
        className="p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p style={{ color: '#6B7280' }} className="text-sm font-medium">Current Status</p>
            {getStatusBadge(invoice.status)}
          </div>

          {editingStatus ? (
            <div className="flex gap-2">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="px-4 py-2 border rounded-lg"
                style={{ borderColor: '#E5E7EB' }}
              >
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Partial">Partial</option>
                <option value="Overdue">Overdue</option>
              </select>
              <button
                onClick={handleUpdateStatus}
                disabled={saving}
                style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                className="px-4 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setEditingStatus(false);
                  setNewStatus(invoice.status);
                }}
                style={{ backgroundColor: '#E5E7EB', color: '#6B7280' }}
                className="px-4 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingStatus(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{ backgroundColor: '#F3F4F6', color: '#065F46' }}
            >
              <Edit2 size={16} />
              Change Status
            </button>
          )}
        </div>
      </div>

      {/* Patient & Appointment Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient Info */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px'
          }}
          className="p-6"
        >
          <h2 style={{ color: '#065F46' }} className="font-bold text-lg mb-4">Patient Information</h2>
          <div className="space-y-3" style={{ color: '#6B7280' }}>
            <p><span className="font-medium">Name:</span> {invoice.patient_name}</p>
            <p><span className="font-medium">MRN:</span> {invoice.mrn}</p>
            <p><span className="font-medium">Email:</span> {invoice.patient_email || 'N/A'}</p>
            <p><span className="font-medium">Phone:</span> {invoice.patient_phone || 'N/A'}</p>
          </div>
        </div>

        {/* Appointment Info */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px'
          }}
          className="p-6"
        >
          <h2 style={{ color: '#065F46' }} className="font-bold text-lg mb-4">Appointment Details</h2>
          <div className="space-y-3" style={{ color: '#6B7280' }}>
            <p><span className="font-medium">Date:</span> {new Date(invoice.appointment_date).toLocaleDateString()}</p>
            <p><span className="font-medium">Time:</span> {invoice.appointment_time}</p>
            <p><span className="font-medium">Doctor:</span> {invoice.doctor_name || 'N/A'}</p>
            <p><span className="font-medium">Department:</span> {invoice.department_name || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px'
        }}
        className="p-6"
      >
        <h2 style={{ color: '#065F46' }} className="font-bold text-lg mb-4">Invoice Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p style={{ color: '#6B7280' }} className="text-sm">Invoice Date</p>
            <p style={{ color: '#065F46' }} className="font-bold">{new Date(invoice.invoice_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p style={{ color: '#6B7280' }} className="text-sm">Due Date</p>
            <p style={{ color: '#065F46' }} className="font-bold">{new Date(invoice.due_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p style={{ color: '#6B7280' }} className="text-sm">Days Overdue</p>
            <p style={{ color: invoice.days_overdue > 0 ? '#DC2626' : '#10B981' }} className="font-bold">
              {invoice.days_overdue > 0 ? invoice.days_overdue + ' days' : '0 days'}
            </p>
          </div>
          <div>
            <p style={{ color: '#6B7280' }} className="text-sm">Created By</p>
            <p style={{ color: '#065F46' }} className="font-bold">{invoice.created_by || 'System'}</p>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px'
        }}
        className="p-6 overflow-x-auto"
      >
        <h2 style={{ color: '#065F46' }} className="font-bold text-lg mb-4">Invoice Items</h2>
        <table className="w-full">
          <thead style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold" style={{ color: '#065F46' }}>Description</th>
              <th className="px-4 py-2 text-center text-sm font-semibold" style={{ color: '#065F46' }}>Type</th>
              <th className="px-4 py-2 text-center text-sm font-semibold" style={{ color: '#065F46' }}>Quantity</th>
              <th className="px-4 py-2 text-right text-sm font-semibold" style={{ color: '#065F46' }}>Price</th>
              <th className="px-4 py-2 text-right text-sm font-semibold" style={{ color: '#065F46' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-4 text-center" style={{ color: '#6B7280' }}>
                  No items found
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td className="px-4 py-4 text-sm" style={{ color: '#065F46' }}>{item.description}</td>
                  <td className="px-4 py-4 text-center text-sm" style={{ color: '#6B7280' }}>{item.item_type}</td>
                  <td className="px-4 py-4 text-center text-sm" style={{ color: '#6B7280' }}>{item.quantity}</td>
                  <td className="px-4 py-4 text-right text-sm" style={{ color: '#6B7280' }}>${item.unit_price.toFixed(2)}</td>
                  <td className="px-4 py-4 text-right text-sm font-semibold" style={{ color: '#065F46' }}>
                    ${(item.quantity * item.unit_price).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px'
        }}
        className="p-6 ml-auto w-full md:w-80"
      >
        <h2 style={{ color: '#065F46' }} className="font-bold text-lg mb-4">Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span style={{ color: '#6B7280' }}>Subtotal:</span>
            <span style={{ color: '#065F46' }} className="font-semibold">${invoice.subtotal?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#6B7280' }}>Tax (10%):</span>
            <span style={{ color: '#065F46' }} className="font-semibold">${invoice.tax_amount?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#6B7280' }}>Discount:</span>
            <span style={{ color: '#065F46' }} className="font-semibold">${invoice.discount_amount?.toFixed(2) || '0.00'}</span>
          </div>
          <div
            style={{
              borderTop: '2px solid #E5E7EB',
              paddingTop: '12px'
            }}
            className="flex justify-between"
          >
            <span style={{ color: '#065F46' }} className="font-bold">Total Amount:</span>
            <span style={{ color: '#10B981' }} className="text-xl font-bold">${invoice.total_amount?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#6B7280' }}>Amount Paid:</span>
            <span style={{ color: '#10B981' }} className="font-semibold">${invoice.amount_paid?.toFixed(2) || '0.00'}</span>
          </div>
          <div
            style={{
              backgroundColor: '#FEF3C7',
              borderRadius: '6px',
              padding: '8px 12px'
            }}
            className="flex justify-between"
          >
            <span style={{ color: '#856404' }} className="font-bold">Pending:</span>
            <span style={{ color: '#D97706' }} className="font-bold">${((invoice.total_amount - invoice.amount_paid) || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailPage;
