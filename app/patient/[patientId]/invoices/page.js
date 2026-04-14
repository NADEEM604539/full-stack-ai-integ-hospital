'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FileText, AlertCircle, DollarSign, Calendar, Clock, Download, User, Stethoscope } from 'lucide-react';
import jsPDF from 'jspdf';

const InvoicesPage = () => {
  const { patientId } = useParams();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, paid, pending, overdue
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, [patientId]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/patient/${patientId}/invoices`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch invoices');
      }

      const data = await response.json();
      setInvoices(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group invoices by appointment
  const groupByAppointment = () => {
    const grouped = {};
    invoices.forEach(inv => {
      const apptId = inv.appointment_id || 'no-appointment';
      if (!grouped[apptId]) {
        grouped[apptId] = {
          appointment: {
            appointment_id: inv.appointment_id,
            appointment_date: inv.appointment_date,
            appointment_time: inv.appointment_time,
            appointment_status: inv.appointment_status,
            reason_for_visit: inv.reason_for_visit,
            doctor_first_name: inv.doctor_first_name,
            doctor_last_name: inv.doctor_last_name,
            department_name: inv.department_name,
          },
          invoices: [],
        };
      }
      grouped[apptId].invoices.push(inv);
    });
    return Object.values(grouped);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return { bgColor: '#E8F8F5', textColor: '#10B981' };
      case 'pending':
      case 'unpaid':
        return { bgColor: '#FFE4F5', textColor: '#D97706' };
      case 'overdue':
        return { bgColor: '#FFD9E8', textColor: '#D97706' };
      case 'partial':
        return { bgColor: '#FFF9C4', textColor: '#F57F17' };
      case 'cancelled':
        return { bgColor: '#E8F8F5', textColor: '#10B981' };
      default:
        return { bgColor: '#E8F8F5', textColor: '#10B981' };
    }
  };

  const downloadInvoicePDF = async (invoice) => {
    try {
      setDownloadingId(invoice.invoice_id);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // ============ HEADER SECTION ============
      pdf.setFillColor(16, 185, 129);
      pdf.rect(0, 0, pageWidth, 35, 'F');

      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor(255, 255, 255);
      pdf.text('MEDICAL CARE CENTER', margin, 12);

      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text('123 Healthcare Ave | Phone: (555) 123-4567 | Email: billing@medcare.com', margin, 18);
      pdf.text('License #: HC-2024-001 | Tax ID: 12-3456789', margin, 23);

      yPosition = 42;

      // ============ INVOICE TITLE ============
      pdf.setTextColor(6, 95, 70);
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text('INVOICE', margin, yPosition);
      yPosition += 12;

      // ============ INVOICE & DATES INFO ============
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Invoice Details', margin, yPosition);
      yPosition += 6;

      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Invoice Number: INV-${invoice.invoice_id}`, margin, yPosition);
      yPosition += 5;
      pdf.text(`Invoice Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, yPosition);
      yPosition += 5;
      pdf.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, yPosition);
      yPosition += 5;
      if (invoice.appointment_date) {
        pdf.text(`Appointment Date: ${new Date(invoice.appointment_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${invoice.appointment_time}`, margin, yPosition);
      }
      yPosition += 8;

      // Status Badge
      const statusColor = invoice.status?.toLowerCase() === 'paid' ? '#10B981' : invoice.status?.toLowerCase() === 'pending' ? '#F59E0B' : '#D97706';
      pdf.setFillColor(...(statusColor === '#10B981' ? [16, 185, 129] : statusColor === '#F59E0B' ? [245, 158, 11] : [217, 119, 6]));
      pdf.rect(margin, yPosition - 3, 40, 6, 'F');
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`STATUS: ${invoice.status?.toUpperCase()}`, margin + 2, yPosition + 1.5);
      pdf.setTextColor(6, 95, 70);

      yPosition += 12;

      // ============ PATIENT DETAILS SECTION ============
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Patient Information', margin, yPosition);
      yPosition += 6;

      pdf.setFillColor(245, 253, 251);
      pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 28, 'F');
      pdf.setDrawColor(16, 185, 129);
      pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 28);

      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(9);

      pdf.text('Patient ID (MRN):', margin + 3, yPosition);
      pdf.text(`${invoice.mrn || 'N/A'}`, margin + 50, yPosition);
      
      yPosition += 5;
      pdf.text('Patient Name:', margin + 3, yPosition);
      pdf.text(`${invoice.first_name || ''} ${invoice.last_name || 'Not Available'}`, margin + 50, yPosition);

      yPosition += 5;
      pdf.text('Email:', margin + 3, yPosition);
      pdf.text(`${invoice.email || 'N/A'}`, margin + 50, yPosition);

      yPosition += 5;
      pdf.text('Phone Number:', margin + 3, yPosition);
      pdf.text(`${invoice.phone_number || 'N/A'}`, margin + 50, yPosition);

      yPosition += 10;

      // ============ APPOINTMENT INFO (if available) ============
      if (invoice.appointment_date) {
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text('Appointment Information', margin, yPosition);
        yPosition += 6;

        pdf.setFillColor(245, 253, 251);
        pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 18, 'F');
        pdf.setDrawColor(16, 185, 129);
        pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 18);

        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(9);

        pdf.text('Date & Time:', margin + 3, yPosition);
        pdf.text(`${new Date(invoice.appointment_date).toLocaleDateString()} at ${invoice.appointment_time}`, margin + 50, yPosition);
        
        yPosition += 5;
        pdf.text('Doctor:', margin + 3, yPosition);
        pdf.text(`${invoice.doctor_first_name || ''} ${invoice.doctor_last_name || 'N/A'}`, margin + 50, yPosition);

        yPosition += 8;
      }

      // ============ SERVICES SECTION ============
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Itemized Services', margin, yPosition);
      yPosition += 7;

      const tableLeft = margin;
      const col1X = margin + 2;
      const col2X = margin + 95;
      const col3X = margin + 125;
      const col4X = margin + 160;
      const tableRight = pageWidth - margin;
      const colWidth1 = 93;
      const colWidth2 = 30;
      const colWidth3 = 35;
      const colWidth4 = 30;

      // Table Header
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setFillColor(16, 185, 129);
      pdf.setTextColor(255, 255, 255);
      const tableTopY = yPosition - 4;
      pdf.rect(tableLeft, tableTopY, tableRight - tableLeft, 6, 'F');
      
      pdf.setDrawColor(16, 185, 129);
      pdf.line(col2X - 2, tableTopY, col2X - 2, tableTopY + 6);
      pdf.line(col3X - 2, tableTopY, col3X - 2, tableTopY + 6);
      pdf.line(col4X - 2, tableTopY, col4X - 2, tableTopY + 6);
      
      pdf.text('Service Description', col1X, yPosition + 1);
      pdf.text('Quantity', col2X, yPosition + 1);
      pdf.text('Price', col3X, yPosition + 1);
      pdf.text('Total', col4X, yPosition + 1);

      yPosition += 8;

      const services = [
        { description: 'Medical Consultation & Assessment', quantity: 1, unitPrice: parseFloat(invoice.subtotal) * 0.4, total: parseFloat(invoice.subtotal) * 0.4 },
        { description: 'Diagnostic Tests & Lab Work', quantity: 2, unitPrice: parseFloat(invoice.subtotal) * 0.3, total: parseFloat(invoice.subtotal) * 0.6 },
        { description: 'Medication & Prescription Processing', quantity: 1, unitPrice: parseFloat(invoice.subtotal) * 0.3, total: parseFloat(invoice.subtotal) * 0.3 },
      ];

      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(6, 95, 70);

      services.forEach((service, idx) => {
        const descLines = pdf.splitTextToSize(service.description, colWidth1 - 2);
        const lineHeight = descLines.length > 1 ? 4 : 5;
        const rowHeight = lineHeight + 1;
        const rowTop = yPosition - 3;
        
        if (idx % 2 === 1) {
          pdf.setFillColor(245, 253, 251);
          pdf.rect(tableLeft, rowTop, tableRight - tableLeft, rowHeight + 2, 'F');
        }
        
        pdf.setDrawColor(200, 220, 215);
        pdf.line(tableLeft, rowTop, tableRight, rowTop);
        pdf.line(col2X - 2, rowTop, col2X - 2, rowTop + rowHeight + 2);
        pdf.line(col3X - 2, rowTop, col3X - 2, rowTop + rowHeight + 2);
        pdf.line(col4X - 2, rowTop, col4X - 2, rowTop + rowHeight + 2);
        
        pdf.text(descLines, col1X, yPosition);
        pdf.text(service.quantity.toString(), col2X, yPosition, { align: 'center' });
        pdf.text(`$${service.unitPrice.toFixed(2)}`, col3X, yPosition, { align: 'center' });
        pdf.text(`$${service.total.toFixed(2)}`, col4X, yPosition, { align: 'right' });

        yPosition += rowHeight + 2;
      });

      pdf.setDrawColor(16, 185, 129);
      pdf.line(tableLeft, yPosition - 2, tableRight, yPosition - 2);

      yPosition += 3;

      // ============ SUMMARY SECTION ============
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Amount Summary', margin, yPosition);
      yPosition += 7;

      pdf.setFillColor(240, 253, 244);
      pdf.rect(margin, yPosition - 3, pageWidth - 2 * margin, 55, 'F');

      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(10);

      const summaryData = [
        { label: 'Subtotal', value: (parseFloat(invoice.subtotal) || 0).toFixed(2) },
        { label: 'Tax (applicable)', value: (parseFloat(invoice.tax_amount) || 0).toFixed(2) },
        { label: 'Discount Applied', value: `-$${(parseFloat(invoice.discount_amount) || 0).toFixed(2)}` },
      ];

      summaryData.forEach((item, idx) => {
        pdf.setTextColor(6, 95, 70);
        pdf.text(item.label, margin + 5, yPosition);
        pdf.text(`$${item.value}`, pageWidth - margin - 5, yPosition, { align: 'right' });
        yPosition += 5;
      });

      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(16, 185, 129);
      yPosition += 2;
      pdf.text('TOTAL AMOUNT DUE', margin + 5, yPosition);
      pdf.text(`$${(parseFloat(invoice.total_amount) || 0).toFixed(2)}`, pageWidth - margin - 5, yPosition, { align: 'right' });

      yPosition += 8;

      // ============ PAYMENT INFO SECTION ============
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Payment Information', margin, yPosition);
      yPosition += 7;

      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(6, 95, 70);

      const paymentData = [
        { label: 'Amount Paid', value: (parseFloat(invoice.amount_paid) || 0).toFixed(2) },
        { label: 'Outstanding Balance', value: (parseFloat(invoice.outstanding_balance) || 0).toFixed(2) },
      ];

      paymentData.forEach((item) => {
        pdf.text(item.label, margin, yPosition);
        pdf.text(`$${item.value}`, pageWidth - margin - 5, yPosition, { align: 'right' });
        yPosition += 5;
      });

      yPosition += 8;

      // ============ FOOTER ============
      pdf.setFont('Helvetica', 'italic');
      pdf.setFontSize(9);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Thank you for choosing our healthcare services', margin, pageHeight - 15);
      pdf.text('For inquiries, please contact billing@medcare.com | Phone: (555) 123-4567', margin, pageHeight - 10);

      pdf.setDrawColor(16, 185, 129);
      pdf.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);

      pdf.save(`Invoice_${invoice.invoice_id}_${new Date(invoice.invoice_date).toISOString().split('T')[0]}.pdf`);
      setDownloadingId(null);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setDownloadingId(null);
    }
  };

  const groupedInvoices = groupByAppointment();
  
  const filteredInvoices = groupedInvoices.map(group => ({
    ...group,
    invoices: group.invoices.filter((inv) => {
      if (filter === 'all') return true;
      if (filter === 'paid') return inv.status?.toLowerCase() === 'paid';
      if (filter === 'pending') return ['pending', 'unpaid', 'partial'].includes(inv.status?.toLowerCase());
      if (filter === 'overdue') return inv.status?.toLowerCase() === 'overdue';
      return true;
    }),
  })).filter(group => group.invoices.length > 0);

  const stats = {
    totalAmount: invoices.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0),
    paidAmount: invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount_paid) || 0), 0),
    outstandingBalance: invoices.reduce(
      (sum, inv) => sum + (parseFloat(inv.outstanding_balance) || 0),
      0
    ),
    overdueAmount: invoices
      .filter((inv) => inv.status?.toLowerCase() === 'overdue')
      .reduce((sum, inv) => sum + (parseFloat(inv.outstanding_balance) || 0), 0),
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold" style={{ color: '#065F46' }}>Invoices & Payments</h2>
        <p style={{ color: '#10B981' }} className="mt-2 font-medium">
          View and manage your billing information by appointment
        </p>
      </div>

      {error && (
        <div
          style={{ backgroundColor: '#FFD9E8', borderLeft: '4px solid #F59E0B' }}
          className="rounded-lg p-4 mb-8 flex gap-3"
        >
          <AlertCircle size={20} style={{ color: '#D97706' }} className="flex-shrink-0 mt-0.5" />
          <p style={{ color: '#065F46' }} className="font-medium">
            {error}
          </p>
        </div>
      )}

      {!loading && invoices.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Amount */}
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
                    Total Amount
                  </p>
                  <p style={{ color: '#065F46' }} className="text-2xl font-bold mt-1">
                    ${(stats.totalAmount || 0).toFixed(2)}
                  </p>
                </div>
                <DollarSign size={32} style={{ color: '#E8F8F5' }} />
              </div>
            </div>

            {/* Paid Amount */}
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
                    Paid
                  </p>
                  <p style={{ color: '#10B981' }} className="text-2xl font-bold mt-1">
                    ${(stats.paidAmount || 0).toFixed(2)}
                  </p>
                </div>
                <DollarSign size={32} style={{ color: '#E8F8F5' }} />
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
                  <p style={{ color: '#10B981' }} className="text-sm font-medium">
                    Outstanding
                  </p>
                  <p style={{ color: '#D97706' }} className="text-2xl font-bold mt-1">
                    ${(stats.outstandingBalance || 0).toFixed(2)}
                  </p>
                </div>
                <DollarSign size={32} style={{ color: '#FFE4D6' }} />
              </div>
            </div>

            {/* Overdue Amount */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderTop: '4px solid #D97706',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)',
              }}
              className="rounded-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ color: '#10B981' }} className="text-sm font-medium">
                    Overdue
                  </p>
                  <p style={{ color: '#D97706' }} className="text-2xl font-bold mt-1">
                    ${(stats.overdueAmount || 0).toFixed(2)}
                  </p>
                </div>
                <AlertCircle size={32} style={{ color: '#FFE4D6' }} />
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 mb-8 overflow-x-auto">
            {['all', 'paid', 'pending', 'overdue'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className="px-4 py-2 rounded-lg font-medium whitespace-nowrap transition"
                style={
                  filter === status
                    ? {
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                      }
                    : {
                        backgroundColor: '#E8F8F5',
                        color: '#065F46',
                        borderColor: '#10B981',
                        border: '1px solid',
                      }
                }
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                backgroundColor: '#FFFFFF',
                borderLeft: '4px solid #10B981',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)',
              }}
              className="rounded-lg p-6 h-32 animate-pulse"
            >
              <div style={{ backgroundColor: '#E8F8F5' }} className="h-4 rounded mb-3"></div>
              <div style={{ backgroundColor: '#E8F8F5' }} className="h-4 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderTop: '4px solid #10B981',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)',
          }}
          className="rounded-lg p-12 text-center"
        >
          <FileText size={48} style={{ color: '#10B981' }} className="mx-auto mb-4" />
          <h3 className="text-lg font-semibold" style={{ color: '#065F46' }}>
            {invoices.length === 0 ? 'No Invoices' : 'No invoices found'}
          </h3>
          <p style={{ color: '#10B981' }} className="mt-2 font-medium">
            {invoices.length === 0
              ? "You don't have any invoices yet."
              : 'No invoices match the selected filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredInvoices.map((group, idx) => {
            const appointmentTotal = group.invoices.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0);
            const appointmentPaid = group.invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount_paid) || 0), 0);
            const appointmentBalance = appointmentTotal - appointmentPaid;

            return (
              <div
                key={group.appointment?.appointment_id || `no-appt-${idx}`}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderLeft: '4px solid #10B981',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)',
                }}
                className="rounded-lg overflow-hidden"
              >
                {/* Appointment Header */}
                <div style={{ backgroundColor: '#F0FDF4', borderBottom: '2px solid #E8F8F5' }} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      {group.appointment?.appointment_date ? (
                        <>
                          <div className="flex items-center gap-3 mb-2">
                            <Calendar size={20} style={{ color: '#10B981' }} />
                            <h3 className="font-semibold text-lg" style={{ color: '#065F46' }}>
                              {new Date(group.appointment.appointment_date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </h3>
                            <Clock size={16} style={{ color: '#10B981' }} />
                            <span style={{ color: '#065F46' }} className="font-medium">
                              {group.appointment.appointment_time}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 ml-0 md:ml-6">
                            <Stethoscope size={16} style={{ color: '#10B981' }} />
                            <span style={{ color: '#065F46' }}>
                              Dr. {group.appointment.doctor_first_name} {group.appointment.doctor_last_name}
                            </span>
                            {group.appointment.department_name && (
                              <>
                                <span style={{ color: '#D1D5DB' }}>•</span>
                                <span style={{ color: '#10B981' }}>{group.appointment.department_name}</span>
                              </>
                            )}
                          </div>
                          {group.appointment.reason_for_visit && (
                            <p style={{ color: '#6B7280', marginTop: '8px' }} className="text-sm">
                              Reason: {group.appointment.reason_for_visit}
                            </p>
                          )}
                        </>
                      ) : (
                        <div style={{ color: '#6B7280' }}>
                          No appointment linked
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p style={{ color: '#10B981' }} className="text-xs font-medium">
                        Appointment Total
                      </p>
                      <p style={{ color: '#065F46' }} className="text-2xl font-bold">
                        ${appointmentTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Invoices for this appointment */}
                <div className="space-y-3 p-6">
                  {group.invoices.map((invoice) => {
                    const statusColor = getStatusColor(invoice.status);
                    return (
                      <div
                        key={invoice.invoice_id}
                        style={{ backgroundColor: '#F9FAFB', border: '1px solid #E8F8F5' }}
                        className="p-4 rounded-lg"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText size={16} style={{ color: '#10B981' }} />
                              <h4 className="font-semibold" style={{ color: '#065F46' }}>
                                Invoice #{invoice.invoice_id}
                              </h4>
                              <span
                                style={{
                                  backgroundColor: statusColor.bgColor,
                                  color: statusColor.textColor,
                                }}
                                className="text-xs font-medium px-2 py-1 rounded"
                              >
                                {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1).toLowerCase()}
                              </span>
                            </div>
                            <p style={{ color: '#6B7280' }} className="text-sm">
                              Issued: {new Date(invoice.invoice_date).toLocaleDateString()} | Due: {new Date(invoice.due_date).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-4 md:w-auto">
                            <div className="text-right">
                              <p style={{ color: '#10B981' }} className="text-xs font-medium">
                                Total
                              </p>
                              <p style={{ color: '#065F46' }} className="font-bold">
                                ${(parseFloat(invoice.total_amount) || 0).toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p style={{ color: '#10B981' }} className="text-xs font-medium">
                                Balance
                              </p>
                              <p style={{ color: invoice.outstanding_balance > 0 ? '#D97706' : '#10B981' }} className="font-bold">
                                ${(parseFloat(invoice.outstanding_balance) || 0).toFixed(2)}
                              </p>
                            </div>
                            <button
                              onClick={() => downloadInvoicePDF(invoice)}
                              disabled={downloadingId === invoice.invoice_id}
                              className="px-3 py-2 rounded font-medium text-sm transition"
                              style={{
                                backgroundColor: downloadingId === invoice.invoice_id ? '#10B98166' : '#10B981',
                                color: '#FFFFFF',
                              }}
                              title="Download Invoice as PDF"
                            >
                              <Download size={16} className="inline" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Appointment Summary */}
                  <div
                    style={{ backgroundColor: '#E8F8F5', border: '1px solid #10B981' }}
                    className="p-4 rounded-lg mt-4"
                  >
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p style={{ color: '#10B981' }} className="text-xs font-medium">
                          Total
                        </p>
                        <p style={{ color: '#065F46' }} className="text-lg font-bold">
                          ${appointmentTotal.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#10B981' }} className="text-xs font-medium">
                          Paid
                        </p>
                        <p style={{ color: '#10B981' }} className="text-lg font-bold">
                          ${appointmentPaid.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#10B981' }} className="text-xs font-medium">
                          Balance Due
                        </p>
                        <p style={{ color: appointmentBalance > 0 ? '#D97706' : '#10B981' }} className="text-lg font-bold">
                          ${appointmentBalance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
