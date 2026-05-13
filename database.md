# MedSync HMS - Database Statistics & Architecture

## 📊 Database Overview

**Database Name:** `medsyncdb`  
**Engine:** MySQL 8.0+  
**Character Set:** UTF8MB4  
**Type:** Relational (3NF Normalized)  

---

## 📈 Database Components Summary

| Component | Count | Status |
|-----------|-------|--------|
| **Tables** | 25 | ✅ |
| **Views** | 9 | ✅ |
| **Procedures** | 5 | ✅ |
| **Functions** | 5 | ✅ |
| **Triggers** | 9 | ✅ |
| **Total Objects** | 53 | ✅ |

---

## 📋 Tables (25 Total)

### Authorization & User Management (3 Tables)
1. **roles** - Role definitions (ADMIN, DOCTOR, NURSE, etc.)
2. **users** - Authentication & authorization (with Clerk integration)
3. **audit_logs** - Audit trail for compliance & forensics

### Organizational Structure (2 Tables)
4. **departments** - Hospital departments
5. **staff** - Staff members (UNIQUE user_id, belongs to one department)

### Patient Management (3 Tables)
6. **patients** - Patient demographics & medical info (1 user → N patients)
7. **medical_history** - Allergies, chronic conditions, surgeries
8. **vital_signs** - Patient vital measurements per encounter

### Appointments & Encounters (6 Tables)
9. **doctors** - Doctor specialization & fees (linked to staff)
10. **doctor_availability** - Doctor schedule per department & day
11. **appointments** - Patient-doctor appointments (with satisfaction rating)
12. **encounters** - Clinical visits (Outpatient, Inpatient, Emergency)
13. **vitals** - Vital measurements (1:1 with encounters, AI risk scoring)

### SOAP Notes (4 Tables - Normalized Model)
14. **subjective_notes** - Patient symptoms & complaints (1:1 per encounter)
15. **objective_notes** - Physical exam & lab findings (1:1 per encounter)
16. **assessment_notes** - Diagnosis & ICD-10 codes (1:1 per encounter)
17. **plan_notes** - Treatment & medication plan (1:1 per encounter)

### Pharmacy & Inventory (4 Tables)
18. **inventory_items** - Medications & medical supplies
19. **prescriptions** - Prescription header (AI interaction alerts)
20. **prescription_details** - Individual drugs in prescription
21. **inventory_transactions** - Stock in/out tracking

### Medicine Ordering (2 Tables - Nurse → Pharmacist)
22. **order_medicine** - Medicine order requests from nurse
23. **order_medicine_items** - Individual medicines in an order

### Billing & Payments (3 Tables)
24. **invoices** - Invoice header (with AI billing optimization)
25. **invoice_line_items** - Consultation, medication, lab line items
26. **payments** - Payment transactions (Cash, Card, Bank, Insurance)

---

## 👁️ Views (9 Total)

### Core Views (2)
1. **view_vitals** - Patient vitals with encounter & doctor details
   - Joins: vitals → encounters → patients → doctors → staff → departments
   - Use: Nurse vitals dashboard

2. **view_patient_profile** - Patient demographics with age calculation
   - Joins: patients → departments
   - Use: Patient profile display

### Admin Views (7)
3. **view_admin_profile** - Current admin with role info
   - Joins: users → roles
   - Use: Admin profile endpoint

4. **view_admin_list** - All admins (role_id = 1)
   - Joins: users → roles
   - Use: Admin management list

5. **view_patients_complete** - All patients with department & user info
   - Joins: patients → departments → users
   - Filters: role_id = 7 or user_id IS NULL
   - Use: Admin patient management

6. **view_patients_as_users** - Patients still in patient role
   - Joins: patients → users → departments
   - Filters: role_id = 7
   - Use: Patient-to-staff conversion

7. **view_encounters_complete** - All encounters with patient & doctor details
   - Joins: encounters → patients → doctors → staff → users → appointments
   - Use: Admin encounters dashboard

8. **view_invoices_complete** - Invoices with payment summary
   - Joins: invoices → patients → payments → appointments → doctors → departments
   - Calculates: amount_paid, balance_due, status
   - Use: Billing dashboard

9. **view_staff_complete** - All staff with department, user, and doctor info
   - Joins: staff → departments → users → roles → doctors
   - Use: Admin staff management

---

