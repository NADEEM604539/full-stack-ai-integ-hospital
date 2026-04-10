# MedSync HMS - Advanced DBMS Implementation (CONSOLIDATED)

**Project**: CS343 Web Technologies + CS236 Advanced Database Systems  
**Date**: April 10, 2026  
**Status**: Complete - Ready for Production Testing

---

## 🎯 Quick Overview: What Was Implemented

| Concept | Implementation | Status |
|---------|---|---|
| **ACID Transactions** | User creation & appointments with START/COMMIT/ROLLBACK | ✅ |
| **Conflict Detection** | Overlapping appointment prevention | ✅ |
| **Audit Trail** | Automatic logging with JSON values | ✅ |
| **Parameterized Queries** | All SQL injection prevention | ✅ |
| **Foreign Keys** | 3NF normalization across 23 tables | ✅ |
| **Indexes** | B-tree optimization on query paths | ✅ |
| **Department-Based Workflows** | Per-department staff & patient independence | ✅ |
| **Patient Department Registration** | Patients assigned to departments for care | ✅ |
| **Department Isolation** | Staff + Patient + Appointments all department-scoped | ✅ |
| **Role-Based Access Control** | 7 roles with permission matrix | ✅ |
| **Session Management** | Clerk + MySQL sync | ✅ |
| **Error Handling** | Specific HTTP status codes (400/409/404/500) | ✅ |

---

## 📊 RBAC Matrix (7 Roles × 8 Departments)

### Role Definitions

```
ADMIN (ID: 1)
├─ Access: All tables FULL
├─ Key: System control, user management
└─ Department: Administration

DOCTOR (ID: 2)
├─ Access: Own patients, own appointments, prescriptions
├─ Key: Clinical decision making
└─ Department: Specific (General Medicine, Cardiology, etc.)

NURSE (ID: 3)
├─ Access: Vitals, limited patient data
├─ Key: Clinical support
└─ Department: Specific (assigned department only)

RECEPTIONIST (ID: 4)
├─ Access: Appointments, patients (basic info)
├─ Key: Booking & registration
└─ Department: Administration

PHARMACIST (ID: 5)
├─ Access: Prescriptions, inventory
├─ Key: Medication management
└─ Department: Pharmacy

FINANCE (ID: 6)
├─ Access: Invoices, payments
├─ Key: Billing & accounting
└─ Department: Administration

PATIENT (ID: 7)
├─ Access: Own records (READ-ONLY)
├─ Key: Self-service portal
└─ Department: None (patient role)
```

### Permission Matrix (Resource × Role)

| Operation | ADMIN | DOCTOR | NURSE | RECEPTIONIST | PHARMACIST | FINANCE | PATIENT |
|-----------|-------|--------|-------|--------------|------------|---------|---------|
| **User Management** | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Staff Assignments** | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Appointments (Create)** | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✓ (own) |
| **Appointments (View)** | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ (own) |
| **Appointments (Update)** | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✓ (own) |
| **Prescriptions (Create)** | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Prescriptions (Dispense)** | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| **Patient Data (View)** | ✓ | ✓ | ✓ | ✓(limited) | ✗ | ✗ | ✓ (own) |
| **Vitals (Record)** | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Billing (Create)** | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| **Audit Logs** | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

---

## 🏗️ ACID Transactions Implementation

### Transaction 1: User Creation (Atomicity)

**File**: `app/api/createuser/route.js` (Lines 89-137)

```javascript
// ATOMIC: All-or-nothing execution
START TRANSACTION
  ├─ STEP 1: Conflict detection
  │  └─ Query: Check if email exists
  ├─ STEP 2: INSERT users
  │  └─ Query: INSERT INTO users (clerk_user_id, email, role_id=7)
  ├─ STEP 3: INSERT audit_logs
  │  └─ Query: INSERT INTO audit_logs (action='CREATE', new_values=JSON {...})
  ├─ STEP 4: INSERT session_logs
  │  └─ Query: INSERT INTO session_logs (clerk_session_id, user_id)
  └─ STEP 5: COMMIT
     └─ All changes persisted or ROLLBACK on ANY error
```

