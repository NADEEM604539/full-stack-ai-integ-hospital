# Admin API Routes - Service Function Analysis

## Overview
Analysis of 8 admin API routes showing their database operations and required service functions to migrate from route-level `requireAdmin()` to centralized admin service.

---

## 1. STAFF MANAGEMENT

### Route: `/app/api/admin/staff/route.js`

#### **GET - List all staff**

| Aspect | Details |
|--------|---------|
| **Current Import** | `import { requireAdmin } from '@/lib/rbac'` |
| **Auth Check** | `requireAdmin(userRoleId)` |
| **Database Operations** | SELECT with JOIN (staff, departments, users, roles) |
| **Query** | Joins 4 tables to get complete staff info with department and role names |
| **Service Function Needed** | `getAllStaff()` |
| **Parameters** | None |
| **Returns** | Array of staff objects with department_name, email, role |
| **Special Requirements** | Joins multiple tables; ordered by first_name, last_name |

#### **POST - Create new staff**

| Aspect | Details |
|--------|---------|
| **Current Import** | `import { requireAdmin } from '@/lib/rbac'` |
| **Auth Check** | `requireAdmin(userRoleId)` |
| **Request Validation** | email, first_name, last_name, employee_id, department_id (required) |
| **Database Operations** | Transaction with 2 queries: INSERT user (if not exists), INSERT staff |
| **Query 1** | Check if email exists in users table |
| **Query 2** | INSERT new user (default role_id = 3 if not specified) |
| **Query 3** | INSERT staff record with hire_date defaulting to today if not provided |
| **Service Function Needed** | `createStaff(email, firstName, lastName, employeeId, departmentId, designationRole, hireDate, phoneNumber, roleId)` |
| **Parameters** | email, first_name, last_name, employee_id, department_id, designation (optional), hire_date (optional), phone_number (optional), role_id (optional) |
| **Returns** | { success: true, message, staff_id } |
| **Special Requirements** | **TRANSACTION REQUIRED** - Requires atomic creation of user + staff record. Email must be unique. Default hire_date = TODAY. Default role_id = 3 (NURSE) |

---

### Route: `/app/api/admin/staff/[id]/route.js`

#### **GET - Get specific staff**

| Aspect | Details |
|--------|---------|
| **Current Import** | `import { requireAdmin } from '@/lib/rbac'` |
| **Auth Check** | `requireAdmin(userRoleId)` |
| **Database Operations** | SELECT with JOIN (same as list but filtered by staff_id) |
| **Service Function Needed** | `getStaffById(staffId)` |
| **Parameters** | staff_id (from route params) |
| **Returns** | Single staff object with all details |
| **Error Handling** | 404 if staff_id not found |

#### **PUT - Update staff**

| Aspect | Details |
|--------|---------|
| **Current Import** | `import { requireAdmin } from '@/lib/rbac'` |
| **Auth Check** | `requireAdmin(userRoleId)` |
| **Request Validation** | first_name, last_name, designation, department_id, phone_number, status |
| **Database Operations** | UPDATE staff record |
| **Query** | Check if staff exists first, then UPDATE |
| **Service Function Needed** | `updateStaff(staffId, firstName, lastName, designation, departmentId, phoneNumber, status)` |
| **Parameters** | staff_id, first_name, last_name, designation, department_id, phone_number, status |
| **Returns** | { success: true, message } |
| **Error Handling** | 404 if staff_id not found |

#### **DELETE - Remove staff**

| Aspect | Details |
|--------|---------|
| **Current Import** | `import { requireAdmin } from '@/lib/rbac'` |
| **Auth Check** | `requireAdmin(userRoleId)` |
| **Database Operations** | DELETE from staff (user record kept) |
| **Query** | Check if staff exists, retrieve user_id, then DELETE staff |
| **Service Function Needed** | `deleteStaff(staffId)` |
| **Parameters** | staff_id |
| **Returns** | { success: true, message } |
| **Error Handling** | 404 if staff_id not found |
| **Special Requirements** | Staff record deleted but user record remains (commented code shows optional user deletion) |

---

## 2. DEPARTMENT MANAGEMENT

### Route: `/app/api/admin/departments/route.js`

#### **GET - List all departments**