## ⚙️ Stored Procedures (5 Total)

### Appointment Management (1)
1. **sp_book_appointment**
   - Parameters: patient_id, doctor_id, date, time, reason, created_by
   - Returns: appointment_id, message
   - Features: Validates doctor availability, handles conflicts
   - Used by: Receptionist/Patient appointment booking

### Billing (1)
2. **sp_generate_invoice**
   - Parameters: encounter_id, patient_id, created_by
   - Returns: invoice_id, message
   - Features: Calculates subtotal (10% tax), creates line items
   - Used by: Auto-invoice generation

### Admission (1)
3. **sp_admit_patient**
   - Parameters: patient_id, doctor_id, encounter_type, chief_complaint, created_by
   - Returns: encounter_id, message
   - Features: Creates new encounter with status tracking
   - Used by: Emergency & inpatient admission

### Admin Profile (2)
4. **sp_get_admin_profile**
   - Parameters: user_id
   - Returns: Admin profile from view_admin_profile
   - Used by: Admin profile endpoint

5. **sp_update_admin_profile**
   - Parameters: user_id, email, username
   - Features: Validates email uniqueness, updates user record
   - Used by: Admin profile update

---

## 🔧 Functions (5 Total)

### Patient Functions (2)
1. **fn_calculate_age(dob DATE) → INT**
   - Calculates patient age from date of birth
   - Used in: view_patient_profile

2. **fn_patient_balance(patient_id INT) → DECIMAL**
   - Returns outstanding invoice balance for patient
   - Query: SUM(total_amount - amount_paid) from unpaid invoices

### Inventory Functions (1)
3. **fn_is_stock_available(item_id INT, qty INT) → BOOLEAN**
   - Checks if medication stock is available
   - Used in: Prescription dispensing validation

### Doctor Functions (2)
4. **fn_is_doctor_available(doctor_id INT, date DATE, time TIME) → BOOLEAN**
   - Checks doctor availability (shift + conflicts)
   - Default window: 30 minutes
   - Used in: Appointment booking validation

5. **fn_doctor_appointment_count(doctor_id INT, date DATE) → INT**
   - Counts scheduled appointments for doctor on date
   - Used in: Appointment limit enforcement

---

## 🔔 Triggers (9 Total)

### Appointment Validation (1)
1. **trg_check_appointment_conflict_insert** (BEFORE INSERT on appointments)
   - Validates: Doctor availability, no conflicts, daily limit
   - Error: Returns 45000 if violations found
   - Features: Strict interval logic for conflict detection

### Inventory Management (2)
2. **trg_prevent_negative_inventory** (BEFORE UPDATE on inventory_items)
   - Ensures: quantity_in_stock >= 0
   - Error: Blocks negative inventory

3. **trg_dispense_medication_deduct_inventory** (AFTER UPDATE on prescription_details)
   - Auto-deducts inventory when medication dispensed
   - Creates: inventory_transaction record
   - Safeguard: Prevents race condition deduction

### Invoice Management (3)
4. **trg_update_invoice_on_payment** (AFTER INSERT on payments)
   - Auto-updates invoice status when payment received
   - Calculates: amount_paid, balance_due
   - Status: Paid | Partial | Unpaid

5. **trg_invoice_total_on_line_insert** (AFTER INSERT on invoice_line_items)
   - Auto-calculates: subtotal, total_amount
   - Formula: SUM(line_items) + tax - discount

6. **trg_validate_invoice_total** (BEFORE UPDATE on invoices)
   - Validates: total_amount = subtotal + tax - discount
   - Prevents: Negative amounts, calculation errors

### Audit & Data Integrity (3)
7. **trg_audit_patient_update** (AFTER UPDATE on patients)
   - Logs: OLD vs NEW values to audit_logs
   - Tracks: patient name, phone changes

8. **trg_prevent_soap_deletion** (BEFORE DELETE on subjective_notes)
   - Blocks deletion of clinical SOAP notes
   - Compliance: Prevents accidental data loss

9. **trg_auto_create_invoice_on_completion** (AFTER UPDATE on appointments)
   - Auto-generates invoice when appointment marked Completed
   - Creates: New encounter if not exists
   - Adds: Consultation fee as line item

---

## 🔐 Security Features

