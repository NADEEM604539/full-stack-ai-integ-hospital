'use client';

import { useEffect, useState } from 'react';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);
  const [deptStaffCount, setDeptStaffCount] = useState(0);
  const [formData, setFormData] = useState({
    department_name: '',
    department_head_name: '',
    contact_number: '',
    email: '',
    location: ''
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/admin/departments');
      if (!response.ok) throw new Error('Failed to fetch departments');
      
      const data = await response.json();
      setDepartments(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? `/api/admin/departments/${editingId}`
        : '/api/admin/departments';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save department');
      
      setShowForm(false);
      setEditingId(null);
      setFormData({
        department_name: '',
        department_head_name: '',
        contact_number: '',
        email: '',
        location: ''
      });
      fetchDepartments();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (dept) => {
    setFormData(dept);
    setEditingId(dept.department_id);
    setShowForm(true);
  };

  const handleDelete = async (deptId, deptName) => {
    // Fetch staff count for this department
    try {
      const response = await fetch(`/api/admin/departments/${deptId}/staff-count`);
      const data = await response.json();
      setDeptStaffCount(data.count || 0);
      setDeptToDelete({ id: deptId, name: deptName });
      setShowDeleteConfirm(true);
    } catch (err) {
      setError('Failed to fetch staff count');
    }
  };

  const confirmDelete = async () => {
    if (!deptToDelete) return;

    try {
      const response = await fetch(`/api/admin/departments/${deptToDelete.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to delete department');
      
      setShowDeleteConfirm(false);
      setDeptToDelete(null);
      setError(null);
      fetchDepartments();
      alert(data.message || 'Department deleted successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div style={{ padding: '2rem', color: '#065F46' }}>Loading departments...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: '#065F46' }}>Departments</h1>
          <p style={{ margin: 0, color: '#6B7280' }}>Manage hospital departments</p>
        </div>
        <button 
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              department_name: '',
              department_head_name: '',
              contact_number: '',
              email: '',
              location: ''
            });
          }}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#10B981',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          + New Department
        </button>
      </div>

      {error && <div style={{ padding: '1rem', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deptToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#DC2626' }}>⚠️ Delete Department</h2>
            <p style={{ margin: '0 0 1.5rem 0', color: '#1F2937', fontSize: '1rem' }}>
              You are about to delete the department: <strong>{deptToDelete.name}</strong>
            </p>
            
            <div style={{
              backgroundColor: '#FEF3C7',
              padding: '1rem',
              borderRadius: '4px',
              marginBottom: '1.5rem',
              borderLeft: '4px solid #F59E0B'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#92400E' }}>Data Changes:</p>
              <ul style={{ margin: '0', paddingLeft: '1.5rem', color: '#92400E' }}>
                <li>{deptStaffCount} staff member{deptStaffCount !== 1 ? 's' : ''} will be <strong>unassigned</strong> from this department</li>
                <li>All appointments for this department will be <strong>updated</strong></li>
                <li>Doctor availability schedules for this department will be <strong>deleted</strong></li>
                <li>This action <strong>cannot be undone</strong></li>
              </ul>
            </div>

            <p style={{ margin: '0 0 1.5rem 0', color: '#6B7280', fontSize: '0.9rem', fontStyle: 'italic' }}>
              Medical records and appointment history will be preserved in the system, but will no longer reference this department.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeptToDelete(null);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#999',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#DC2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div style={{
          backgroundColor: '#fff',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ marginTop: 0, color: '#065F46' }}>{editingId ? 'Edit Department' : 'New Department'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#10B981' }}>Department Name *</label>
                <input
                  type="text"
                  name="department_name"
                  value={formData.department_name}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    color: '#065F46'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#10B981' }}>Department Head</label>
                <input
                  type="text"
                  name="department_head_name"
                  value={formData.department_head_name}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    color: '#065F46'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#10B981' }}>Contact Number</label>
                <input
                  type="tel"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    color: '#065F46'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#10B981' }}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    color: '#065F46'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#10B981' }}>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    color: '#065F46'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10B981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#999',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Departments Table */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflowX: 'auto'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#F0FDF4', borderBottom: '2px solid rgba(16, 185, 129, 0.15)' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Name</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Head</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Contact</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Email</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Location</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map(dept => (
              <tr key={dept.department_id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '1rem', color: '#065F46' }}>{dept.department_name}</td>
                <td style={{ padding: '1rem', color: '#065F46' }}>{dept.department_head_name || '-'}</td>
                <td style={{ padding: '1rem', color: '#065F46' }}>{dept.contact_number || '-'}</td>
                <td style={{ padding: '1rem', color: '#065F46' }}>{dept.email || '-'}</td>
                <td style={{ padding: '1rem', color: '#065F46' }}>{dept.location || '-'}</td>
                <td style={{ padding: '1rem' }}>
                  <button
                    onClick={() => handleEdit(dept)}
                    style={{
                      padding: '0.5rem 1rem',
                      marginRight: '0.5rem',
                      backgroundColor: '#10B981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(dept.department_id, dept.department_name)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#DC2626',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {departments.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
            No departments found
          </div>
        )}
      </div>
    </div>
  );
}
