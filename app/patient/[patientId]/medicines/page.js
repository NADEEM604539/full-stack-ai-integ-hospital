'use client';

import React, { useState, useEffect } from 'react';
import {
  Loader,
  AlertCircle,
  ChevronLeft,
  Calendar,
  Pill,
  DollarSign,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

const PatientMedicinesPage = () => {
  const router = useRouter();
  const { patientId } = useParams();
  const [medicinesByAppointment, setMedicinesByAppointment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAppointment, setExpandedAppointment] = useState(null);

  useEffect(() => {
    if (patientId) {
      fetchMedicines();
    }
  }, [patientId]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/patient/${patientId}/medicines`);
      
      if (!response.ok) {
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();          errorMessage = errorData.error || errorMessage;
        } catch (parseErr) {
          console.error('[Medicines Page] Could not parse error response:', parseErr);
          const textError = await response.text();        }
        throw new Error(errorMessage);
      }

      const data = await response.json();      setMedicinesByAppointment(data.data || []);
    } catch (err) {
      console.error('[Medicines Page] Error fetching medicines:', err);
      setError(err.message || 'Failed to fetch medicines. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': { bg: '#FEF3C7', text: '#92400E', icon: '⏳' },
      'Approved': { bg: '#D1FAE5', text: '#065F46', icon: '✅' },
      'Completed': { bg: '#D1FAE5', text: '#065F46', icon: '✓' },
      'Rejected': { bg: '#FEE2E2', text: '#991B1B', icon: '❌' },
    };
    return colors[status] || colors['Pending'];
  };

  const getMedicinesByAppointmentFiltered = () => {
    // Show all appointments, including those without medicines
    return medicinesByAppointment;
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} style={{ color: '#10B981' }} className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading your medicines...</p>
        </div>
      </div>
    );
  }

  const validMedicines = getMedicinesByAppointmentFiltered();

  return (
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      {/* Header */}
      <div
        className="shadow-lg"
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
            <h1 className="text-5xl font-bold text-white mb-2">My Medicines</h1>
            <p className="text-purple-100 text-lg">View all prescribed medicines organized by appointment</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
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
                Error Loading Medicines
              </h3>
              <p style={{ color: '#065F46' }} className="text-sm mt-1">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {validMedicines.length === 0 && !error && (
          <div
            style={{
              backgroundColor: '#E8F8F5',
              border: '3px solid #10B981',
            }}
            className="rounded-2xl shadow-md p-16 text-center"
          >
            <Pill size={64} style={{ color: '#10B981' }} className="mx-auto mb-6" />
            <h3 className="text-2xl font-bold" style={{ color: '#065F46' }}>
              No Appointments Found
            </h3>
            <p style={{ color: '#10B981' }} className="mt-3 text-lg">
              You don't have any appointments yet.
            </p>
          </div>
        )}

        {/* Medicines by Appointment */}
        {validMedicines.length > 0 && (
          <div className="space-y-6">
            {validMedicines.map((appointment) => (
              <div
                key={appointment.appointment_id}
                className="rounded-2xl overflow-hidden shadow-sm"
                style={{ backgroundColor: '#FFFFFF' }}
              >
                {/* Appointment Header - Clickable */}
                <button
                  onClick={() =>
                    setExpandedAppointment(
                      expandedAppointment === appointment.appointment_id ? null : appointment.appointment_id
                    )
                  }
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex items-start gap-4 flex-1 text-left">
                    <div
                      className="p-3 rounded-lg"
                      style={{
                        backgroundColor: '#F0FDF4',
                        color: '#10B981',
                      }}
                    >
                      <Calendar size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2" style={{ color: '#1E40AF' }}>
                        {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </h3>
                      <div className="space-y-1">
                        <p className="text-sm" style={{ color: '#6B7280' }}>
                          <span style={{ color: '#1E40AF' }} className="font-semibold">
                            Doctor:
                          </span>{' '}
                          {appointment.doctor_name || 'Unassigned'}
                        </p>
                        {appointment.reason_for_visit && (
                          <p className="text-sm" style={{ color: '#6B7280' }}>
                            <span style={{ color: '#1E40AF' }} className="font-semibold">
                              Reason:
                            </span>{' '}
                            {appointment.reason_for_visit}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Collapsed Info */}
                  <div className="text-right">
                    <div
                      className="inline-block px-4 py-2 rounded-lg text-sm font-bold mb-3"
                      style={{
                        backgroundColor: '#F3F4F6',
                        color: '#6B7280',
                      }}
                    >
                      {(appointment.medicines?.orders?.length || 0)} Order{(appointment.medicines?.orders?.length || 0) !== 1 ? 's' : ''}
                    </div>
                    <div
                      className="text-2xl transition-transform"
                      style={{
                        transform: expandedAppointment === appointment.appointment_id ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      ▼
                    </div>
                  </div>
                </button>

                {/* Expanded Medicines */}
                {expandedAppointment === appointment.appointment_id && (
                  <div className="border-t" style={{ borderColor: '#E5E7EB' }}>
                    <div className="p-6 space-y-4">
                      {appointment.medicines?.orders && appointment.medicines.orders.length > 0 ? (
                        appointment.medicines.orders.map((order, orderIndex) => (
                        <div
                          key={`${appointment.appointment_id}-${order.order_id}-${orderIndex}`}
                          className="rounded-lg border-l-4 p-4"
                          style={{
                            backgroundColor: '#F9FAFB',
                            borderColor: '#8B5CF6',
                          }}
                        >
                          {/* Order Info */}
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-sm font-bold" style={{ color: '#6B7280' }}>
                                  Order #{order.order_id}
                                </p>
                                <span
                                  className="inline-block px-2 py-1 rounded text-xs font-bold"
                                  style={{
                                    backgroundColor: getStatusColor(order.status).bg,
                                    color: getStatusColor(order.status).text,
                                  }}
                                >
                                  {getStatusColor(order.status).icon} {order.status}
                                </span>
                              </div>
                              {order.created_at && (
                                <p className="text-xs" style={{ color: '#6B7280' }}>
                                  Ordered on{' '}
                                  {new Date(order.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </p>
                              )}
                            </div>
                            {order.total_amount && (
                              <p className="text-lg font-bold flex items-center gap-1" style={{ color: '#10B981' }}>
                                <DollarSign size={18} />
                                {Number(order.total_amount).toFixed(2)}
                              </p>
                            )}
                          </div>

                          {/* Medicines in Order */}
                          {order.items && order.items.length > 0 && (
                            <div className="space-y-3">
                              {order.items.map((item, itemIndex) => (
                                <div
                                  key={`${order.order_id}-item-${itemIndex}`}
                                  className="p-3 rounded-lg flex items-start justify-between"
                                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
                                >
                                  <div className="flex-1">
                                    <p className="font-semibold" style={{ color: '#1E40AF' }}>
                                      {item.medicine_name}
                                    </p>
                                    <div className="mt-2 space-y-1">
                                      <p className="text-xs" style={{ color: '#6B7280' }}>
                                        <span className="font-semibold">Quantity:</span> {item.quantity}
                                      </p>
                                      {item.unit_price && (
                                        <p className="text-xs" style={{ color: '#6B7280' }}>
                                          <span className="font-semibold">Price:</span> ${Number(item.unit_price).toFixed(2)}
                                        </p>
                                      )}
                                      {item.notes && (
                                        <p className="text-xs mt-2 p-2 rounded" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                                          <span className="font-semibold">Notes:</span> {item.notes}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <Pill size={20} style={{ color: '#8B5CF6' }} className="flex-shrink-0" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                      ) : (
                        <div className="p-8 text-center" style={{ backgroundColor: '#F0FDF4' }}>
                          <Pill size={40} style={{ color: '#10B981' }} className="mx-auto mb-3" />
                          <p style={{ color: '#6B7280' }}>No medicines prescribed for this appointment</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Summary Card */}
            <div
              className="rounded-2xl shadow-sm p-6 mt-8 border-l-4"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#8B5CF6' }}
            >
              <h3 className="font-bold mb-4" style={{ color: '#1E40AF' }}>Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm" style={{ color: '#6B7280' }}>Total Appointments</p>
                  <p className="text-3xl font-bold mt-2" style={{ color: '#8B5CF6' }}>
                    {validMedicines.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: '#6B7280' }}>Total Orders</p>
                  <p className="text-3xl font-bold mt-2" style={{ color: '#8B5CF6' }}>
                    {validMedicines.reduce((sum, apt) => sum + (apt.medicines?.orders?.length || 0), 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: '#6B7280' }}>Total Medicines</p>
                  <p className="text-3xl font-bold mt-2" style={{ color: '#8B5CF6' }}>
                    {validMedicines.reduce(
                      (sum, apt) => sum + (apt.medicines?.orders?.reduce((itemSum, order) => itemSum + (order.items ? order.items.length : 0), 0) || 0),
                      0
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientMedicinesPage;
