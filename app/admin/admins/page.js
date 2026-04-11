'use client';

import { useEffect, useState } from 'react';

export default function AdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [currentAdminId, setCurrentAdminId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showToStaffModal, setShowToStaffModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    email: '',
    username: ''
  });
  const [toStaffData, setToStaffData] = useState({
    firstName: '',
    lastName: '',
    departmentId: '',
    roleId: 2
  });

  useEffect(() => {
    Promise.all([
      fetchAdmins(),
      fetchCurrentAdmin(),
      fetchDepartments()
    ]);
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/admin/admins');
      if (!response.ok) throw new Error('Failed to fetch admins');
      const data = await response.json();
      setAdmins(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentAdmin = async () => {
    try {
      const response = await fetch('/api/admin/current-user');
      if (response.ok) {
        const data = await response.json();
        setCurrentAdminId(data.user_id);
      }
    } catch (err) {
      console.error('Error fetching current admin:', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/admin/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToStaffChange = (e) => {
    const { name, value } = e.target;
    setToStaffData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ email: '', username: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (editingId) {
        // Update existing admin
        const response = await fetch(`/api/admin/admins/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!response.ok) throw new Error('Failed to update admin');
        setSuccess('Admin updated successfully');
      } else {
        // Create new admin
        const response = await fetch('/api/admin/admins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!response.ok) throw new Error('Failed to create admin');
        setSuccess('Admin created successfully');
      }
      
      resetForm();
      fetchAdmins();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (admin) => {
    setEditingId(admin.user_id);
    setFormData({
      email: admin.email,
      username: admin.username || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (adminId) => {
    if (adminId === currentAdminId) {
      setError('Cannot delete yourself');
      return;
    }

    if (!confirm('Are you sure you want to delete this admin?')) return;

    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete admin');
      setSuccess('Admin deleted successfully');
      fetchAdmins();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenToStaffModal = (admin) => {
    setSelectedAdmin(admin);
    setToStaffData({
      firstName: admin.username?.split(' ')[0] || '',
      lastName: admin.username?.split(' ')[1] || '',
      departmentId: '',
      roleId: 2
    });
    setShowToStaffModal(true);
  };

  const handleToStaffSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!toStaffData.departmentId) {
      setError('Please select a department');
      return;
    }

    try {
      const response = await fetch(`/api/admin/admins/${selectedAdmin.user_id}/to-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toStaffData)
      });
      if (!response.ok) throw new Error('Failed to convert admin to staff');
      setSuccess('Admin converted to staff successfully');
      setShowToStaffModal(false);
      fetchAdmins();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading admins...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0' }}>Manage Admins</h1>
          <p style={{ margin: 0, color: '#666' }}>Create, edit, delete, and manage admin accounts</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ email: '', username: '' });
            setShowForm(true);
          }}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          + New Admin
        </button>
      </div>

      {error && <div style={{ padding: '1rem', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}
      {success && <div style={{ padding: '1rem', backgroundColor: '#E8F5E9', color: '#2E7D32', borderRadius: '4px', marginBottom: '1rem' }}>{success}</div>}

      {/* Form Section */}
      {showForm && (
        <div style={{
          backgroundColor: '#fff',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ marginTop: 0 }}>{editingId ? 'Edit Admin' : 'Create New Admin'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#4CAF50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
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

      {/* Admins Table */}
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
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Email</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Username</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Created</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(admin => (
              <tr key={admin.user_id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '1rem', color: '#065F46' }}>{admin.email}</td>
                <td style={{ padding: '1rem', color: '#065F46' }}>{admin.username || '-'}</td>
                <td style={{ padding: '1rem', color: '#065F46' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: admin.is_active ? '#E8F5E9' : '#FFEBEE',
                    color: admin.is_active ? '#2E7D32' : '#C62828',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}>
                    {admin.is_active ? '✓ Active' : '✗ Inactive'}
                  </span>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#065F46' }}>{new Date(admin.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleEdit(admin)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#2196F3',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleOpenToStaffModal(admin)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#FF9800',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      To Staff
                    </button>
                    <button
                      onClick={() => handleDelete(admin.user_id)}
                      disabled={admin.user_id === currentAdminId}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: admin.user_id === currentAdminId ? '#ccc' : '#F44336',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: admin.user_id === currentAdminId ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem'
                      }}
                      title={admin.user_id === currentAdminId ? 'Cannot delete yourself' : 'Delete'}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {admins.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
            No admins found
          </div>
        )}
      </div>

      {/* To Staff Modal */}
      {showToStaffModal && selectedAdmin && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h2 style={{ marginTop: 0 }}>Convert to Staff</h2>
            <p style={{ color: '#6B7280' }}>
              Moving <strong>{selectedAdmin.email}</strong> from Admin to Staff role with department assignment.
            </p>
            <form onSubmit={handleToStaffSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={toStaffData.firstName}
                  onChange={handleToStaffChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={toStaffData.lastName}
                  onChange={handleToStaffChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Department *</label>
                <select
                  name="departmentId"
                  value={toStaffData.departmentId}
                  onChange={handleToStaffChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Role *</label>
                <select
                  name="roleId"
                  value={toStaffData.roleId}
                  onChange={handleToStaffChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="2">Doctor</option>
                  <option value="3">Nurse</option>
                  <option value="4">Receptionist</option>
                  <option value="5">Pharmacist</option>
                  <option value="6">Finance Officer</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#FF9800',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Convert
                </button>
                <button
                  type="button"
                  onClick={() => setShowToStaffModal(false)}
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
        </div>
      )}
    </div>
  );
}