| Aspect | Details |
|--------|---------|
| **Current Import** | `import { requireAdmin, canAccess } from '@/lib/rbac'` |
| **Auth Check** | `requireAdmin(userRoleId)` |
| **Database Operations** | Simple SELECT all departments |
| **Service Function Needed** | `getAllDepartments()` |
| **Parameters** | None |
| **Returns** | Array of department objects |
| **Ordering** | department_name ASC |

#### **POST - Create department**

| Aspect | Details |
|--------|---------|
| **Current Import** | `import { requireAdmin, canAccess } from '@/lib/rbac'` |
| **Auth Check** | `requireAdmin(userRoleId)` |
| **Request Validation** | department_name (required) |
| **Database Operations** | Check uniqueness, then INSERT |
| **Query 1** | SELECT to verify department_name is unique |
| **Query 2** | INSERT new department |
| **Service Function Needed** | `createDepartment(departmentName, departmentHeadName, contactNumber, email, location)` |
| **Parameters** | department_name (required), department_head_name (optional), contact_number (optional), email (optional), location (optional) |
| **Returns** | { success: true, message, department_id } |
| **Error Handling** | 409 if department_name already exists |

---

### Route: `/app/api/admin/departments/[id]/route.js`

#### **GET - Get specific department**

| Aspect | Details |
|--------|---------|
| **Current Import** | `import { requireAdmin } from '@/lib/rbac'` |
| **Auth Check** | `requireAdmin(userRoleId)` |
| **Database Operations** | SELECT single department by ID |
| **Service Function Needed** | `getDepartmentById(departmentId)` |
| **Parameters** | department_id |
| **Returns** | Single department object |
| **Error Handling** | 404 if not found |

#### **PUT - Update department**

| Aspect | Details |
|--------|---------|
| **Current Import** | `import { requireAdmin } from '@/lib/rbac'` |
| **Auth Check** | `requireAdmin(userRoleId)` |
| **Request Validation** | All fields optional but presence checked |
| **Database Operations** | UPDATE department fields |
| **Query** | Check if department exists, then UPDATE |
| **Service Function Needed** | `updateDepartment(departmentId, departmentName, departmentHeadName, contactNumber, email, location, isActive)` |
| **Parameters** | department_id, department_name, department_head_name, contact_number, email, location, is_active |
| **Returns** | { success: true, message } |
| **Error Handling** | 404 if department_id not found |

#### **DELETE - Remove department**

| Aspect | Details |
|--------|---------|
| **Current Import** | `import { requireAdmin } from '@/lib/rbac'` |
| **Auth Check** | `requireAdmin(userRoleId)` |
| **Database Operations** | Check staff count, then DELETE |
| **Query 1** | COUNT staff in department |
| **Query 2** | DELETE department (if no staff) |
| **Service Function Needed** | `deleteDepartment(departmentId)` |
| **Parameters** | department_id |
| **Returns** | { success: true, message } |
| **Error Handling** | 404 if not found; 400 if department has active staff |
| **Special Requirements** | **CONSTRAINT CHECK** - Cannot delete if staff members exist in department |

---

## 3. USER MANAGEMENT

### Route: `/app/api/admin/users/route.js`

#### **GET - List all users**

| Aspect | Details |
|--------|---------|
| **Current Import** | `import { requireAdmin, getRoleName } from '@/lib/rbac'` |
| **Auth Check** | `requireAdmin(userRoleId)` |
| **Database Operations** | SELECT with JOIN to roles table |
| **Query** | Joins users and roles; selects user_id, email, username, role_id, role, is_active, last_login, created_at |
| **Service Function Needed** | `getAllUsers()` |
| **Parameters** | None |
| **Returns** | Array of user objects with role names |
| **Ordering** | created_at DESC |

#### **POST - Create user**

| Aspect | Details |
|--------|---------|
| **Current Import** | `import { requireAdmin, getRoleName } from '@/lib/rbac'` |
| **Auth Check** | `requireAdmin(userRoleId)` |
| **Request Validation** | email (required), role_id (required) |
| **Database Operations** | Check uniqueness, then INSERT |
| **Query 1** | SELECT to verify email is unique |
| **Query 2** | INSERT new user with is_active = true |
| **Service Function Needed** | `createUser(email, username, roleId)` |
| **Parameters** | email (required), username (optional), role_id (required) |
| **Returns** | { success: true, message, user_id } |
| **Error Handling** | 409 if email already exists |