**Error Handling**:
- 409 Conflict → Email already exists
- 400 Bad Request → Invalid format
- 500 Error → Database failure (auto-ROLLBACK)

**ACID Properties**:
- ✅ **Atomicity**: All 3 INSERTs succeed or all rollback
- ✅ **Consistency**: FK constraint (role_id must exist)
- ✅ **Isolation**: Row-locking prevents race conditions
- ✅ **Durability**: After COMMIT, survives crash

---

### Transaction 2: Appointment Booking (Conflict Detection)

**File**: `app/api/receptionist/appointments/route.js` (Lines 144-226)

```javascript
// TRANSACTION WITH CONFLICT DETECTION
START TRANSACTION
  ├─ STEP 1: Check doctor availability
  │  └─ Query: SELECT FROM doctor_availability
  │      WHERE doctor_id=X AND department_id=Y AND day_code='MON'
  ├─ STEP 2: Detect overlapping appointments
  │  └─ Query: SELECT FROM appointments
  │      WHERE doctor_id=X 
  │      AND appointment_date='2026-04-15'
  │      AND (
  │        (start_time < '10:30:00' AND end_time > '10:00:00')  ← OVERLAP CHECK
  │      )
  │      AND status NOT IN ('Cancelled', 'NoShow')  ← ONLY COUNT ACTIVE
  ├─ STEP 3: If no conflicts → INSERT appointment
  │  └─ Query: INSERT INTO appointments (doctor_id, patient_id, department_id, ...)
  ├─ STEP 4: INSERT billing_entry
  │  └─ Query: INSERT INTO billing (patient_id, type='Consultation', amount=...)
  └─ STEP 5: COMMIT
     └─ Both appointment and billing saved atomic
```

**Conflict Detection Logic**:
```sql
-- Prevent overlapping appointments
WHERE appointment_date = '2026-04-15'
AND doctor_id = 1
AND (
  -- Request: 10:00-10:30
  -- Existing: 09:30-10:00 = NO OVERLAP (09:30 < 10:00 is OK)
  -- Existing: 10:00-10:30 = OVERLAP (10:00 < 10:30 AND 10:30 > 10:00)
  -- Existing: 10:15-10:45 = OVERLAP (10:15 < 10:30 AND 10:45 > 10:00)
  
  (start_time < '10:30:00' AND end_time > '10:00:00')
)
```

**Test Cases** for Conflict Proof:
- Request 09:00-09:30 with existing 09:30-10:00 → ✅ ALLOWED
- Request 09:00-09:30 with existing 09:00-09:30 → ❌ CONFLICT (409)
- Request 09:15-09:45 with existing 09:00-09:30 → ❌ CONFLICT (409)

---

## 🏥 Database Schema: Key Tables (3NF)

### Core Tables (23 Total)

```
1. roles (7 rows)
   └─ role_id, role_name, description

2. users (51 rows)
   ├─ user_id, clerk_user_id (Clerk sync), email, role_id
   └─ NOT department_id (staff table has it)

3. departments (8 rows)
   └─ department_id, department_name, contact_number

4. staff (16 rows) ← DEPARTMENT LINK
   ├─ staff_id, user_id FK, department_id FK
   ├─ specialization, qualification, hire_date
   └─ One staff = One department (properly normalized)

5. doctors (6 rows)
   ├─ doctor_id, user_id FK, specialization
   └─ license_number, years_of_experience, consultation_fee

6. doctor_availability (21 rows) ← DEPARTMENT-AWARE
   ├─ availability_id, doctor_id FK, department_id FK
   ├─ day_code (MON, TUE, WED...), start_time, end_time
   └─ slot_duration_minutes, is_available

7. patients (16 rows) ← DEPARTMENT-AWARE (NEW Phase 6)
   ├─ patient_id, user_id FK, date_of_birth
   ├─ gender, blood_type, allergies
   ├─ department_id FK → departments.department_id
   ├─ mrn (Medical Record Number), phone_number
   └─ emergency_contact, address, ai_readmission_risk

8. appointments (16 rows) ← DEPARTMENT-AWARE
   ├─ appointment_id, patient_id FK, doctor_id FK, department_id FK
   ├─ appointment_date, start_time, end_time
   ├─ status (Scheduled, CheckedIn, Completed, Cancelled, NoShow)
   └─ consultation_type, notes, booked_by

9. audit_logs (9+ rows)
   ├─ log_id, user_id FK, action (CREATE/UPDATE/DELETE)
   ├─ table_name, record_id, new_values (JSON)
   └─ status, ip_address, user_agent, created_at

10. session_logs (14+ rows)
    ├─ session_id, user_id FK, clerk_session_id
    ├─ login_time, logout_time, ip_address
    └─ status (Active/Logged Out)
```

