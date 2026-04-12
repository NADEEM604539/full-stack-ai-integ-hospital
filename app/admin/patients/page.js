'use client';

import { useEffect, useState } from 'react';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // User search states
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [searchingUser, setSearchingUser] = useState(false);
  const [userSearchError, setUserSearchError] = useState(null);

  // Patient table states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({});

  // To Staff modal states
  const [showToStaffWarning, setShowToStaffWarning] = useState(false);
  const [showToStaffModal, setShowToStaffModal] = useState(false);
  const [toStaffData, setToStaffData] = useState({});
  const [toStaffPatient, setToStaffPatient] = useState(null);

  useEffect(() => {
    Promise.all([
      fetchPatients(),
      fetchDepartments()
    ]);
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/admin/patients');
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

  // Search user by email
  const handleSearchUser = async (e) => {
    e.preventDefault();
    setUserSearchError(null);
    setFoundUser(null);

    if (!searchEmail.trim()) {
      setUserSearchError('Please enter an email address');
      return;
    }

    setSearchingUser(true);
    try {
      // Search in patients table by patient email (more accurate than searching users)
      const matchingPatient = patients.find(p => p.email?.toLowerCase() === searchEmail.toLowerCase());
      
      if (!matchingPatient) {
        // If not found in patients list, search users API for fallback
        const response = await fetch(`/api/admin/users?email=${encodeURIComponent(searchEmail)}`);
        if (!response.ok) throw new Error('User not found');
        const data = await response.json();

        if (!data.data || data.data.length === 0) {
          setUserSearchError('No patient user found with this email');
          return;
        }

        const user = data.data[0];
        // Verify user has patient role (role_id = 7)
        if (user.role_id !== 7) {
          setUserSearchError('This email belongs to a staff/admin user, not a patient');
          return;
        }

        setFoundUser(user);
        setSearchEmail('');
        return;
      }

      // Found patient record - verify user still has patient role
      const response = await fetch(`/api/admin/users?email=${encodeURIComponent(matchingPatient.email)}`);
      if (!response.ok) throw new Error('User not found');
      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        setUserSearchError('Associated user not found');
        return;
      }

      const user = data.data[0];
      if (user.role_id !== 7) {
        setUserSearchError('This email belongs to a staff/admin user, not a patient');
        return;
      }

      // Set both foundUser and toStaffPatient correctly
      setFoundUser(user);
      setToStaffPatient(matchingPatient);
      setSearchEmail('');
    } catch (err) {
      setUserSearchError(err.message || 'Failed to search user');
    } finally {
      setSearchingUser(false);
    }
  };

  const handleClearFoundUser = () => {
    setFoundUser(null);
    setSearchEmail('');
    setUserSearchError(null);
  };

  const filteredPatients = patients.filter(p => {
    // Filter by search term in patient table
    const matchesSearch = searchTerm === '' || 
      p.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filter by found user if one is selected
    const matchesUser = !foundUser || p.user_id === foundUser.user_id;

    return matchesSearch && matchesUser;
  });

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

  const handleOpenToStaffModal = (patient) => {
    setToStaffPatient(patient);
    setToStaffData({
      firstName: patient.first_name,
      lastName: patient.last_name,
      departmentId: patient.department_id || '',
      roleId: 3
    });
    setShowToStaffWarning(true);
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
      const response = await fetch(`/api/admin/patients/${toStaffPatient.patient_id}/to-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: toStaffPatient.user_id,
          firstName: toStaffData.firstName,
          lastName: toStaffData.lastName,
          departmentId: parseInt(toStaffData.departmentId),
          roleId: parseInt(toStaffData.roleId)
        })
      });
      if (!response.ok) throw new Error('Failed to convert patient to staff');
      setSuccess('Patient converted to staff successfully');
      setShowToStaffModal(false);
      setShowToStaffWarning(false);
      setFoundUser(null);
      setSearchEmail('');
      fetchPatients();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSeeAllPatients = () => {
    setSearchTerm('');
    // foundUser filter will apply automatically
  };

  if (loading) return <div style={{ padding: '2rem', color: '#065F46' }}>Loading patients...</div>;

  return (
    <div style={{ padding: '2rem', backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', color: '#065F46', fontSize: '2rem', fontWeight: 'bold' }}>Patients Management</h1>
        <p style={{ margin: 0, color: '#6B7280' }}>Search for users and manage all hospital patients</p>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: '4px', marginBottom: '1rem', border: '1px solid #EF5350' }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '1rem', backgroundColor: '#E8F5E9', color: '#2E7D32', borderRadius: '4px', marginBottom: '1rem', border: '1px solid #4CAF50' }}>
          ✓ {success}
        </div>
      )}

      {/* Patients Table Section */}
      <div style={{
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 1.5rem 0', color: '#065F46', fontSize: '1.2rem', fontWeight: '600' }}>
          📋 All Patients {foundUser ? `(${foundUser.email})` : ''}
        </h2>

        <div style={{
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-end'
        }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>
              Search Patients
            </label>
            <input
              type="text"
              placeholder="Search by name, MRN, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                color: '#065F46',
                backgroundColor: '#fafafa'
              }}
            />
          </div>
        </div>

        <div style={{
          overflowX: 'auto'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F0FDF4', borderBottom: '2px solid #10B981' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#065F46', fontSize: '0.95rem' }}>Name</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#065F46', fontSize: '0.95rem' }}>MRN</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#065F46', fontSize: '0.95rem' }}>DOB</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#065F46', fontSize: '0.95rem' }}>Blood Type</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#065F46', fontSize: '0.95rem' }}>Department</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#065F46', fontSize: '0.95rem' }}>Phone</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#065F46', fontSize: '0.95rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#065F46', fontSize: '0.95rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map(patient => (
                <tr key={patient.patient_id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: foundUser && patient.user_id === foundUser.user_id ? '#F0FDF4' : '#fff' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '600', color: '#065F46' }}>{patient.first_name} {patient.last_name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '0.25rem' }}>{patient.email || '-'}</div>
                  </td>
                  <td style={{ padding: '1rem', color: '#065F46', fontSize: '0.9rem' }}>{patient.mrn}</td>
                  <td style={{ padding: '1rem', color: '#065F46', fontSize: '0.9rem' }}>
                    {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : '-'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.35rem 0.75rem',
                      backgroundColor: '#F3E5F5',
                      color: '#6A1B9A',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}>
                      {patient.blood_type || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#065F46' }}>
                    {patient.department_name || '-'}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#065F46' }}>
                    {patient.phone_number || '-'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.35rem 0.75rem',
                      backgroundColor: patient.is_active ? '#E8F5E9' : '#FFEBEE',
                      color: patient.is_active ? '#2E7D32' : '#C62828',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}>
                      {patient.is_active ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowDetailModal(true);
                        }}
                        style={{
                          padding: '0.4rem 0.8rem',
                          backgroundColor: '#10B981',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '500'
                        }}
                      >
                        View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPatient(patient);
                          setEditData({
                            first_name: patient.first_name,
                            last_name: patient.last_name,
                            date_of_birth: patient.date_of_birth?.split('T')[0] || '',
                            gender: patient.gender,
                            blood_type: patient.blood_type,
                            phone_number: patient.phone_number,
                            email: patient.email,
                            address: patient.address,
                            city: patient.city,
                            emergency_contact: patient.emergency_contact,
                            emergency_phone: patient.emergency_phone,
                            department_id: patient.department_id,
                            is_active: patient.is_active
                          });
                          setShowEditModal(true);
                        }}
                        style={{
                          padding: '0.4rem 0.8rem',
                          backgroundColor: '#10B981',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '500'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleOpenToStaffModal(patient)}
                        style={{
                          padding: '0.4rem 0.8rem',
                          backgroundColor: '#F59E0B',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '500'
                        }}
                      >
                        To Staff
                      </button>
                      <button
                        onClick={() => {
                          if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) return;
                          setError(null);
                          setSuccess(null);
                          fetch(`/api/admin/patients/${patient.patient_id}`, {
                            method: 'DELETE'
                          }).then(r => {
                            if (!r.ok) throw new Error('Failed to delete patient');
                            setSuccess('Patient deleted successfully');
                            fetchPatients();
                          }).catch(err => setError(err.message));
                        }}
                        style={{
                          padding: '0.4rem 0.8rem',
                          backgroundColor: '#DC2626',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '500'
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
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
              {foundUser ? `No patients found for ${foundUser.email}` : 'No patients found'}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedPatient && (
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
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ marginTop: 0, color: '#065F46', marginBottom: '1.5rem' }}>Patient Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ fontWeight: 'bold', color: '#10B981', fontSize: '0.9rem' }}>First Name</label>
                <div style={{ color: '#065F46', marginTop: '0.25rem' }}>{selectedPatient.first_name}</div>
              </div>
              <div>
                <label style={{ fontWeight: 'bold', color: '#10B981', fontSize: '0.9rem' }}>Last Name</label>
                <div style={{ color: '#065F46', marginTop: '0.25rem' }}>{selectedPatient.last_name}</div>
              </div>
              <div>
                <label style={{ fontWeight: 'bold', color: '#10B981', fontSize: '0.9rem' }}>MRN</label>
                <div style={{ color: '#065F46', marginTop: '0.25rem' }}>{selectedPatient.mrn}</div>
              </div>
              <div>
                <label style={{ fontWeight: 'bold', color: '#10B981', fontSize: '0.9rem' }}>Date of Birth</label>
                <div style={{ color: '#065F46', marginTop: '0.25rem' }}>{selectedPatient.date_of_birth ? new Date(selectedPatient.date_of_birth).toLocaleDateString() : '-'}</div>
              </div>
              <div>
                <label style={{ fontWeight: 'bold', color: '#10B981', fontSize: '0.9rem' }}>Gender</label>
                <div style={{ color: '#065F46', marginTop: '0.25rem' }}>{selectedPatient.gender || '-'}</div>
              </div>
              <div>
                <label style={{ fontWeight: 'bold', color: '#10B981', fontSize: '0.9rem' }}>Blood Type</label>
                <div style={{ color: '#065F46', marginTop: '0.25rem' }}>{selectedPatient.blood_type || '-'}</div>
              </div>
              <div>
                <label style={{ fontWeight: 'bold', color: '#10B981', fontSize: '0.9rem' }}>Phone</label>
                <div style={{ color: '#065F46', marginTop: '0.25rem' }}>{selectedPatient.phone_number || '-'}</div>
              </div>
              <div>
                <label style={{ fontWeight: 'bold', color: '#10B981', fontSize: '0.9rem' }}>Email</label>
                <div style={{ color: '#065F46', marginTop: '0.25rem' }}>{selectedPatient.email || '-'}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontWeight: 'bold', color: '#10B981', fontSize: '0.9rem' }}>Address</label>
                <div style={{ color: '#065F46', marginTop: '0.25rem' }}>{selectedPatient.address || '-'}</div>
              </div>
              <div>
                <label style={{ fontWeight: 'bold', color: '#10B981', fontSize: '0.9rem' }}>City</label>
                <div style={{ color: '#065F46', marginTop: '0.25rem' }}>{selectedPatient.city || '-'}</div>
              </div>
              <div>
                <label style={{ fontWeight: 'bold', color: '#10B981', fontSize: '0.9rem' }}>Department</label>
                <div style={{ color: '#065F46', marginTop: '0.25rem' }}>{selectedPatient.department_name || '-'}</div>
              </div>
              <div>
                <label style={{ fontWeight: 'bold', color: '#10B981', fontSize: '0.9rem' }}>Emergency Contact</label>
                <div style={{ color: '#065F46', marginTop: '0.25rem' }}>{selectedPatient.emergency_contact || '-'}</div>
              </div>
              <div>
                <label style={{ fontWeight: 'bold', color: '#10B981', fontSize: '0.9rem' }}>Emergency Phone</label>
                <div style={{ color: '#065F46', marginTop: '0.25rem' }}>{selectedPatient.emergency_phone || '-'}</div>
              </div>
              <div>
                <label style={{ fontWeight: 'bold', color: '#10B981', fontSize: '0.9rem' }}>AI Readmission Risk</label>
                <div style={{ color: '#065F46', marginTop: '0.25rem' }}>{selectedPatient.ai_readmission_risk ? `${selectedPatient.ai_readmission_risk}%` : 'N/A'}</div>
              </div>
            </div>
            <button
              onClick={() => setShowDetailModal(false)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#10B981',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPatient && (
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
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ marginTop: 0, color: '#065F46', marginBottom: '1.5rem' }}>Edit Patient</h2>
            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>First Name</label>
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
                      boxSizing: 'border-box',
                      color: '#065F46'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>Last Name</label>
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
                      boxSizing: 'border-box',
                      color: '#065F46'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>Date of Birth</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={editData.date_of_birth || ''}
                    onChange={handleEditChange}
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>Gender</label>
                  <select
                    name="gender"
                    value={editData.gender || ''}
                    onChange={handleEditChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                      color: '#065F46'
                    }}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>Blood Type</label>
                  <select
                    name="blood_type"
                    value={editData.blood_type || ''}
                    onChange={handleEditChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                      color: '#065F46'
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
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>Phone</label>
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
                      boxSizing: 'border-box',
                      color: '#065F46'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>Email</label>
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
                      boxSizing: 'border-box',
                      color: '#065F46'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>City</label>
                  <input
                    type="text"
                    name="city"
                    value={editData.city || ''}
                    onChange={handleEditChange}
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>Department</label>
                  <select
                    name="department_id"
                    value={editData.department_id || ''}
                    onChange={handleEditChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                      color: '#065F46'
                    }}
                  >
                    <option value="">Select</option>
                    {departments.map(dept => (
                      <option key={dept.department_id} value={dept.department_id}>
                        {dept.department_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={editData.address || ''}
                    onChange={handleEditChange}
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>Emergency Contact</label>
                  <input
                    type="text"
                    name="emergency_contact"
                    value={editData.emergency_contact || ''}
                    onChange={handleEditChange}
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>Emergency Phone</label>
                  <input
                    type="tel"
                    name="emergency_phone"
                    value={editData.emergency_phone || ''}
                    onChange={handleEditChange}
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
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: '#065F46' }}>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={editData.is_active}
                      onChange={handleEditChange}
                    />
                    Active
                  </label>
                </div>
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

      {/* To Staff Warning Modal */}
      {showToStaffWarning && toStaffPatient && (
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
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '2rem' }}>⚠️</span>
              <h2 style={{ margin: 0, color: '#DC2626', fontSize: '1.3rem', fontWeight: 'bold' }}>Important Warning</h2>
            </div>
            
            <div style={{ backgroundColor: '#FEF2F2', padding: '1rem', borderRadius: '4px', borderLeft: '4px solid #DC2626', marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', color: '#1F2937', fontWeight: '500' }}>
                This patient will:
              </p>
              <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem', color: '#1F2937' }}>
                <li>🚫 Lose access to the patient portal</li>
                <li>📋 Be converted to staff member</li>
                <li>🔐 Change role from Patient to selected staff role</li>
                <li>📊 No longer appear in patient lists</li>
              </ul>
            </div>

            <p style={{ margin: '1rem 0', color: '#666', textAlign: 'center', fontStyle: 'italic' }}>
              Patient: <strong>{toStaffPatient.first_name} {toStaffPatient.last_name}</strong>
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => {
                  setShowToStaffWarning(false);
                  setShowToStaffModal(true);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#FF9800',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                Continue
              </button>
              <button
                onClick={() => setShowToStaffWarning(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6B7280',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* To Staff Conversion Modal */}
      {showToStaffModal && toStaffPatient && (
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
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ marginTop: 0, color: '#065F46', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Convert Patient to Staff</h2>
            <p style={{ color: '#6B7280', fontSize: '1rem', marginBottom: '1.5rem' }}>
              Converting: <strong style={{ color: '#065F46' }}>{toStaffPatient.first_name} {toStaffPatient.last_name}</strong>
            </p>
            <form onSubmit={handleToStaffSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46', fontSize: '0.95rem' }}>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={toStaffData.firstName || ''}
                  onChange={handleToStaffChange}
                  required
                  placeholder="Enter first name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #10B981',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    color: '#065F46',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46', fontSize: '0.95rem' }}>Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={toStaffData.lastName || ''}
                  onChange={handleToStaffChange}
                  required
                  placeholder="Enter last name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #10B981',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    color: '#065F46',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46', fontSize: '0.95rem' }}>Department *</label>
                <select
                  name="departmentId"
                  value={toStaffData.departmentId || ''}
                  onChange={handleToStaffChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #10B981',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    color: '#065F46',
                    fontSize: '1rem'
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#065F46', fontSize: '0.95rem' }}>Role *</label>
                <select
                  name="roleId"
                  value={toStaffData.roleId || ''}
                  onChange={handleToStaffChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #10B981',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    color: '#065F46',
                    fontSize: '1rem'
                  }}
                >
                  <option value="2">👨‍⚕️ Doctor</option>
                  <option value="3">👩‍⚕️ Nurse</option>
                  <option value="4">📋 Receptionist</option>
                  <option value="5">💊 Pharmacist</option>
                  <option value="6">💰 Finance Officer</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#10B981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}
                >
                  Convert to Staff
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowToStaffModal(false);
                    setShowToStaffWarning(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#6B7280',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1rem'
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
