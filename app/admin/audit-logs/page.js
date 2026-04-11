'use client';

import { useEffect, useState } from 'react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [filters, setFilters] = useState({
    table_name: '',
    action_type: ''
  });

  const LIMIT = 50;

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: LIMIT,
        offset: page * LIMIT
      });

      if (filters.table_name) params.set('table_name', filters.table_name);
      if (filters.action_type) params.set('action_type', filters.action_type);

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      
      const data = await response.json();
      setLogs(data.data);
      setTotalLogs(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const totalPages = Math.ceil(totalLogs / LIMIT);

  if (loading && logs.length === 0) return <div style={{ padding: '2rem' }}>Loading audit logs...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0' }}>Audit Logs</h1>
        <p style={{ margin: 0, color: '#666' }}>System activity & change tracking</p>
      </div>

      {error && <div style={{ padding: '1rem', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}

      {/* Filters */}
      <div style={{
        backgroundColor: '#fff',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Filters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Table Name</label>
            <input
              type="text"
              name="table_name"
              value={filters.table_name}
              onChange={handleFilterChange}
              placeholder="e.g., users, patients, appointments"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Action Type</label>
            <select
              name="action_type"
              value={filters.action_type}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            >
              <option value="">All Actions</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflowX: 'auto'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.9rem'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', minWidth: '150px' }}>Timestamp</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>User</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Action</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Table</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Record ID</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '1rem' }}>{formatDate(log.timestamp)}</td>
                <td style={{ padding: '1rem' }}>{log.email || `User #${log.user_id}`}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    backgroundColor: 
                      log.action_type === 'INSERT' ? '#C8E6C9' :
                      log.action_type === 'UPDATE' ? '#BBDEFB' :
                      log.action_type === 'DELETE' ? '#FFCDD2' : '#F5F5F5',
                    color:
                      log.action_type === 'INSERT' ? '#1B5E20' :
                      log.action_type === 'UPDATE' ? '#0D47A1' :
                      log.action_type === 'DELETE' ? '#B71C1C' : '#333'
                  }}>
                    {log.action_type}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>{log.table_name}</td>
                <td style={{ padding: '1rem' }}>{log.record_id || '-'}</td>
                <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{log.ip_address || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
            No audit logs found
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          marginTop: '2rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          alignItems: 'center'
        }}>
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: page === 0 ? '#ddd' : '#2196F3',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: page === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>
          
          <div style={{ padding: '0 1rem' }}>
            Page {page + 1} of {totalPages} ({totalLogs} total logs)
          </div>

          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: page >= totalPages - 1 ? '#ddd' : '#2196F3',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
