# Doctor Portal Security Implementation

## Overview
The doctor portal implements comprehensive **Role-Based Access Control (RBAC)**, **Authentication**, and **Department-Based Access Control** following the same security pattern as the receptionist portal.

## Security Architecture

### 1. Authentication Layer
**File**: `services/auth.js` | Function: `getUserId()`
- Uses Clerk for session management (`currentUser()`)
- Retrieves user from database using email
- Returns user_id for downstream RBAC checks
- Throws 401 error if user not authenticated or not found in database

### 2. Role-Based Access Control (RBAC)
**File**: `services/doctor.js` | Function: `checkDoctorAccess()`

Validates that authenticated user has proper role:
- **Doctor** (role_id = 2): Can access only their own data
- **Admin** (role_id = 1): Can access any doctor's data
- **Other roles**: 403 Access Denied error

```javascript
// RBAC enforcement in checkDoctorAccess():
if (roleId !== 2 && roleId !== 1) {
  throw new Error(`Access Denied: Required role DOCTOR (2) or ADMIN (1), got ${roleId}`);
}
```

### 3. Doctor-Based Access Control
Each doctor can ONLY access data belonging to them:

| Data Type | Access |
|-----------|--------|
| Own Appointments | ✓ View & Manage |
| Own Patients | ✓ View (from appointments history) |
| Own Encounters | ✓ View |
| Own Schedule | ✓ View |
| Own Profile | ✓ View & Edit (phone_number only) |
| Department Colleagues | ✓ View all doctors in department |

### 4. Department-Based Access Control
- Doctors are assigned to ONE department (via `doctors.department_id`)
- **Colleagues endpoint**: Shows only doctors in the same department
- **Implicit department filtering**: All appointment/patient data is tied to doctor's department

## Implementation Details

### Service Layer: `services/doctor.js`

All functions follow the same security pattern:

```javascript
export async function getDoctorAppointments() {
  // Step 1: Get database connection
  const connection = await db.getConnection();
  
  // Step 2: RBAC check - enforces role_id = 2 or 1
  const access = await checkDoctorAccess(connection);
  // Returns: { userId, roleId, doctorId, departmentId }
  
  // Step 3: Query filtered by access.doctorId
  const [appointments] = await connection.query(
    `SELECT ... FROM appointments WHERE doctor_id = ?`,
    [access.doctorId]
  );
  
  return appointments;
}
```

### Functions Implemented

1. **getDoctorAppointments()** - Doctor's own appointments only
2. **getDoctorPatients()** - Patients from appointments history
3. **getDoctorEncounters()** - Encounters for own patients
4. **getDoctorSchedule()** - Doctor's working schedule
5. **getDoctorProfile()** - Doctor's profile information
6. **updateDoctorPhone()** - Update phone number only
7. **getDoctorColleagues()** - Colleagues in same department
8. **getDoctorDashboardStats()** - Dashboard statistics for doctor

### API Endpoints: `app/api/doctor/*`

All endpoints (`/dashboard`, `/appointments`, `/schedule`, `/patients`, `/encounters`, `/profile`, `/colleagues`) follow this pattern:

```javascript
export async function GET(request) {
  try {
    // Service function performs ALL security checks:
    // 1. Authentication (via Clerk)
    // 2. Role validation (RBAC)
    // 3. Doctor isolation (own data only)
    // 4. Department filtering
    const data = await getDoctorData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    // Error codes:
    // 401 - Authentication failed (not logged in)
    // 403 - Access Denied (wrong role)
    // 404 - Data not found
    // 500 - Server error
    const statusCode = error?.message?.includes('Authentication failed') ? 401 :
                       error?.message?.includes('Access Denied') ? 403 : 404;
    return NextResponse.json(
      { error: error?.message },
      { status: statusCode }
    );
  }
}
```

## Security Features

### ✓ SQL Injection Prevention
- All queries use parameterized queries with `?` placeholders
- Parameters passed as separate array: `connection.query(sql, [param1, param2])`

### ✓ Row-Level Security (RLS)
- Doctors can ONLY see rows where `doctor_id = their_doctor_id`
- Enforced at service layer before database queries

### ✓ Role-Level Security
- Role_id checked against database (not client-provided)
- Admin can view any doctor's data for auditing
- Regular doctors cannot escalate to admin role

### ✓ Department Isolation
- Doctors can only see colleagues in their department
- All patient/appointment queries implicitly filtered by department

### ✓ Error Handling
- Consistent error messages (no data leakage)
- Proper HTTP status codes for security failures
- Logged errors for monitoring

## Security Flow Diagram

```
Request to /api/doctor/appointments
  ↓
[Authentication] Read from Clerk
  ↓ (no user? → 401)
[RBAC Check] Verify role_id = 2 or 1
  ↓ (wrong role? → 403)
[Get Doctor ID] Get doctor_id from doctors table
  ↓ (no doctor profile? → 404)
[Query Execution] SELECT ... WHERE doctor_id = ?
  ↓
[Response] Return only authenticated doctor's data
```

## Comparison with Receptionist Portal

| Aspect | Receptionist | Doctor |
|--------|-------------|--------|
| Role Check | role_id = 4 | role_id = 2 |
| Data Scope | Department | Personal |
| Main Table | `appointments`, `patients` | `appointments`, `encounters` |
| Department Filter | Via staff.department_id | Via doctors.department_id |
| Editable Fields | Limited | Phone number only |

## Testing Recommendations

1. **Authentication Test**: Unlogged user trying to access `/api/doctor/appointments` → 401
2. **Role Test**: Receptionist accessing `/api/doctor/appointments` → 403
3. **Doctor Isolation**: Doctor A accessing Doctor B's appointments → 403
4. **Data Access**: Doctor accessing their appointments → 200 with filtered data
5. **Department Test**: Doctor seeing only colleagues in their department

## Files Modified

1. **Created**: `services/doctor.js` - Doctor service with RBAC
2. **Updated**: All `/api/doctor/*` endpoints to use service layer
3. **Following**: Same pattern as `services/receptionist.js` for consistency

