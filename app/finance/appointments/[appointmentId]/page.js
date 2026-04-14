'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, AlertCircle, Plus } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const AppointmentDetailPage = () => {
  const params = useParams();
  const appointmentId = params.appointmentId;
  
  const [appointment, setAppointment] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  useEffect(() => {
    fetchAppointmentDetails();
  }, [appointmentId]);

  const convertAppointmentNumbers = (data) => {
    if (!data) return data;
    return {
      ...data,
      consultation_fee: Number(data.consultation_fee || 0),
      medicines_total: Number(data.medicines_total || 0),
      medicines: (data.medicines || []).map(m => ({
        ...m,
        price: Number(m.price || 0),
        quantity: Number(m.quantity || 1)
      }))
    };
  };

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/finance/${appointmentId}/details`);
      const data = await response.json();
      
      if (data.success) {
        const converted = convertAppointmentNumbers(data.data);
        setAppointment(converted);
        setMedicines(converted?.medicines || []);
      } else {
        setError(data.error || 'Failed to fetch appointment details');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      setGeneratingInvoice(true);
      const response = await fetch(`/api/finance/${appointmentId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1 })
      });

      const result = await response.json();
      if (result.success) {
        alert('✓ Invoice generated successfully!');
        fetchAppointmentDetails();
      } else {
        alert(`✗ ${result.error || 'Failed to generate invoice'}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 size={40} style={{ color: '#10B981' }} className="animate-spin" />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="space-y-6">
        <Link href="/finance/appointments" className="flex items-center gap-2" style={{ color: '#10B981' }}>
          <ArrowLeft size={20} />
          Back to Appointments
        </Link>
        <div
          style={{ backgroundColor: '#FEE2E2', borderLeft: '4px solid #EF4444' }}
          className="p-4 rounded"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={20} style={{ color: '#DC2626' }} />
            <p style={{ color: '#DC2626' }}>{error || 'Appointment not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const consultationFee = appointment.consultation_fee || 0;
  const medicinesTotal = medicines.reduce((sum, m) => sum + (m.total_price || 0), 0);
  const subtotal = consultationFee + medicinesTotal;
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/finance/appointments" className="flex items-center gap-2" style={{ color: '#10B981' }}>
          <ArrowLeft size={20} />
          Back to Appointments
        </Link>
        <h1 className="text-3xl font-bold" style={{ color: '#065F46' }}>
          Appointment #{appointmentId}
        </h1>
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
            <p><span className="font-medium">Name:</span> {appointment.patient_name}</p>
            <p><span className="font-medium">MRN:</span> {appointment.mrn}</p>
            <p><span className="font-medium">Email:</span> {appointment.patient_email || 'N/A'}</p>
            <p><span className="font-medium">Phone:</span> Phone Number</p>
            <p><span className="font-medium">Date of Birth:</span> DOB</p>
            <p><span className="font-medium">Gender:</span> Gender</p>
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
            <p><span className="font-medium">Date & Time:</span> {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.appointment_time}</p>
            <p><span className="font-medium">Status:</span> {appointment.status}</p>
            <p><span className="font-medium">Doctor:</span> Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}</p>
            <p><span className="font-medium">Department:</span> {appointment.department_name}</p>
            <p><span className="font-medium">Reason for Visit:</span> {appointment.reason_for_visit}</p>
          </div>
        </div>
      </div>

      {/* Medicines */}
      {medicines.length > 0 && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px'
          }}
          className="p-6 overflow-x-auto"
        >
          <h2 style={{ color: '#065F46' }} className="font-bold text-lg mb-4">Prescribed Medicines</h2>
          <table className="w-full">
            <thead style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold" style={{ color: '#065F46' }}>Medicine</th>
                <th className="px-4 py-2 text-center text-sm font-semibold" style={{ color: '#065F46' }}>Quantity</th>
                <th className="px-4 py-2 text-right text-sm font-semibold" style={{ color: '#065F46' }}>Unit Price</th>
                <th className="px-4 py-2 text-right text-sm font-semibold" style={{ color: '#065F46' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((medicine, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td className="px-4 py-4 text-sm" style={{ color: '#065F46' }}>{medicine.medicine_name}</td>
                  <td className="px-4 py-4 text-center text-sm" style={{ color: '#6B7280' }}>{medicine.quantity}</td>
                  <td className="px-4 py-4 text-right text-sm" style={{ color: '#6B7280' }}>${medicine.unit_price?.toFixed(2)}</td>
                  <td className="px-4 py-4 text-right text-sm font-semibold" style={{ color: '#065F46' }}>
                    ${medicine.total_price?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoice Summary & Creation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Invoice Breakdown */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px'
          }}
          className="p-6"
        >
          <h2 style={{ color: '#065F46' }} className="font-bold text-lg mb-4">Invoice Breakdown</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span style={{ color: '#6B7280' }}>Consultation Fee:</span>
              <span style={{ color: '#065F46' }} className="font-semibold">${consultationFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#6B7280' }}>Medicines Total:</span>
              <span style={{ color: '#065F46' }} className="font-semibold">${medicinesTotal.toFixed(2)}</span>
            </div>
            <div 
              style={{ borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}
              className="flex justify-between"
            >
              <span style={{ color: '#6B7280' }}>Subtotal:</span>
              <span style={{ color: '#065F46' }} className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#6B7280' }}>Tax (10%):</span>
              <span style={{ color: '#065F46' }} className="font-semibold">${tax.toFixed(2)}</span>
            </div>
            <div
              style={{
                backgroundColor: '#F0FFFE',
                borderRadius: '6px',
                padding: '12px',
                borderTop: '2px solid #E5E7EB',
                marginTop: '12px'
              }}
              className="flex justify-between"
            >
              <span style={{ color: '#065F46' }} className="font-bold">Total Amount:</span>
              <span style={{ color: '#10B981' }} className="text-2xl font-bold">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Create Invoice Button */}
        <div className="flex flex-col justify-between">
          {appointment.invoice_status === 'Generated' ? (
            <div
              style={{ backgroundColor: '#D1FAE5', borderLeft: '4px solid #10B981' }}
              className="rounded-lg p-6 flex items-center gap-4"
            >
              <div style={{ fontSize: '40px' }}>✓</div>
              <div>
                <p style={{ color: '#059669' }} className="font-bold text-lg">Invoice Already Created</p>
                <p style={{ color: '#047857' }} className="text-sm">This appointment already has an invoice.</p>
                <Link
                  href={`/finance/invoices/${appointment.appointment_id}`}
                  className="mt-2 inline-block px-4 py-2 rounded text-sm font-medium"
                  style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                >
                  View Invoice
                </Link>
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerateInvoice}
              disabled={generatingInvoice}
              style={{
                backgroundColor: generatingInvoice ? '#D1D5DB' : '#10B981',
                color: '#FFFFFF',
              }}
              className="h-full px-6 py-4 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generatingInvoice ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Creating Invoice...
                </>
              ) : (
                <>
                  <Plus size={20} />
                  Create Invoice Now
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailPage;
