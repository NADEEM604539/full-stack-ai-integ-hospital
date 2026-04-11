'use client';

import { useEffect, useState } from 'react';

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

  const filteredInvoices = filterStatus === 'all' 
    ? invoices 
    : invoices.filter(inv => inv.status?.toLowerCase() === filterStatus.toLowerCase());

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
    switch (status.toLowerCase()) {
      case 'paid':
        return { bg: '#E8F5E9', color: '#2E7D32' };
      case 'unpaid':
        return { bg: '#FFF3E0', color: '#E65100' };
      case 'partial':
        return { bg: '#FFF9C4', color: '#F57F17' };
      case 'overdue':
        return { bg: '#FFCDD2', color: '#C62828' };
      case 'draft':
        return { bg: '#E0E0E0', color: '#424242' };
      case 'cancelled':
        return { bg: '#F5F5F5', color: '#757575' };
      default:
        return { bg: '#E0E0E0', color: '#424242' };
    }
  };

  if (loading) return <div style={{ padding: '2rem', color: '#065F46' }}>Loading invoices...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', color: '#065F46' }}>Invoices & Payments</h1>
        <p style={{ margin: 0, color: '#6B7280' }}>View and track patient invoices and payments</p>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: '4px', marginBottom: '1rem' }}>
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
          backgroundColor: '#4CAF50',
          color: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Collected</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
            ${totalRevenue.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.8 }}>
            {paidCount} invoices paid
          </div>
        </div>

        <div style={{
          backgroundColor: '#FF9800',
          color: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Unpaid/Partial</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
            ${invoices.filter(i => i.status === 'Unpaid' || i.status === 'Partial').reduce((s, i) => s + (Number(i.balance_due) || 0), 0).toFixed(2)}
          </div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.8 }}>
            {unpaidCount + partialCount} invoices pending/partial
          </div>
        </div>

        <div style={{
          backgroundColor: '#F44336',
          color: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Overdue</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
            ${invoices.filter(i => i.status === 'Overdue').reduce((s, i) => s + (Number(i.balance_due) || 0), 0).toFixed(2)}
          </div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.8 }}>
            {overdueCount} invoices overdue
          </div>
        </div>

        <div style={{
          backgroundColor: '#2196F3',
          color: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Outstanding Balance</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
            ${totalOutstanding.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.8 }}>
            {invoices.length} total invoices
          </div>
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
        alignItems: 'center'
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
            color: '#065F46'
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

      {/* Invoices Table */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflowX: 'auto'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F0FDF4', borderBottom: '2px solid rgba(16, 185, 129, 0.15)' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Invoice #</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Patient</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Invoice Date</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Due Date</th>
              <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#065F46' }}>Total</th>
              <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#065F46' }}>Paid</th>
              <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#065F46' }}>Balance</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map(invoice => {
              const statusColor = getStatusColor(invoice.status);
              return (
                <tr key={invoice.invoice_id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1rem', fontWeight: '500', color: '#065F46' }}>INV-{String(invoice.invoice_id).padStart(5, '0')}</td>
                  <td style={{ padding: '1rem', color: '#065F46' }}>
                    <div style={{ fontWeight: '500' }}>{invoice.first_name} {invoice.last_name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>MRN: {invoice.mrn}</div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#065F46' }}>
                    {new Date(invoice.invoice_date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#065F46' }}>
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '500', color: '#065F46' }}>
                    ${Number(invoice.total_amount || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: '#2E7D32', fontWeight: '500' }}>
                    ${Number(invoice.amount_paid || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '500', color: invoice.balance_due > 0 ? '#C62828' : '#2E7D32' }}>
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
        {filteredInvoices.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
            No invoices found
          </div>
        )}
      </div>
    </div>
  );
}
