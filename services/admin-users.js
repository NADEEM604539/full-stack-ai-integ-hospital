/**
 * Admin Users Service
 * Business logic for user management operations
 */

/**
 * Fetch users with search and pagination
 */
export const searchUsers = async (searchQuery = '', limit = 10, offset = 0) => {
  try {
    const response = await fetch(
      `/api/admin/users/search?q=${encodeURIComponent(searchQuery)}&limit=${limit}&offset=${offset}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    const data = await response.json();
    return {
      success: true,
      users: data.data.users,
      total: data.data.total,
      limit: data.data.limit,
      offset: data.data.offset,
      pages: data.data.pages
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Update user email
 */
export const updateUserEmail = async (userId, newEmail) => {
  try {
    if (!userId || !newEmail?.trim()) {
      throw new Error('User ID and email are required');
    }

    const response = await fetch(`/api/admin/users/${userId}/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update email');
    }

    return {
      success: true,
      message: data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete user
 */
export const deleteUser = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const response = await fetch(`/api/admin/users/${userId}/delete`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete user');
    }

    return {
      success: true,
      message: data.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get role color based on role_id
 */
export const getRoleColor = (roleId) => {
  const colors = {
    1: 'bg-purple-100 text-purple-800 border-purple-300',
    2: 'bg-blue-100 text-blue-800 border-blue-300',
    3: 'bg-pink-100 text-pink-800 border-pink-300',
    4: 'bg-teal-100 text-teal-800 border-teal-300',
    5: 'bg-green-100 text-green-800 border-green-300',
    6: 'bg-amber-100 text-amber-800 border-amber-300',
    7: 'bg-slate-100 text-slate-800 border-slate-300'
  };
  return colors[roleId] || 'bg-gray-100 text-gray-800 border-gray-300';
};

/**
 * Get role emoji based on role_id
 */
export const getRoleEmoji = (roleId) => {
  const emojis = {
    1: '👨‍💼',
    2: '👨‍⚕️',
    3: '👩‍⚕️',
    4: '👩‍⚕️',
    5: '💊',
    6: '💰',
    7: '👤'
  };
  return emojis[roleId] || '👤';
};

/**
 * Format date to readable string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '—';
  
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Calculate pagination info
 */
export const calculatePagination = (currentPage, totalPages, limit) => {
  const pageNumbers = [];
  
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else if (currentPage <= 3) {
    for (let i = 1; i <= 5; i++) {
      pageNumbers.push(i);
    }
  } else if (currentPage >= totalPages - 2) {
    for (let i = totalPages - 4; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    for (let i = currentPage - 2; i <= currentPage + 2; i++) {
      pageNumbers.push(i);
    }
  }
  
  return pageNumbers;
};