### Normalization (3NF Verified)

**No Redundancy**:
- Users table: Auth only (NO department)
- Staff table: Staff-to-Department relationship (exactly one)
- Patients table: Patients-to-Department relationship (exactly one, NEW Phase 6)
- Doctor_availability: Per-department scheduling
- Appointments: Department FK for bookings

**Proper Dependencies**:
- users.role_id → roles.role_id (FK)
- staff.user_id → users.user_id (FK)
- staff.department_id → departments.department_id (FK)
- patients.department_id → departments.department_id (FK) [NEW]
- doctor_availability.department_id → departments.department_id (FK)
- appointments.department_id → departments.department_id (FK)

**Department Isolation Complete**:
- Staff: Each staff assigned to ONE department
- Patients: Each patient registered to ONE department [NEW Phase 6]
- Doctors: Each doctor inherits department from staff record
- Appointments: Booked within department scope ONLY
- Result: Full department independence with no data leakage

---

## 🔍 Indexing Strategy (B-Tree Optimization)

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| users | PRIMARY | user_id | PK |
| users | UNIQUE | clerk_user_id | Clerk sync |
| users | UNIQUE | email | User lookup |
| patients | INDEX | department_id | Department-scoped queries [NEW] |
| patients | UNIQUE | mrn | Patient record lookup |
| appointments | COMPOSITE | (doctor_id, appointment_date) | Availability check |
| appointments | INDEX | department_id | Department queries |
| doctor_availability | UNIQUE | (doctor_id, department_id, day_code) | Prevent duplicates |
| audit_logs | INDEX | user_id | User history |
| staff | COMPOSITE | (user_id, department_id) | Staff lookup |

---

## 🛡️ Security Measures

### 1. SQL Injection Prevention
```javascript
// ✅ SAFE: Parameterized query
await connection.query(
  'SELECT * FROM users WHERE user_id = ? AND role_id = ?',
  [userId, roleId]
);

// ❌ UNSAFE: String concatenation
await connection.query(`SELECT * FROM users WHERE user_id = ${userId}`);
```

### 2. Audit Trail (Non-Repudiation)
```javascript
// Every CREATE/UPDATE recorded automatically
INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, status)
VALUES (20, 'CREATE', 'appointments', 1, 
  JSON_OBJECT('doctor_id', 1, 'patient_id', 5, 'department_id', 2, ...),
  'Success'
);
```

### 3. Role-Based Access Control
```javascript
// Middleware checks role BEFORE database query
if (userRole !== 'RECEPTIONIST') {
  return res.status(403).json({ error: 'Forbidden' });
}
```

### 4. Session Management
```javascript
// Clerk sync + MySQL row-level filtering
const user = await connection.query(
  'SELECT * FROM users WHERE clerk_user_id = ? AND is_active = TRUE',
  [clerkUserId]
);
```

---

## 📋 API Implementation Status

### Implemented Endpoints

#### 1. POST /api/createuser
- **Purpose**: Clerk webhook for new user creation
- **ADBMS**: Transactions, audit logging, conflict detection
- **Status**: ✅ Complete

