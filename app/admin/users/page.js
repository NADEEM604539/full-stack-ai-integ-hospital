'use client';

import { useEffect, useState } from 'react';

export default function AdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [currentAdminId, setCurrentAdminId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('admins');
  const [patients, setPatients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    email: '',
    username: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get current user
      const userRes = await fetch('/api/admin/current-user');
      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentAdminId(userData.user_id);
      }

      // Get admins
      const adminsRes = await fetch('/api/admin/admins');
      if (adminsRes.ok) {
        const adminsData = await adminsRes.json();
        setAdmins(adminsData.data || []);
      }

      // Get departments
      const deptRes = await fetch('/api/admin/departments');
      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(deptData.data || []);
      }

      if (activeTab === 'patients-to-staff') {
        const patientsRes = await fetch('/api/admin/patients-as-users');
        if (patientsRes.ok) {
          const patientsData = await patientsRes.json();
          setPatients(patientsData.data || []);
        }
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
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create admin');
      }
      
      setSuccess('Admin created successfully');
      setShowForm(false);
      setFormData({ email: '', username: '' });
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAdmin = async (userId) => {
    if (userId === currentAdminId) {
      setError('❌ You cannot delete yourself from admin');
      return;
    }

    if (!confirm('Are you sure you want to remove this admin? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/admins/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete admin');
      
      setSuccess('Admin removed successfully');
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConvertPatientToStaff = async (userId, email, firstName, lastName, departmentId, roleId) => {
    if (!departmentId) {
      setError('Please select a department');
      return;
    }

    try {
      const response = await fetch('/api/admin/convert-patient-to-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          department_id: parseInt(departmentId),
          role_id: parseInt(roleId) || 3
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to convert patient');
      }

      setSuccess('Patient converted to staff successfully');
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0' }}>Admin & User Management</h1>
        <p style={{ margin: 0, color: '#666' }}>Manage system admins and convert patients to staff</p>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: '4px', marginBottom: '1rem' }}>
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: '1rem',
              padding: '0.25rem 0.75rem',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#C62828',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {success && (
        <div style={{ padding: '1rem', backgroundColor: '#E8F5E9', color: '#2E7D32', borderRadius: '4px', marginBottom: '1rem' }}>
          {success}
          <button
            onClick={() => setSuccess(null)}
            style={{
              marginLeft: '1rem',
              padding: '0.25rem 0.75rem',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#2E7D32',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #ddd' }}>
        <button
          onClick={() => { setActiveTab('admins'); setError(null); setSuccess(null); }}
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: activeTab === 'admins' ? '#4CAF50' : 'white',
            color: activeTab === 'admins' ? 'white' : '#333',
            border: 'none',
            borderBottom: activeTab === 'admins' ? '3px solid #4CAF50' : 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem'
          }}
        >
          👨‍💼 Manage Admins
        </button>
        <button
          onClick={() => { setActiveTab('patients-to-staff'); setError(null); setSuccess(null); fetchData(); }}
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: activeTab === 'patients-to-staff' ? '#2196F3' : 'white',
            color: activeTab === 'patients-to-staff' ? 'white' : '#333',
            border: 'none',
            borderBottom: activeTab === 'patients-to-staff' ? '3px solid #2196F3' : 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem'
          }}
        >
          👤 Convert Patient to Staff
        </button>
      </div>

      {/* ADMINS TAB */}
      {activeTab === 'admins' && (
        <div>
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>System Admins ({admins.length})</h2>
            <button
              onClick={() => setShowForm(!showForm)}
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
              + Add Admin
            </button>
          </div>

          {showForm && (
            <div style={{
              backgroundColor: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '2rem'
            }}>
              <h3 style={{ marginTop: 0 }}>Create New Admin</h3>
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Username (Optional)</label>
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
                    Create Admin
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

          {/* Admins Table */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflowX: 'auto'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Email</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Username</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Created</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin.user_id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '1rem' }}>{admin.email}</td>
                    <td style={{ padding: '1rem' }}>{admin.username || '-'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: admin.is_active ? '#E8F5E9' : '#FFEBEE',
                        color: admin.is_active ? '#2E7D32' : '#C62828',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold'
                      }}>
                        {admin.is_active ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                      {new Date(admin.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {admin.user_id === currentAdminId ? (
                        <span style={{ color: '#666', fontSize: '0.9rem' }}>Current User</span>
                      ) : (
                        <button
                          onClick={() => handleDeleteAdmin(admin.user_id)}
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
                      )}
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
        </div>
      )}

      {/* PATIENTS TO STAFF TAB */}
      {activeTab === 'patients-to-staff' && (
        <div>
          <h2 style={{ margin: '0 0 1.5rem 0' }}>Convert Patients to Staff</h2>
          
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
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Email</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>MRN</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Assign Department</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Role</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient, idx) => (
                  <PatientRow
                    key={idx}
                    patient={patient}
                    departments={departments}
                    onConvert={handleConvertPatientToStaff}
                  />
                ))}
              </tbody>
            </table>
            {patients.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                No patients available to convert
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PatientRow({ patient, departments, onConvert }) {
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedRole, setSelectedRole] = useState('3');

  return (
    <tr style={{ borderBottom: '1px solid #eee' }}>
      <td style={{ padding: '1rem' }}>{patient.first_name} {patient.last_name}</td>
      <td style={{ padding: '1rem' }}>{patient.email || '-'}</td>
      <td style={{ padding: '1rem' }}>{patient.mrn}</td>
      <td style={{ padding: '1rem' }}>
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}
        >
          <option value="">Select...</option>
          {departments.map(dept => (
            <option key={dept.department_id} value={dept.department_id}>
              {dept.department_name}
            </option>
          ))}
        </select>
      </td>
      <td style={{ padding: '1rem' }}>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}
        >
          <option value="2">Doctor</option>
          <option value="3">Nurse</option>
          <option value="4">Receptionist</option>
          <option value="5">Pharmacist</option>
          <option value="6">Finance</option>
        </select>
      </td>
      <td style={{ padding: '1rem' }}>
        <button
          onClick={() =>
            onConvert(
              patient.user_id,
              patient.email,
              patient.first_name,
              patient.last_name,
              selectedDept,
              selectedRole
            )
          }
          disabled={!selectedDept}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: selectedDept ? '#4CAF50' : '#ddd',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedDept ? 'pointer' : 'not-allowed',
            fontSize: '0.9rem'
          }}
        >
          Convert
        </button>
      </td>
    </tr>
  );
}