---

### Route: `/app/api/admin/users/[id]/route.js`

#### **PUT - Update user**

| Aspect | Details |
|--------|---------|
| **Current Import** | `import { requireAdmin } from '@/lib/rbac'` |
| **Auth Check** | `requireAdmin(userRoleId)` |
| **Request Validation** | role_id (optional), is_active (optional) - at least one required |
| **Database Operations** | Dynamic UPDATE query (only provided fields) |
| **Query** | Check if user exists, then UPDATE with provided fields |
| **Service Function Needed** | `updateUser(userId, roleId, isActive)` |
| **Parameters** | user_id, role_id (optional), is_active (optional) |
| **Returns** | { success: true, message } |
| **Error Handling** | 404 if user_id not found; 400 if no fields to update |
| **Special Requirements** | Dynamic UPDATE - only update fields that are provided (undefined fields skipped) |

#### **DELETE - Delete user**

| Aspect | Details |
|--------|---------|
| **Current Import** | N/A - **NOT IMPLEMENTED** |
| **Service Function Needed** | `deleteUser(userId)` |
| **Database Operations** | Verify user exists, then DELETE |
| **Parameters** | user_id |
| **Returns** | { success: true, message } |
| **Error Handling** | 404 if user_id not found |
| **Special Requirements** | **TODO** - Not currently implemented in route; needs cascade considerations |

---

## 4. ADMIN DASHBOARD

### Route: `/app/api/admin/dashboard/route.js`

#### **GET - Dashboard statistics**

| Aspect | Details |
|--------|---------|
| **Current Import** | `import { requireAdmin } from '@/lib/rbac'` |
| **Auth Check** | `requireAdmin(userRoleId)` |
| **Database Operations** | **7 parallel queries** for different statistics |
| **Query 1** | COUNT(*) total users |
| **Query 2** | COUNT(*) active staff (status = "Active") |
| **Query 3** | COUNT(*) active departments (is_active = TRUE) |
| **Query 4** | COUNT(*) active patients (is_active = TRUE AND is_deleted = FALSE) |
| **Query 5** | COUNT(*) scheduled appointments (status = "Scheduled") |
| **Query 6** | SUM & COUNT paid invoices (status = "Paid") |
| **Query 7** | GROUP BY action_type from audit_logs for today (DATE = CURDATE()) |
| **Service Function Needed** | `getDashboardStats()` |
| **Parameters** | None |
| **Returns** | { success: true, stats: { totalUsers, activeStaff, departments, activePatients, scheduledAppointments, totalRevenue, totalInvoices, todaysActivity } } |
| **Special Requirements** | **PARALLEL QUERIES** - All 7 queries use Promise.all() for performance; complex JOIN for invoices with aggregation |

---

## 5. AUDIT LOGS

### Route: `/app/api/admin/audit-logs/route.js`

#### **GET - Retrieve audit logs with filtering**

| Aspect | Details |
|--------|---------|
| **Current Import** | `import { requireAdmin } from '@/lib/rbac'` |
| **Auth Check** | `requireAdmin(userRoleId)` |
| **Request Validation** | Query params: limit (default 100), offset (default 0), table_name (optional), action_type (optional) |
| **Database Operations** | Dynamic WHERE clause with pagination |
| **Query 1** | SELECT audit logs with optional filters, JOIN users for email, LIMIT/OFFSET pagination |
| **Query 2** | COUNT total matching logs (for pagination metadata) |
| **Service Function Needed** | `getAuditLogs(limit, offset, tableName, actionType)` |
| **Parameters** | limit (default 100), offset (default 0), table_name (optional filter), action_type (optional filter) |
| **Returns** | { success: true, data: logs[], total: count, limit, offset } |
| **Special Requirements** | **DYNAMIC FILTERING** - Conditional WHERE clauses based on provided filters; separate COUNT query for total; includes user email via JOIN |

---

## Summary Table: Required Service Functions

