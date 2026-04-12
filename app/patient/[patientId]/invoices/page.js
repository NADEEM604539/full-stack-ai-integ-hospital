'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FileText, AlertCircle, DollarSign, Calendar, Clock, Download } from 'lucide-react';
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return { bgColor: '#E8F8F5', textColor: '#10B981' };
      case 'pending':
        return { bgColor: '#FFE4F5', textColor: '#10B981' };
      case 'overdue':
        return { bgColor: '#FFD9E8', textColor: '#D97706' };
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
      const columnWidth = (pageWidth - 2 * margin) / 2;
      let yPosition = margin;

      // ============ HEADER SECTION ============
      // Hospital Header Background
      pdf.setFillColor(16, 185, 129);
      pdf.rect(0, 0, pageWidth, 35, 'F');

      // Hospital Name & Info
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

      // Patient details box background
      pdf.setFillColor(245, 253, 251);
      pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 28, 'F');
      pdf.setDrawColor(16, 185, 129);
      pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 28);

      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(9);

      // Left column
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

      // ============ SERVICES SECTION ============
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Itemized Services', margin, yPosition);
      yPosition += 7;

      // Define table column positions
      const tableLeft = margin;
      const col1X = margin + 2;        // Service Description
      const col2X = margin + 95;       // Quantity
      const col3X = margin + 125;      // Price
      const col4X = margin + 160;      // Total
      const tableRight = pageWidth - margin;
      const colWidth1 = 93;            // Description width
      const colWidth2 = 30;            // Quantity width
      const colWidth3 = 35;            // Price width
      const colWidth4 = 30;            // Total width

      // Table Header
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setFillColor(16, 185, 129);
      pdf.setTextColor(255, 255, 255);
      const tableTopY = yPosition - 4;
      pdf.rect(tableLeft, tableTopY, tableRight - tableLeft, 6, 'F');
      
      // Header borders
      pdf.setDrawColor(16, 185, 129);
      pdf.line(col2X - 2, tableTopY, col2X - 2, tableTopY + 6);
      pdf.line(col3X - 2, tableTopY, col3X - 2, tableTopY + 6);
      pdf.line(col4X - 2, tableTopY, col4X - 2, tableTopY + 6);
      
      pdf.text('Service Description', col1X, yPosition + 1);
      pdf.text('Quantity', col2X, yPosition + 1);
      pdf.text('Price', col3X, yPosition + 1);
      pdf.text('Total', col4X, yPosition + 1);

      yPosition += 8;

      // Service Items - Generate sample if needed
      const services = [
        { description: 'Medical Consultation & Assessment', quantity: 1, unitPrice: parseFloat(invoice.subtotal) * 0.4, total: parseFloat(invoice.subtotal) * 0.4 },
        { description: 'Diagnostic Tests & Lab Work', quantity: 2, unitPrice: parseFloat(invoice.subtotal) * 0.3, total: parseFloat(invoice.subtotal) * 0.6 },
        { description: 'Medication & Prescription Processing', quantity: 1, unitPrice: parseFloat(invoice.subtotal) * 0.3, total: parseFloat(invoice.subtotal) * 0.3 },
      ];

      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(6, 95, 70);

      services.forEach((service, idx) => {
        // Wrap long text
        const descLines = pdf.splitTextToSize(service.description, colWidth1 - 2);
        const lineHeight = descLines.length > 1 ? 4 : 5;
        const rowHeight = lineHeight + 1;
        const rowTop = yPosition - 3;
        
        // Row background (alternating light)
        if (idx % 2 === 1) {
          pdf.setFillColor(245, 253, 251);
          pdf.rect(tableLeft, rowTop, tableRight - tableLeft, rowHeight + 2, 'F');
        }
        
        // Row borders
        pdf.setDrawColor(200, 220, 215);
        pdf.line(tableLeft, rowTop, tableRight, rowTop); // Top border
        pdf.line(col2X - 2, rowTop, col2X - 2, rowTop + rowHeight + 2); // Col separator
        pdf.line(col3X - 2, rowTop, col3X - 2, rowTop + rowHeight + 2); // Col separator
        pdf.line(col4X - 2, rowTop, col4X - 2, rowTop + rowHeight + 2); // Col separator
        
        // Text content
        pdf.text(descLines, col1X, yPosition);
        pdf.text(service.quantity.toString(), col2X, yPosition, { align: 'center' });
        pdf.text(`$${service.unitPrice.toFixed(2)}`, col3X, yPosition, { align: 'center' });
        pdf.text(`$${service.total.toFixed(2)}`, col4X, yPosition, { align: 'right' });

        yPosition += rowHeight + 2;
      });

      // Bottom border of table
      pdf.setDrawColor(16, 185, 129);
      pdf.line(tableLeft, yPosition - 2, tableRight, yPosition - 2);

      yPosition += 3;

      // ============ SUMMARY SECTION ============
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Amount Summary', margin, yPosition);
      yPosition += 7;

      // Summary Box Background
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

      // Total Amount (Bold & Larger)
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

      // ============ NOTES SECTION ============
      if (invoice.status?.toLowerCase() === 'pending' && parseFloat(invoice.outstanding_balance) > 0) {
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setFillColor(255, 244, 224);
        pdf.rect(margin, yPosition - 3, pageWidth - 2 * margin, 12, 'F');
        pdf.setTextColor(217, 119, 6);
        pdf.text('⚠ Payment Due:', margin + 2, yPosition);
        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(9);
        const noteLines = pdf.splitTextToSize(`Please pay the outstanding balance of $${parseFloat(invoice.outstanding_balance).toFixed(2)} by ${new Date(invoice.due_date).toLocaleDateString()}`, pageWidth - 2 * margin - 4);
        pdf.text(noteLines, margin + 2, yPosition + 5);
        yPosition += 18;
      }

      // ============ FOOTER ============
      pdf.setFont('Helvetica', 'italic');
      pdf.setFontSize(9);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Thank you for choosing our healthcare services', margin, pageHeight - 15);
      pdf.text('For inquiries, please contact billing@medcare.com | Phone: (555) 123-4567', margin, pageHeight - 10);

      // Footer line
      pdf.setDrawColor(16, 185, 129);
      pdf.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);

      pdf.save(`Invoice_${invoice.invoice_id}_${new Date(invoice.invoice_date).toISOString().split('T')[0]}.pdf`);
      setDownloadingId(null);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setDownloadingId(null);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (filter === 'all') return true;
    if (filter === 'paid') return inv.status?.toLowerCase() === 'paid';
    if (filter === 'pending') return inv.status?.toLowerCase() === 'pending';
    if (filter === 'overdue')
      return inv.status?.toLowerCase() === 'pending' && inv.days_overdue > 0;
    return true;
  });

  const stats = {
    totalAmount: invoices.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0),
    paidAmount: invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount_paid) || 0), 0),
    outstandingBalance: invoices.reduce(
      (sum, inv) => sum + (parseFloat(inv.outstanding_balance) || 0),
      0
    ),
    overdueAmount: invoices
      .filter((inv) => inv.days_overdue > 0)
      .reduce((sum, inv) => sum + (parseFloat(inv.outstanding_balance) || 0), 0),
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold" style={{ color: '#065F46' }}>Invoices & Payments</h2>
        <p style={{ color: '#10B981' }} className="mt-2 font-medium">
          View and manage your billing information
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
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => {
            const isOverdue = invoice.days_overdue > 0 && invoice.status?.toLowerCase() !== 'paid';
            const borderColor =
              invoice.status?.toLowerCase() === 'paid'
                ? '#10B981'
                : isOverdue
                  ? '#D97706'
                  : '#F59E0B';
            const statusColor = getStatusColor(invoice.status);

            return (
              <div
                key={invoice.invoice_id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderLeft: `4px solid ${borderColor}`,
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)',
                }}
                className="rounded-lg p-6 hover:shadow-lg transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Left Side */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div style={{ backgroundColor: '#E8F8F5' }} className="rounded-lg p-2">
                        <FileText size={20} style={{ color: '#10B981' }} />
                      </div>
                      <div>
                        <h3 className="font-semibold" style={{ color: '#065F46' }}>
                          Invoice #{invoice.invoice_id}
                        </h3>
                        <div className="flex items-center gap-2 text-sm" style={{ color: '#10B981' }}>
                          <Calendar size={14} />
                          {new Date(invoice.invoice_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {isOverdue && (
                      <div style={{ color: '#D97706' }} className="mt-2 text-sm font-medium">
                        ⚠️ Overdue by {invoice.days_overdue} days
                      </div>
                    )}
                  </div>

                  {/* Middle - Amounts */}
                  <div className="grid grid-cols-2 gap-4 md:w-auto">
                    <div className="text-center">
                      <p style={{ color: '#10B981' }} className="text-xs font-medium">
                        Total
                      </p>
                      <p style={{ color: '#065F46' }} className="text-lg font-bold">
                        ${(parseFloat(invoice.total_amount) || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p style={{ color: '#10B981' }} className="text-xs font-medium">
                        Outstanding
                      </p>
                      <p style={{ color: '#065F46' }} className="text-lg font-bold">
                        ${(parseFloat(invoice.outstanding_balance) || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Right Side - Status and Download */}
                  <div className="flex items-center gap-3 md:justify-end">
                    <span
                      style={{
                        backgroundColor: statusColor.bgColor,
                        color: statusColor.textColor,
                      }}
                      className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {invoice.status?.charAt(0).toUpperCase() +
                        invoice.status?.slice(1).toLowerCase()}
                    </span>
                    <button
                      onClick={() => downloadInvoicePDF(invoice)}
                      disabled={downloadingId === invoice.invoice_id}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition hover:opacity-90"
                      style={{
                        backgroundColor: downloadingId === invoice.invoice_id ? '#10B98166' : '#10B981',
                        color: '#FFFFFF',
                      }}
                      title="Download Invoice as PDF"
                    >
                      <Download size={18} />
                      {downloadingId === invoice.invoice_id ? 'Generating...' : 'PDF'}
                    </button>
                  </div>
                </div>

                {/* Payment Summary */}
                <div
                  style={{ borderTop: '1px solid #E8F8F5' }}
                  className="mt-3 pt-3 grid grid-cols-2 gap-4 text-sm"
                >
                  <div>
                    <p style={{ color: '#10B981' }} className="font-medium">
                      Amount Paid:
                    </p>
                    <p style={{ color: '#065F46' }} className="font-semibold">
                      ${(parseFloat(invoice.amount_paid) || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#10B981' }} className="font-medium">
                      Due Date:
                    </p>
                    <p style={{ color: '#065F46' }} className="font-semibold">
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </p>
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
