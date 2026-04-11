'use client';

import { useEffect, useState } from 'react';

export default function PatientsUserPage() {
  const [patients, setPatients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showToStaffModal, setShowToStaffModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [toStaffData, setToStaffData] = useState({});

  useEffect(() => {
    Promise.all([
      fetchPatients(),
      fetchDepartments()
    ]);
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/admin/patients-as-users');
      if (!response.ok) throw new Error('Failed to fetch patients');
      const data = await response.json();
      setPatients(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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

  const filteredPatients = patients.filter(p =>
    p.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setEditData({
      first_name: patient.first_name,
      last_name: patient.last_name,
      date_of_birth: patient.date_of_birth?.split('T')[0] || '',
      gender: patient.gender,
      blood_type: patient.blood_type,
      phone_number: patient.phone_number,
      email: patient.patient_email || patient.email,
      is_active: patient.is_active
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/patients/${selectedPatient.patient_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      if (!response.ok) throw new Error('Failed to update patient');
      setSuccess('Patient updated successfully');
      setShowEditModal(false);
      fetchPatients();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (patientId) => {
    if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) return;

    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/patients/${patientId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete patient');
      setSuccess('Patient deleted successfully');
      fetchPatients();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenToStaffModal = (patient) => {
    setSelectedPatient(patient);
    setToStaffData({
      firstName: patient.first_name,
      lastName: patient.last_name,
      departmentId: patient.department_id || '',
      roleId: 3
    });
    setShowToStaffModal(true);
  };

  const handleToStaffChange = (e) => {
    const { name, value } = e.target;
    setToStaffData(prev => ({ ...prev, [name]: value }));
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
      const response = await fetch(`/api/admin/patients/${selectedPatient.patient_id}/to-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedPatient.user_id,
          firstName: toStaffData.firstName,
          lastName: toStaffData.lastName,
          departmentId: parseInt(toStaffData.departmentId),
          roleId: parseInt(toStaffData.roleId)
        })
      });
      if (!response.ok) throw new Error('Failed to convert patient to staff');
      setSuccess('Patient converted to staff successfully');
      setShowToStaffModal(false);
      fetchPatients();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading patients...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0' }}>Patient Users</h1>
        <p style={{ margin: 0, color: '#666' }}>Manage patient accounts that haven't been converted to staff yet</p>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: '4px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '1rem', backgroundColor: '#E8F5E9', color: '#2E7D32', borderRadius: '4px', marginBottom: '1rem' }}>
          {success}
        </div>
      )}

      <div style={{
        backgroundColor: '#fff',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <input
          type="text"
          placeholder="Search by name, MRN, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflowX: 'auto'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Name</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>MRN</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Email</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Gender</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Blood Type</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Phone</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map(patient => (
              <tr key={patient.patient_id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: '500' }}>{patient.first_name} {patient.last_name}</div>
                </td>
                <td style={{ padding: '1rem' }}>{patient.mrn}</td>
                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                  {patient.email || patient.patient_email || '-'}
                </td>
                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                  {patient.gender || '-'}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: '#F3E5F5',
                    color: '#6A1B9A',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold'
                  }}>
                    {patient.blood_type || '-'}
                  </span>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                  {patient.phone_number || '-'}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: patient.is_active ? '#E8F5E9' : '#FFEBEE',
                    color: patient.is_active ? '#2E7D32' : '#C62828',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold'
                  }}>
                    {patient.is_active ? '✓ Active' : '✗ Inactive'}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleEdit(patient)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        backgroundColor: '#2196F3',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleOpenToStaffModal(patient)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        backgroundColor: '#FF9800',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      To Staff
                    </button>
                    <button
                      onClick={() => handleDelete(patient.patient_id)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        backgroundColor: '#F44336',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredPatients.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
            {searchTerm ? 'No patient users match your search' : 'No patient users found'}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
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
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ marginTop: 0 }}>Edit Patient</h2>
            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={editData.first_name || ''}
                  onChange={handleEditChange}
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={editData.last_name || ''}
                  onChange={handleEditChange}
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Gender</label>
                <select
                  name="gender"
                  value={editData.gender || ''}
                  onChange={handleEditChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Blood Type</label>
                <select
                  name="blood_type"
                  value={editData.blood_type || ''}
                  onChange={handleEditChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Phone</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={editData.phone_number || ''}
                  onChange={handleEditChange}
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={editData.email || ''}
                  onChange={handleEditChange}
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
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={editData.is_active}
                    onChange={handleEditChange}
                  />
                  Active
                </label>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#2196F3',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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

      {/* To Staff Modal */}
      {showToStaffModal && selectedPatient && (
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
            <p style={{ color: '#666' }}>
              Moving <strong>{selectedPatient.first_name} {selectedPatient.last_name}</strong> from Patient to Staff role.
            </p>
            <form onSubmit={handleToStaffSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={toStaffData.firstName || ''}
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
                  value={toStaffData.lastName || ''}
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
                  value={toStaffData.departmentId || ''}
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
                  value={toStaffData.roleId || ''}
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
