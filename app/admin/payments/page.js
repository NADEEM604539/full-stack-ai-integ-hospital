'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, DollarSign, TrendingUp, AlertCircle, User, Stethoscope, FileText } from 'lucide-react';

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/admin/payments');
      if (!response.ok) throw new Error('Failed to fetch invoices');
      
      const data = await response.json();
      setInvoices(data.data || []);
    } catch (err) {
      setError(err.message);
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

  const groupedInvoices = groupByAppointment();

  const filteredGroups = groupedInvoices.map(group => ({
    ...group,
    invoices: group.invoices.filter(inv => {
      if (filterStatus === 'all') return true;
      return inv.status?.toLowerCase() === filterStatus.toLowerCase();
    }),
  })).filter(group => group.invoices.length > 0);

  const totalRevenue = invoices.reduce((sum, inv) => {
    const amount = Number(inv.amount_paid) || 0;
    return sum + amount;
  }, 0);

  const totalOutstanding = invoices.reduce((sum, inv) => {
    const balance = Number(inv.balance_due) || 0;
    return sum + balance;
  }, 0);

  const paidCount = invoices.filter(inv => inv.status === 'Paid').length;
  const unpaidCount = invoices.filter(inv => inv.status === 'Unpaid').length;
  const partialCount = invoices.filter(inv => inv.status === 'Partial').length;
  const overdueCount = invoices.filter(inv => inv.status === 'Overdue').length;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return { bg: '#E8F5E9', color: '#2E7D32', bgLight: '#E8F8F5', colorLight: '#10B981' };
      case 'unpaid':
        return { bg: '#FFF3E0', color: '#E65100', bgLight: '#FFE4F5', colorLight: '#D97706' };
      case 'partial':
        return { bg: '#FFF9C4', color: '#F57F17', bgLight: '#FFF9C4', colorLight: '#F57F17' };
      case 'overdue':
        return { bg: '#FFCDD2', color: '#C62828', bgLight: '#FFD9E8', colorLight: '#D97706' };
      case 'draft':
        return { bg: '#E0E0E0', color: '#424242', bgLight: '#E8F8F5', colorLight: '#10B981' };
      case 'cancelled':
        return { bg: '#F5F5F5', color: '#757575', bgLight: '#E8F8F5', colorLight: '#10B981' };
      default:
        return { bg: '#E0E0E0', color: '#424242', bgLight: '#E8F8F5', colorLight: '#10B981' };
    }
  };

  if (loading) return <div style={{ padding: '2rem', color: '#065F46' }}>Loading invoices...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', color: '#065F46', fontSize: '2rem', fontWeight: 'bold' }}>Invoices & Payments</h1>
        <p style={{ margin: 0, color: '#6B7280', fontSize: '1rem' }}>View and track patient invoices and payments by appointment</p>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: '4px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: '#10B981',
          color: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Collected</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
              ${totalRevenue.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.8 }}>
              {paidCount} invoices paid
            </div>
          </div>
          <DollarSign size={40} style={{ opacity: 0.3 }} />
        </div>

        <div style={{
          backgroundColor: '#F59E0B',
          color: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Pending/Partial</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
              ${invoices.filter(i => i.status === 'Unpaid' || i.status === 'Partial').reduce((s, i) => s + (Number(i.balance_due) || 0), 0).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.8 }}>
              {unpaidCount + partialCount} invoices
            </div>
          </div>
          <TrendingUp size={40} style={{ opacity: 0.3 }} />
        </div>

        <div style={{
          backgroundColor: '#EF4444',
          color: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Overdue</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
              ${invoices.filter(i => i.status === 'Overdue').reduce((s, i) => s + (Number(i.balance_due) || 0), 0).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.8 }}>
              {overdueCount} invoices overdue
            </div>
          </div>
          <AlertCircle size={40} style={{ opacity: 0.3 }} />
        </div>

        <div style={{
          backgroundColor: '#3B82F6',
          color: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Outstanding Balance</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
              ${totalOutstanding.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.8 }}>
              {invoices.length} total invoices
            </div>
          </div>
          <FileText size={40} style={{ opacity: 0.3 }} />
        </div>
      </div>

      {/* Filter */}
      <div style={{
        backgroundColor: '#fff',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <label style={{ fontWeight: 'bold', color: '#065F46' }}>Filter by Status:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem',
            color: '#065F46',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Invoices</option>
          <option value="draft">Draft</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Grouped Invoices */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {filteredGroups.length === 0 ? (
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center',
            color: '#6B7280',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            No invoices found for the selected filter
          </div>
        ) : (
          filteredGroups.map((group, idx) => {
            const appointmentTotal = group.invoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
            const appointmentPaid = group.invoices.reduce((sum, inv) => sum + (Number(inv.amount_paid) || 0), 0);
            const appointmentBalance = appointmentTotal - appointmentPaid;

            return (
              <div
                key={group.appointment?.appointment_id || `no-appt-${idx}`}
                style={{
                  backgroundColor: '#fff',
                  borderLeft: '4px solid #10B981',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  overflow: 'hidden'
                }}
              >
                {/* Appointment Header */}
                <div style={{ backgroundColor: '#F0FDF4', borderBottom: '1px solid #D1FAE5', padding: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    <div>
                      {group.appointment?.appointment_date ? (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <Calendar size={18} style={{ color: '#10B981' }} />
                            <span style={{ fontWeight: '600', color: '#065F46', fontSize: '1rem' }}>
                              {new Date(group.appointment.appointment_date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </span>
                            <Clock size={16} style={{ color: '#10B981', marginLeft: '0.5rem' }} />
                            <span style={{ color: '#065F46', fontWeight: '500' }}>
                              {group.appointment.appointment_time}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', marginLeft: '1.5rem' }}>
                            <Stethoscope size={16} style={{ color: '#10B981' }} />
                            <span style={{ color: '#065F46', fontWeight: '500' }}>
                              Dr. {group.appointment.doctor_first_name} {group.appointment.doctor_last_name}
                            </span>
                            {group.appointment.department_name && (
                              <>
                                <span style={{ color: '#D1D5DB' }}>•</span>
                                <span style={{ color: '#10B981', fontSize: '0.95rem' }}>
                                  {group.appointment.department_name}
                                </span>
                              </>
                            )}
                          </div>
                          {group.appointment.reason_for_visit && (
                            <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: '0.5rem 0 0 1.5rem' }}>
                              Reason: {group.appointment.reason_for_visit}
                            </p>
                          )}
                        </>
                      ) : (
                        <div style={{ color: '#6B7280' }}>No appointment linked</div>
                      )}
                    </div>
                    
                    <div style={{ textAlign: 'right', paddingTop: '0.25rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '500', color: '#10B981' }}>
                        Appointment Total
                      </div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#065F46' }}>
                        ${appointmentTotal.toFixed(2)}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem', fontSize: '0.9rem' }}>
                        <div>
                          <span style={{ color: '#10B981', fontWeight: '500' }}>Paid:</span>
                          <div style={{ fontWeight: '600', color: '#065F46' }}>${appointmentPaid.toFixed(2)}</div>
                        </div>
                        <div>
                          <span style={{ color: '#10B981', fontWeight: '500' }}>Balance:</span>
                          <div style={{ fontWeight: '600', color: appointmentBalance > 0 ? '#D97706' : '#10B981' }}>
                            ${appointmentBalance.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invoices Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#065F46', fontSize: '0.9rem' }}>Invoice #</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#065F46', fontSize: '0.9rem' }}>Patient</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#065F46', fontSize: '0.9rem' }}>Date</th>
                        <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#065F46', fontSize: '0.9rem' }}>Total</th>
                        <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#065F46', fontSize: '0.9rem' }}>Paid</th>
                        <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#065F46', fontSize: '0.9rem' }}>Balance</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#065F46', fontSize: '0.9rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.invoices.map((invoice, invIdx) => {
                        const statusColor = getStatusColor(invoice.status);
                        return (
                          <tr key={invoice.invoice_id} style={{ borderBottom: '1px solid #F3F4F6', backgroundColor: invIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                            <td style={{ padding: '1rem', fontWeight: '500', color: '#065F46' }}>INV-{String(invoice.invoice_id).padStart(5, '0')}</td>
                            <td style={{ padding: '1rem', color: '#065F46' }}>
                              <div style={{ fontWeight: '500' }}>{invoice.first_name} {invoice.last_name}</div>
                              <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>MRN: {invoice.mrn}</div>
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#065F46' }}>
                              {new Date(invoice.invoice_date).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '500', color: '#065F46' }}>
                              ${Number(invoice.total_amount || 0).toFixed(2)}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '500', color: '#10B981' }}>
                              ${Number(invoice.amount_paid || 0).toFixed(2)}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '500', color: invoice.balance_due > 0 ? '#D97706' : '#10B981' }}>
                              ${Number(invoice.balance_due || 0).toFixed(2)}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{
                                padding: '0.35rem 0.75rem',
                                backgroundColor: statusColor.bg,
                                color: statusColor.color,
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                fontWeight: 'bold',
                                display: 'inline-block'
                              }}>
                                {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1) || 'Unknown'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