| Function Name | Route(s) | Parameters | Key Requirements |
|--------------|---------|-----------|-----------------|
| `getAllStaff()` | GET /admin/staff | None | Multi-table JOIN (staff, departments, users, roles) |
| `getStaffById(staffId)` | GET /admin/staff/[id] | staffId | Single staff with full details |
| `createStaff()` | POST /admin/staff | email, firstName, lastName, employeeId, departmentId, (designation, hireDate, phoneNumber, roleId) | **TRANSACTION** - Create user + staff atomically; Email unique; Default hire_date = TODAY; Default role = 3 |
| `updateStaff()` | PUT /admin/staff/[id] | staffId, firstName, lastName, designation, departmentId, phoneNumber, status | Simple UPDATE |
| `deleteStaff()` | DELETE /admin/staff/[id] | staffId | Delete staff only (keep user) |
| `getAllDepartments()` | GET /admin/departments | None | Simple SELECT |
| `getDepartmentById(deptId)` | GET /admin/departments/[id] | departmentId | Single department |
| `createDepartment()` | POST /admin/departments | departmentName, (departmentHeadName, contactNumber, email, location) | Department name must be unique |
| `updateDepartment()` | PUT /admin/departments/[id] | departmentId, departmentName, (others) | Simple UPDATE |
| `deleteDepartment()` | DELETE /admin/departments/[id] | departmentId | **CONSTRAINT** - Fail if staff exist in department |
| `getAllUsers()` | GET /admin/users | None | JOIN with roles table |
| `createUser()` | POST /admin/users | email, (username), roleId | Email must be unique; is_active defaults to true |
| `updateUser()` | PUT /admin/users/[id] | userId, (roleId, isActive) | **DYNAMIC** - Only update provided fields |
| `deleteUser()` | DELETE /admin/users/[id] | userId | **TODO** - Not yet implemented in route |
| `getDashboardStats()` | GET /admin/dashboard | None | **PARALLEL QUERIES** - 7 concurrent queries; Complex invoice aggregation with JOINs |
| `getAuditLogs()` | GET /admin/audit-logs | limit, offset, (tableName, actionType) | **DYNAMIC FILTERING** - Conditional WHERE; Pagination with total count |

---

## Special Considerations & Notes

### Transactions Required
- **`createStaff()`** - Must atomically create user record + staff record. If user exists, reuse; if not, create new.

### Constraint Checks Required
- **`deleteDepartment()`** - Cannot delete if staff members are assigned to the department (COUNT check first).

### Dynamic Queries
- **`updateUser()`** - Build UPDATE query dynamically based on which fields are provided.
- **`getAuditLogs()`** - Build WHERE clause dynamically based on provided filters.

### Parallel Queries
- **`getDashboardStats()`** - Use Promise.all() for 7 concurrent queries to optimize performance.

### Data Defaults
- **`createStaff()`** - hire_date defaults to TODAY if not provided; role_id defaults to 3 (NURSE) if not provided.
- **`createUser()`** - is_active defaults to true; username is optional.

### Email Uniqueness
- **`createStaff()`** - Check email uniqueness in users table before creating.
- **`createUser()`** - Check email uniqueness in users table before creating.

### Join Requirements
- **`getAllStaff()`** - 4-table JOIN: staff → departments, users, roles.
- **`getAllUsers()`** - 2-table JOIN: users → roles.
- **`getDashboardStats()`** - Complex JOIN: invoices → patients, payments for aggregation.
- **`getAuditLogs()`** - 1-table JOIN: audit_logs LEFT JOIN users for email.

---

## Existing Functions in `/services/admin.js`

The following functions already exist and DON'T need refactoring from routes:
- `getAllAdmins()` - Manages admin-specific operations (role_id = 1)
- `createAdmin()` - Creates new admins
- `deleteAdmin()` - Deletes admins with self-deletion prevention
- `getAllPatients()` - Fetches all patients
- `getPatientsAsUsers()` - Patients not yet converted to staff
- `convertPatientToStaff()` - **TRANSACTION** - Assigns patient to staff role
- `getAllEncounters()` - Lists all encounters with related data
- `getEncounterSOAP()` - Retrieves SOAP notes
- `getAllInvoices()` - Fetches invoices with payment aggregation
- `getAdminProfile()` - Current admin's profile
- `updateAdminProfile()` - Update current admin profile
- `getCurrentAdminUserId()` - Get current admin's user ID

---

## Migration Path

1. Create all 15 required service functions in `/services/admin.js`
2. Update each route `/app/api/admin/*/route.js` to import and use service functions
3. Remove direct database operations from routes
4. Remove `requireAdmin()` call from routes (now handled in service layer)
5. Routes become thin controllers that only handle HTTP response formatting
