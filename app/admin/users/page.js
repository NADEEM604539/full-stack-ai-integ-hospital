'use client';

import { useEffect, useState } from 'react';
import { 
  searchUsers, 
  updateUserEmail, 
  deleteUser,
  getRoleColor,
  getRoleEmoji,
  formatDate,
  calculatePagination
} from '@/services/admin-users';

export const dynamic = 'force-dynamic';

export default function UsersManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Edit Modal
  const [editingUserId, setEditingUserId] = useState(null);
  const [editEmail, setEditEmail] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);

  // Delete Modal
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch users
  const fetchUsers = async (search = '', page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const newOffset = (page - 1) * limit;
      
      const result = await searchUsers(search, limit, newOffset);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setUsers(result.users);
      setTotalUsers(result.total);
      setTotalPages(result.pages);
      setCurrentPage(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(searchQuery, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, limit]);

  // Update email
  const handleUpdateEmail = async (userId) => {
    if (!editEmail.trim()) {
      setError('Email cannot be empty');
      return;
    }

    try {
      setUpdatingEmail(true);
      setError(null);
      
      const result = await updateUserEmail(userId, editEmail);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      setSuccess(result.message || 'Email updated successfully!');
      setEditingUserId(null);
      setEditEmail('');
      fetchUsers(searchQuery, currentPage);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingEmail(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    try {
      setDeleteLoading(true);
      setError(null);

      const result = await deleteUser(userId);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      setSuccess(result.message || 'User deleted successfully!');
      setDeletingUserId(null);
      fetchUsers(searchQuery, currentPage);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const pageNumbers = calculatePagination(currentPage, totalPages, limit);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-6">
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-in { animation: slideIn 0.3s ease-out; }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-5xl">👥</div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900">Users Management</h1>
              <p className="text-slate-600 mt-1">Manage all users in the system</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg flex items-center gap-2 slide-in">
            <span>❌</span>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-300 text-green-700 rounded-lg flex items-center gap-2 slide-in">
            <span>✅</span>
            <span>{success}</span>
          </div>
        )}

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-slate-200">
          <div className="grid md:grid-cols-3 gap-6 items-end">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">🔍 Search Users</label>
              <input
                type="text"
                placeholder="Search by email, username, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-900 placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">📊 Results per page</label>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-900 font-semibold"
              >
                <option value="5">5 per page</option>
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
              </select>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                <span className="font-bold text-blue-600">{totalUsers}</span> total users | 
                <span className="font-bold text-teal-600 ml-2">Page {currentPage}/{totalPages || 1}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-5xl mb-4">⏳</div>
            <p className="text-slate-600 text-lg">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-slate-600 text-lg">No users found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-teal-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold">#</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Username</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Last Login</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Created</th>
                    <th className="px-6 py-4 text-center text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((user, index) => (
                    <tr key={user.user_id} className="hover:bg-blue-50/50 transition">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">{((currentPage - 1) * limit) + index + 1}</td>
                      <td className="px-6 py-4">
                        {editingUserId === user.user_id ? (
                          <div className="flex gap-2">
                            <input
                              type="email"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <span className="font-medium text-slate-900">{user.email}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-700">{user.username || '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${getRoleColor(user.role_id)}`}>
                          {getRoleEmoji(user.role_id)} {user.role || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
                            ✅ Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                            ❌ Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {user.last_login ? formatDate(user.last_login) : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex gap-2 justify-center">
                          {editingUserId === user.user_id ? (
                            <>
                              <button
                                onClick={() => handleUpdateEmail(user.user_id)}
                                disabled={updatingEmail}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-50"
                              >
                                {updatingEmail ? '💾...' : '💾 Save'}
                              </button>
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="px-4 py-2 bg-slate-400 text-white rounded-lg font-semibold hover:bg-slate-500 transition"
                              >
                                ✕ Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingUserId(user.user_id);
                                  setEditEmail(user.email);
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => setDeletingUserId(user.user_id)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
                              >
                                🗑️ Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="mt-8 flex justify-center gap-2 flex-wrap">
            <button
              onClick={() => fetchUsers(searchQuery, 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-400 disabled:opacity-50 transition"
            >
              ⏮️ First
            </button>
            <button
              onClick={() => fetchUsers(searchQuery, currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-400 disabled:opacity-50 transition"
            >
              ⬅️ Previous
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
              {pageNumbers.map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => fetchUsers(searchQuery, pageNum)}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>
            <button
              onClick={() => fetchUsers(searchQuery, currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-400 disabled:opacity-50 transition"
            >
              Next ➡️
            </button>
            <button
              onClick={() => fetchUsers(searchQuery, totalPages)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-400 disabled:opacity-50 transition"
            >
              Last ⏭️
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full slide-in border border-red-300">
            <div className="text-5xl text-center mb-4">⚠️</div>
            <h3 className="text-2xl font-bold text-slate-900 text-center mb-2">Delete User?</h3>
            <p className="text-slate-600 text-center mb-6">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeletingUserId(null)}
                className="flex-1 px-6 py-3 bg-slate-300 text-slate-900 rounded-lg font-bold hover:bg-slate-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deletingUserId)}
                disabled={deleteLoading}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