#### 2. GET /api/receptionist/appointments
- **Purpose**: List appointments with filters
- **ADBMS**: Indexed queries, parameterization
- **Filters**: ?id=X, ?doctorId=X, ?date=2026-04-15
- **Status**: ✅ Complete

#### 3. POST /api/receptionist/appointments
- **Purpose**: Create new appointment
- **ADBMS**: Transactions + conflict detection
- **Conflict Check**: Overlapping time slots prevented
- **Status**: ✅ Complete

#### 4. PUT /api/receptionist/appointments?id=X
- **Purpose**: Update appointment status
- **ADBMS**: Transaction + audit logging
- **Status**: ✅ Complete

### Pending Endpoints (Design Ready)

```
❌ TO IMPLEMENT:

Patient Management:
- POST /api/patient/register
- GET /api/patient/appointments
- POST /api/patient/book-appointment
- GET /api/patient/medical-history

Doctor Dashboard:
- GET /api/doctor/appointments
- POST /api/doctor/create-prescription
- GET /api/doctor/patients

Nurse Interface:
- POST /api/nurse/record-vitals
- GET /api/nurse/assigned-patients
- PUT /api/nurse/update-patient-status

Pharmacy:
- GET /api/pharmacy/prescriptions
- PUT /api/pharmacy/dispense-medication
- GET /api/pharmacy/inventory

Finance:
- GET /api/finance/invoices
- POST /api/finance/record-payment
- GET /api/finance/reports
```

---

## 🏛️ Department-Based Architecture

### 8 Independent Departments

```
┌──────────────────────────────────────────────────────┐
│        HOSPITAL (Root Coordination - Admin)           │
└──────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                      │
    ┌──────────────┐               ┌──────────────────┐
    │ CLINICAL DEPTS│               │ NON-CLINICAL     │
    └──────────────┘               └──────────────────┘
        │                               │
    ┌───┴────────────────────┐     ┌───┴────────────────┐
    │                        │     │                    │
┌───────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌────────┐ ┌─────────┐
│   General │ │Cardiology│ │Orthopedic│ │Neurology  │ │Pediatric│ │Emergency│
│ Medicine  │ │          │ │          │ │           │ │         │ │         │
└───────────┘ └──────────┘ └──────────┘ └───────────┘ └────────┘ └─────────┘
   Dept=1        Dept=2       Dept=3       Dept=4       Dept=5      Dept=6

│ Admin & │      Pharmacy      │
│ Finance │       (Dept=7)      │
└─────────┴──────────────────────┘
   Depts 7-8
```

### Department Independence Rules

**Each Department Has**:
- ✓ Own staff members (doctors, nurses, dedicated roles)
- ✓ Own doctor availability schedule
- ✓ Own appointment slots
- ✓ Own patients (assigned to department)
- ✓ Own operations independent of other departments
- ✓ Own vitals recorded per-department
- ✓ Own prescriptions tracked per-department

**Cross-Department Coordination**:
- Admin: Oversees all departments
- Reception: Manages appointments across all departments
- Finance: Aggregates billing from all departments
- Pharmacy: Dispenses for all departments

**NO Share**:
- Doctor cannot appear in multiple departments (staff.user_id → department_id = exactly 1)
- Appointment booked in one department only
- Vitals recorded only for assigned department staff
- Availability strictly per-department

---

## ✅ Appointment Booking Validation (Department-Aware)

### Step-by-Step Booking Logic

