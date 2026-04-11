import { getUserRoleId } from '@/services/auth';
import db from '@/lib/db';

/**
 * RBAC - Role definitions and permission checks
 */
const ROLES = {
  1: 'ADMIN',
  2: 'DOCTOR',
  3: 'NURSE',
  4: 'RECEPTIONIST',
  5: 'PHARMACIST',
  6: 'FINANCE',
  7: 'PATIENT'
};

const ROLE_IDS = {
  ADMIN: 1,
  DOCTOR: 2,
  NURSE: 3,
  RECEPTIONIST: 4,
  PHARMACIST: 5,
  FINANCE: 6,
  PATIENT: 7
};

/**
 * Check if user has specific role
 * @param {number} userRoleId - User's role ID
 * @param {string} requiredRole - Required role (e.g., 'ADMIN')
 * @returns {boolean}
 */
export function hasRole(userRoleId, requiredRole) {
  return ROLE_IDS[requiredRole] === userRoleId;
}

/**
 * Check if user has one of multiple roles
 * @param {number} userRoleId - User's role ID
 * @param {string[]} requiredRoles - Array of required roles
 * @returns {boolean}
 */
export function hasAnyRole(userRoleId, requiredRoles) {
  return requiredRoles.some(role => ROLE_IDS[role] === userRoleId);
}

/**
 * Check if user is ADMIN - throws error if not
 * @param {number} userRoleId - User's role ID
 * @throws {Error} If user is not ADMIN
 */
export function requireAdmin(userRoleId) {
  if (!hasRole(userRoleId, 'ADMIN')) {
    throw new Error('UNAUTHORIZED: Admin access required');
  }
}

/**
 * Check if user has required permission
 * @param {number} userRoleId - User's role ID
 * @param {string} module - Module name (e.g., 'departments', 'staff')
 * @param {string} action - Action (e.g., 'read', 'create', 'update', 'delete')
 * @returns {boolean}
 */
export function canAccess(userRoleId, module, action = 'read') {
  const adminPermissions = {
    // ADMIN can do everything
    departments: ['read', 'create', 'update', 'delete'],
    staff: ['read', 'create', 'update', 'delete'],
    users: ['read', 'create', 'update', 'delete'],
    roles: ['read'],
    audit_logs: ['read'],
    settings: ['read', 'update'],
    dashboard: ['read']
  };

  const doctorPermissions = {
    patients: ['read'],
    encounters: ['read', 'create', 'update'],
    soap_notes: ['read', 'create', 'update'],
    prescriptions: ['read', 'create'],
    dashboard: ['read']
  };

  const receptionistPermissions = {
    patients: ['read', 'create', 'update'],
    appointments: ['read', 'create', 'update'],
    dashboard: ['read']
  };

  const pharmacistPermissions = {
    prescriptions: ['read'],
    inventory: ['read', 'update'],
    dashboard: ['read']
  };

  const financePermissions = {
    invoices: ['read', 'create'],
    payments: ['read', 'create', 'update'],
    dashboard: ['read']
  };

  const patientPermissions = {
    own_records: ['read'],
    dashboard: ['read']
  };

  const permissions = {
    [ROLE_IDS.ADMIN]: adminPermissions,
    [ROLE_IDS.DOCTOR]: doctorPermissions,
    [ROLE_IDS.RECEPTIONIST]: receptionistPermissions,
    [ROLE_IDS.PHARMACIST]: pharmacistPermissions,
    [ROLE_IDS.FINANCE]: financePermissions,
    [ROLE_IDS.PATIENT]: patientPermissions
  };

  const userPermissions = permissions[userRoleId] || {};
  const modulePermissions = userPermissions[module] || [];

  return modulePermissions.includes(action);
}

/**
 * Get user role name
 * @param {number} roleId - Role ID
 * @returns {string} Role name
 */
export function getRoleName(roleId) {
  return ROLES[roleId] || 'UNKNOWN';
}

/**
 * Get role ID from role name
 * @param {string} roleName - Role name
 * @returns {number} Role ID
 */
export function getRoleId(roleName) {
  return ROLE_IDS[roleName] || null;
}

export { ROLES, ROLE_IDS };
