'use client';

import { useEffect, useState } from 'react';

export default function AdminProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ email: '', username: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/admin/profile');
      if (!response.ok) throw new Error('Failed to fetch profile');
      
      const data = await response.json();
      setProfile(data);
      setFormData({ email: data.email, username: data.username || '' });
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
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully');
      setEditMode(false);
      fetchProfile();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading profile...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0' }}>My Profile</h1>
        <p style={{ margin: 0, color: '#666' }}>Manage your admin account settings</p>
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

      <div style={{
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        maxWidth: '600px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0 }}>Profile Information</h2>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#2196F3',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Edit
            </button>
          )}
        </div>

        {editMode ? (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Email</label>
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
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
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
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
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
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  setFormData({ email: profile.email, username: profile.username || '' });
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
        ) : (
          <div>
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #eee' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                EMAIL
              </label>
              <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{profile?.email}</div>
            </div>

            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #eee' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                USERNAME
              </label>
              <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{profile?.username || '-'}</div>
            </div>

            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #eee' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                STATUS
              </label>
              <div>
                <span style={{
                  padding: '0.35rem 0.75rem',
                  backgroundColor: profile?.is_active ? '#E8F5E9' : '#FFEBEE',
                  color: profile?.is_active ? '#2E7D32' : '#C62828',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  display: 'inline-block'
                }}>
                  {profile?.is_active ? '✓ Active' : '✗ Inactive'}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #eee' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                CREATED
              </label>
              <div style={{ fontSize: '0.9rem', color: '#555' }}>
                {profile?.created_at ? new Date(profile.created_at).toLocaleString() : '-'}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                LAST UPDATED
              </label>
              <div style={{ fontSize: '0.9rem', color: '#555' }}>
                {profile?.updated_at ? new Date(profile.updated_at).toLocaleString() : 'Never'}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        marginTop: '2rem'
      }}>
        <h3 style={{ marginTop: 0 }}>Account Actions</h3>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Additional security features and account management options are available through your authentication provider.
        </p>
        <button
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#F44336',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Manage Account Security
        </button>
      </div>
    </div>
  );
}