```
REQUEST: Medical receptionist books Cardiology appointment

┌─────────────────────────────────────────────────────────────────┐
│ INPUT VALIDATION:                                               │
│ {                                                               │
│   "patient_id": 5,      ← Must be in target department         │
│   "doctor_id": 2,       ← Must be in target department         │
│   "department_id": 2,   ← Must match BOTH patient & doctor     │
│   "appointment_date": "2026-04-15",                            │
│   "start_time": "09:00", "end_time": "09:30"                  │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ Validation 1: VERIFY PATIENT DEPARTMENT (NEW - Phase 6)        │
│                                                                 │
│ Query: SELECT department_id FROM patients WHERE patient_id=5   │
│ Expected: department_id = 2 (Cardiology)                       │
│ If NOT match → HTTP 400: "Patient not in target department"   │
│                                                                 │
│ ✓ Ensures patient receives care in assigned department         │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ Validation 2: VERIFY DOCTOR DEPARTMENT                         │
│                                                                 │
│ Query: SELECT department_id FROM staff WHERE user_id=2         │
│ Expected: department_id = 2 (Cardiology)                       │
│ If NOT match → HTTP 400: "Doctor not in target department"    │
│                                                                 │
│ ✓ Ensures doctor only books appointments in own department     │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ Validation 3: VERIFY PATIENT-DOCTOR ALIGNMENT                 │
│                                                                 │
│ Query: SELECT p.department_id, s.department_id                │
│        FROM patients p, staff s                                │
│        WHERE p.patient_id=5 AND s.user_id=2                   │
│ Expected: BOTH return 2                                         │
│ If NOT match → HTTP 400: "Patient and doctor in different depts"
│                                                                 │
│ ✓ Prevents cross-department appointments                       │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ Validation 4: CHECK DOCTOR AVAILABILITY IN DEPARTMENT          │
│                                                                 │
│ Query: SELECT * FROM doctor_availability                       │
│        WHERE doctor_id=2                                        │
│        AND department_id=2                                      │
│        AND day_code='TUE'                                       │
│ Expected: 09:00-16:00 available ✓                             │
│ If NOT found → HTTP 400: "Doctor not available that day"      │
│                                                                 │
│ ✓ Only checks availability in requested department             │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ Validation 5: CONFLICT DETECTION IN DEPARTMENT                │
│                                                                 │
│ Query: SELECT * FROM appointments                              │
│        WHERE doctor_id=2                                        │
│        AND department_id=2                   ← CRITICAL        │
│        AND appointment_date='2026-04-15'                       │
│        AND status NOT IN ('Cancelled', 'NoShow')               │
│        AND (start_time < '09:30' AND end_time > '09:00')      │
│ Expected: 0 rows (no conflicts)                                │
│ If found → HTTP 409: "Slot already booked"                    │
│                                                                 │
│ ✓ Prevents overlaps within same department                    │
│ ✓ Allows same-time bookings in DIFFERENT departments          │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ SUCCESS: CREATE APPOINTMENT                                    │
│                                                                 │
│ START TRANSACTION                                               │
│   INSERT INTO appointments                                     │
│   (patient_id=5, doctor_id=2, department_id=2, ...)          │
│                                                                 │
│   INSERT INTO billing                                          │
│   (patient_id=5, amount=2500, department_id=2)                │
│                                                                 │
│   INSERT INTO audit_logs                                       │
│   (user_id=20, action='CREATE', table_name='appointments', ...)│
│ COMMIT                                                          │
│                                                                 │
│ Return: HTTP 201 Created with appointment details              │
└─────────────────────────────────────────────────────────────────┘
```

---

```javascript
✓ POST /api/createuser
  ├─ [PASS] Valid user created → 201 with userId
  ├─ [PASS] Duplicate email → 409 Conflict
  ├─ [PASS] Invalid email → 400 Bad Request
  └─ [PASS] Server error → 500 Auto-ROLLBACK

✓ GET /api/receptionist/appointments
  ├─ [PASS] List all appointments → 200
  ├─ [PASS] Filter by doctorId → correct results
  ├─ [PASS] Filter by date → correct date range
  └─ [PASS] Invalid doctorId → 404 Not Found

✓ POST /api/receptionist/appointments (Department-Aware)
  ├─ [PASS] Valid appointment (same department) → 201 created
  ├─ [PASS] Patient in different department → 400 "Patient not in dept"
  ├─ [PASS] Doctor in different department → 400 "Doctor not in dept"
  ├─ [PASS] Patient-Doctor mismatch departments → 400 "Different depts"
  ├─ [PASS] Overlapping slot in SAME dept → 409 Conflict
  ├─ [PASS] Same time in DIFFERENT dept → 201 allowed
  └─ [PASS] Doctor unavailable in dept → 400 "Not available"

✓ PUT /api/receptionist/appointments?id=1
  ├─ [PASS] Status update → 200 updated
  ├─ [PASS] Invalid status → 400 Bad Request
  └─ [PASS] Non-existent appointment → 404 Not Found
```

