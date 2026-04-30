'use client';

import { useEffect, useState } from 'react';

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [formData, setFormData] = useState({
    staff_id: null,
    email: '',
    first_name: '',
    last_name: '',
    employee_id: '',
    designation: '',
    department_id: '',
    hire_date: new Date().toISOString().split('T')[0],
    phone_number: '',
    role_id: 3,
    specialization: '',
    consultation_fee: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [staffRes, deptRes, rolesRes] = await Promise.all([
        fetch('/api/admin/staff'),
        fetch('/api/admin/departments'),
        fetch('/api/roles')
      ]);

      if (!staffRes.ok) throw new Error('Failed to fetch staff');
      
      const staffData = await staffRes.json();
      setStaff(staffData.data);

      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(deptData.data);
      }

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData.data || []);
      }
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
      // Format date to YYYY-MM-DD (MySQL DATE format)
      const submitData = { ...formData };
      if (submitData.hire_date) {
        submitData.hire_date = submitData.hire_date.includes('T') 
          ? submitData.hire_date.split('T')[0]
          : submitData.hire_date;
      }
      if (!submitData.phone_number) submitData.phone_number = null;
      submitData.role_id = parseInt(submitData.role_id) || 3;
      submitData.department_id = parseInt(submitData.department_id);
      if (submitData.staff_id === null) delete submitData.staff_id;

      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      // Check if confirmation is required (202 response)
      if (response.status === 202 && result.requiresConfirmation) {
        setConfirmationMessage(result.warning);
        setShowConfirmation(true);
        return;
      }

      if (!response.ok) throw new Error(result.error || 'Failed to save staff member');
      
      setShowForm(false);
      setEditingId(null);
      setShowConfirmation(false);
      setFormData({
        staff_id: null,
        email: '',
        first_name: '',
        last_name: '',
        employee_id: '',
        designation: '',
        department_id: '',
        hire_date: new Date().toISOString().split('T')[0],
        phone_number: '',
        role_id: 3,
        specialization: '',
        consultation_fee: ''
      });
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConfirmRoleChange = async () => {
    try {
      const submitData = { ...formData };
      if (submitData.hire_date) {
        submitData.hire_date = submitData.hire_date.includes('T') 
          ? submitData.hire_date.split('T')[0]
          : submitData.hire_date;
      }
      if (!submitData.phone_number) submitData.phone_number = null;
      submitData.role_id = parseInt(submitData.role_id) || 3;
      submitData.department_id = parseInt(submitData.department_id);
      submitData.confirmRoleChange = true;

      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save staff member');
      
      setShowForm(false);
      setEditingId(null);
      setShowConfirmation(false);
      setFormData({
        staff_id: null,
        email: '',
        first_name: '',
        last_name: '',
        employee_id: '',
        designation: '',
        department_id: '',
        hire_date: new Date().toISOString().split('T')[0],
        phone_number: '',
        role_id: 3,
        specialization: '',
        consultation_fee: ''
      });
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (member) => {
    // Ensure all nullable fields are strings, not null
    const cleanedData = {
      staff_id: member.staff_id,
      email: member.email || '',
      first_name: member.first_name || '',
      last_name: member.last_name || '',
      employee_id: member.employee_id || '',
      designation: member.designation || '',
      department_id: String(member.department_id),
      hire_date: member.hire_date ? (member.hire_date.includes('T') ? member.hire_date.split('T')[0] : member.hire_date) : new Date().toISOString().split('T')[0],
      phone_number: member.phone_number || '',
      role_id: String(member.role_id),
      specialization: member.specialization || '',
      consultation_fee: member.consultation_fee || ''
    };
    setFormData(cleanedData);
    setOriginalData(cleanedData);
    setEditingId(member.staff_id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      const response = await fetch(`/api/admin/staff/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete staff member');
      
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div style={{ padding: '2rem', color: '#065F46' }}>Loading staff members...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: '#065F46' }}>Staff Members</h1>
          <p style={{ margin: 0, color: '#6B7280' }}>Manage hospital staff</p>
        </div>
        <button 
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              staff_id: null,
              email: '',
              first_name: '',
              last_name: '',
              employee_id: '',
              designation: '',
              department_id: '',
              hire_date: new Date().toISOString().split('T')[0],
              phone_number: '',
              role_id: 3,
              specialization: '',
              consultation_fee: ''
            });
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
          + Add Staff Member
        </button>
      </div>

      {error && <div style={{ padding: '1rem', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}

      {/* Confirmation Dialog for Role/Department Changes */}
      {showConfirmation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '500px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#D32F2F' }}>⚠️ Warning</h2>
            <p style={{ margin: '0 0 1.5rem 0', color: '#333', lineHeight: '1.6' }}>
              {confirmationMessage}
            </p>
            <p style={{ margin: '0 0 1.5rem 0', color: '#666', fontSize: '0.9rem', backgroundColor: '#FFF3E0', padding: '1rem', borderRadius: '4px', borderLeft: '4px solid #FF9800' }}>
              <strong>Impact:</strong> All related appointments, encounters, and medical records will be orphaned (set to no assigned doctor). The old staff record will be permanently deleted.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirmation(false)}
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
                onClick={handleConfirmRoleChange}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#D32F2F',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Confirm & Delete Old Record
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
          <h2 style={{ marginTop: 0 }}>{editingId ? 'Edit Staff Member' : 'Add Staff Member'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>Email *</label>
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
                    boxSizing: 'border-box',
                    color: '#000',
                    backgroundColor: '#fff'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    color: '#000',
                    backgroundColor: '#fff'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    color: '#000',
                    backgroundColor: '#fff'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>Employee ID *</label>
                <input
                  type="text"
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    color: '#000',
                    backgroundColor: '#fff'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>Department *</label>
                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    color: '#000',
                    backgroundColor: '#fff'
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
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>Designation</label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    color: '#000',
                    backgroundColor: '#fff'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>Hire Date</label>
                <input
                  type="date"
                  name="hire_date"
                  value={formData.hire_date}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    color: '#000',
                    backgroundColor: '#fff'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>Phone Number</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number || ''}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    color: '#000',
                    backgroundColor: '#fff'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>Role</label>
                <select
                  name="role_id"
                  value={formData.role_id}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    color: '#000',
                    backgroundColor: '#fff'
                  }}
                >
                  <option value="2">Doctor</option>
                  <option value="3">Nurse</option>
                  <option value="4">Receptionist</option>
                  <option value="5">Pharmacist</option>
                  <option value="6">Finance</option>
                </select>
              </div>
              
              {/* Doctor specific fields */}
              {String(formData.role_id) === '2' && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>Specialization</label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. Cardiology"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                        color: '#000',
                        backgroundColor: '#fff'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>Consultation Fee</label>
                    <input
                      type="number"
                      name="consultation_fee"
                      value={formData.consultation_fee || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. 50.00"
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                        color: '#000',
                        backgroundColor: '#fff'
                      }}
                    />
                  </div>
                </>
              )}
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
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
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

      {/* Staff Table */}
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
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Email</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Employee ID</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Department</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Role</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#065F46' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(member => (
              <tr key={member.staff_id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '1rem', color: '#065F46' }}>{member.first_name} {member.last_name}</td>
                <td style={{ padding: '1rem', color: '#065F46' }}>{member.email}</td>
                <td style={{ padding: '1rem', color: '#065F46' }}>{member.employee_id}</td>
                <td style={{ padding: '1rem', color: '#065F46' }}>{member.department_name}</td>
                <td style={{ padding: '1rem', color: '#065F46' }}>{member.role}</td>
                <td style={{ padding: '1rem', color: '#065F46' }}>{member.status}</td>
                <td style={{ padding: '1rem' }}>
                  <button
                    onClick={() => handleEdit(member)}
                    style={{
                      padding: '0.5rem 1rem',
                      marginRight: '0.5rem',
                      backgroundColor: '#2196F3',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(member.staff_id)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#F44336',
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
        {staff.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
            No staff members found
          </div>
        )}
      </div>
    </div>
  );
}