### Role-Based Access Control (RBAC)
- **7 Roles**: ADMIN, DOCTOR, NURSE, RECEPTIONIST, PHARMACIST, FINANCE, PATIENT
- **Row-Level Security**: Implemented at application layer (middleware.js)
- **Audit Trail**: All patient updates logged with user_id, old_data, new_data

### Data Integrity
- **Foreign Key Constraints**: 30+ FK relationships with CASCADE/SET NULL
- **Check Constraints**: Appointment durations > 0, satisfaction_rating 0-5
- **UNIQUE Constraints**: mrn, employee_id, clerk_user_id, email

### Data Protection
- **Soft Deletes**: is_deleted flag on sensitive tables
- **Timestamp Tracking**: created_at, updated_at on all tables
- **IP & User Agent**: Captured in audit_logs for forensics

---

## 📊 Key Statistics

### Data Relationships
- **1:N** - 1 user → N patients (family members, re-admissions)
- **1:1** - 1 staff → 1 user (unique constraint)
- **1:1** - 1 encounter → 1 vitals (unique constraint)
- **1:1** - 1 encounter → 1 SOAP (subjective, objective, assessment, plan)

### Indexes
- **Primary Keys**: 54 (1 per table + views)
- **Foreign Keys**: 30+
- **Full Text**: 5 (patient names, staff names, complaints, diagnosis, treatment)
- **Performance**: Date, status, role_id indexes for query optimization

### Constraints
- **Check Constraints**: 12+ for business logic validation
- **Unique Constraints**: 15+ to prevent duplicates
- **Not Null**: 100+ critical fields

---

## 📈 AI Integration

### AI Columns
- **patients.ai_readmission_risk** - Readmission risk (0-100%)
- **vitals.ai_risk_score** - Clinical risk score (0-100%)
- **vitals.ai_risk_category** - Risk level (Low, Moderate, High, Critical)
- **vitals.ai_alerts** - JSON array of AI-generated alerts
- **assessment_notes.ai_suggestion** - Suggested diagnoses with confidence
- **assessment_notes.ai_confidence** - AI diagnosis confidence (0-100%)
- **prescription_details.ai_interaction_alerts** - Drug-drug interactions detected
- **invoices.ai_billing_optimization** - Billing suggestions
- **invoices.ai_fraud_alert** - Fraud indicators

---

## 🚀 Performance Optimizations

### Normalization
- **3NF**: All tables normalized to 3rd normal form
- **No Redundancy**: Eliminates data duplication
- **Referential Integrity**: Maintained via FK constraints

### Indexing Strategy
```
- Composite index: (doctor_id, appointment_date, appointment_time)
- Range indexes: appointment_date, invoice_date
- Foreign key indexes: All FK columns indexed
- Full text indexes: Patient/staff names, clinical notes
```

### View Strategy
- **Pre-joined Views**: Reduces query complexity
- **Denormalization at View Level**: Combines related data
- **Materialization Ready**: Can be converted to materialized views for large datasets

---

## 📋 Schema Compliance

| Standard | Status | Details |
|----------|--------|---------|
| **HIPAA** | ⚠️ Partial | Audit logging implemented; encryption needs config |
| **3NF** | ✅ Full | All tables normalized to 3rd normal form |
| **Referential Integrity** | ✅ Full | Foreign key constraints enforce relationships |
| **ACID Properties** | ✅ Full | InnoDB engine with transactions |
| **Audit Trail** | ✅ Full | audit_logs table with comprehensive tracking |

---

## 🔄 Maintenance & Backup

### Recommended Backup Strategy
```sql
-- Daily full backup
mysqldump -u root -p medsyncdb > medsyncdb_$(date +%Y%m%d).sql

-- Hourly incremental backup (binary logs)
-- Configure: binlog_format = ROW, log_bin = ON
```

### Archive Strategy
- **Encounters**: Archive encounters older than 5 years
- **Payments**: Archive payments older than 7 years
- **Audit Logs**: Archive logs older than 2 years (compliance)

---

## 📚 Related Files

- **Schema Definition**: [db.sql](./db.sql)
- **Service Layer**: [services/admin.js](./services/admin.js)
- **Middleware**: [middleware.js](./middleware.js)
- **API Routes**: [app/api/admin/](./app/api/admin/)

---

## 📝 Last Updated

**Date:** May 13, 2026  
**Version:** 1.0 (Post View Implementation)  
**Next Review:** After Next Major Feature Release