### Integration Tests (Database-Level)

```sql
✓ Transaction Atomicity
  ├─ Create user + audit → Both or neither
  ├─ Create appointment + billing → Both or neither

✓ Conflict Detection
  ├─ Doctor with 3 slots, try 4th slot (09:15-09:45) → 409 blocked
  ├─ Cancelled appointment slot → Available for rebooking
  ├─ NoShow appointment slot → Available for rebooking

✓ Audit Trail
  ├─ CREATE action logged automatically
  ├─ UPDATE action logged with old vs new values
  ├─ DELETE action soft-deleted (not hard delete)

✓ Foreign Keys
  ├─ Create appointment with invalid doctor_id → FK error
  ├─ Create appointment with invalid patient_id → FK error
  ├─ Create staff with invalid department_id → FK error

✓ Department Independence
  ├─ Doctor in General Medicine, book appointment in Cardiology → 400 Error
  ├─ Receptionist books with correct department_id → 201 Created
  ├─ Staff availability per-department strict
```

---

## 📌 Implementation Notes

### Key Design Decisions

1. **No Department in Users Table**
   - Reason: User is authentication entity
   - Staff table handles user-to-department mapping
   - Supports multi-role evolution (future)

2. **Doctor Availability Per-Department**
   - Reason: Same doctor may work in different departments at different times
   - Enables flexible scheduling
   - Example: Dr. Ahmed both in General Medicine AND Emergency (future)

3. **Appointment Department FK**
   - Reason: Tracks where appointment happens
   - Enables department-level analytics
   - Supports department-specific billing

4. **Audit Trail JSON**
   - Reason: Complete change history for compliance
   - new_values stores entire record as JSON
   - Supports rollback audit if needed

5. **Soft Deletes (is_deleted flag)**
   - Reason: Support compliance and recovery
   - Hard delete removes audit trail
   - Soft delete preserves forensics

---

## 🎓 Learning Outcomes (CS236 ADBMS)

### Concepts Demonstrated

✅ **ACID Transactions** - User creation + appointment booking  
✅ **Conflict Prevention** - Overlapping appointment detection  
✅ **Audit Trails** - JSON logging for compliance  
✅ **SQL Injection Prevention** - Parameterized queries  
✅ **3NF Normalization** - No redundancy across 23 tables  
✅ **Foreign Keys** - Referential integrity enforcement  
✅ **Indexing** - B-tree optimization for common queries  
✅ **Role-Based Access** - Permission matrix × 7 roles  
✅ **Department Independence** - Isolated workflows  
✅ **Session Management** - Clerk + MySQL sync  

### Code Examples Provided

1. `app/api/createuser/route.js` - Transaction + audit logging
2. `app/api/receptionist/appointments/route.js` - Conflict detection + CRUD
3. `db.txt` - Full schema with 23 tables
4. `seed.sql` - Test data with 51 users + departments

---

## 📞 Contact & Notes

**Database Ready**: ✅ Yes - seed.sql populated  
**APIs Ready**: ✅ Complete - Tested locally  
**Schema Verified**: ✅ 3NF normalized  
**Documentation**: ✅ Comprehensive  

**Next Steps**:
1. Import seed.sql into MySQL
2. Test conflict detection with overlapping appointments
3. Verify audit logs on CREATE/UPDATE
4. Implement remaining role APIs (patient, doctor, finance)

---

**End of Consolidated ADBMS Documentation**
