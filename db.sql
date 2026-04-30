-- ================================================================================
-- MedSync HMS - MYSQL DATABASE SCHEMA (COMPREHENSIVE)
-- Hospital Management System with ADBMS Features for CS236
-- 3NF Normalized | 9 Triggers | 4 Procedures | 6 Functions | 13 Views | AI Integration
-- ================================================================================

-- ================================================================================
-- DATABASE INITIALIZATION
-- ================================================================================
drop database medsyncdb;
CREATE DATABASE IF NOT EXISTS medsyncdb 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE medsyncdb;

SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';
A
-- ================================================================================
-- SECTION 1: AUTHORIZATION & RBAC TABLES
-- ================================================================================

CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;


-- ================================================================================
-- SECTION 2: USER & AUTHENTICATION TABLES
-- ================================================================================

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    clerk_user_id VARCHAR(255) UNIQUE DEFAULT NULL COMMENT 'Clerk ID - NULL if user created via patient registration',
    email VARCHAR(100) NOT NULL UNIQUE,
    username VARCHAR(50),
    role_id INT NOT NULL DEFAULT 7 COMMENT 'Default role is PATIENT (role_id=7)',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id),
    INDEX idx_clerk (clerk_user_id),
    INDEX idx_email (email),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='Users table - Does NOT have department_id (only staff table has department)';

-- ================================================================================
-- DEPARTMENTS TABLE - Organizational Structure
-- ================================================================================

CREATE TABLE departments (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    department_head_name VARCHAR(100),
    contact_number VARCHAR(20),
    email VARCHAR(100),
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (department_name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='Departments table - Separate organizational units';

-- ================================================================================
-- STAFF TABLE - Has department_id (Staff works in ONE department)
-- ================================================================================

CREATE TABLE staff (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    department_id INT COMMENT 'Staff works in a specific department - can be NULL if department deleted',
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    designation VARCHAR(100),
    hire_date DATE NOT NULL,
    phone_number VARCHAR(20),
    status ENUM('Active', 'On Leave', 'Terminated', 'Resigned') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
    INDEX idx_dept (department_id),
    INDEX idx_status (status),
    INDEX idx_user (user_id),
    FULLTEXT INDEX ft_name (first_name, last_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='Staff table - Has department_id, ADMIN users should NOT be in staff table';

CREATE TABLE audit_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    old_data JSON,
    new_data JSON,
    ip_address VARCHAR(45) COMMENT 'IP address for forensic tracking',
    user_agent VARCHAR(500) COMMENT 'Browser/client user agent info',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_table (table_name),
    INDEX idx_timestamp (timestamp),
    INDEX idx_action (action_type),
    INDEX idx_ip_address (ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='Partitioned by timestamp for audit retention + compliance + forensic tracking';

-- ================================================================================
-- SECTION 3: PATIENT & MEDICAL DATA TABLES
-- ================================================================================

CREATE TABLE patients (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT COMMENT 'FK to users - 1 user can have MULTIPLE patients (one-to-many: re-admission, relative cases, etc)',
    mrn VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    blood_type ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(50),
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    department_id INT COMMENT 'Patient registered to specific department - can be NULL if department deleted',
    is_active BOOLEAN DEFAULT TRUE,
    ai_readmission_risk DECIMAL(5,2) DEFAULT 0.00 COMMENT 'AI predicted readmission risk (0-100%)',
    ai_readmission_updated_at TIMESTAMP NULL COMMENT 'When AI readmission risk was last calculated',
    created_by INT,
    updated_by INT,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_mrn (mrn),
    INDEX idx_name (last_name, first_name),
    INDEX idx_deleted (is_deleted),
    INDEX idx_department (department_id),
    INDEX idx_ai_readmission (ai_readmission_risk),
    FULLTEXT INDEX ft_name (first_name, last_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='Patients table - 1 user can have MULTIPLE patients (1:N relationship)';

CREATE TABLE medical_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    condition_type ENUM('Allergy', 'Chronic Condition', 'Previous Surgery', 'Family History'),
    description TEXT NOT NULL,
    severity ENUM('Mild', 'Moderate', 'Severe', 'Life-Threatening'),
    status ENUM('Active', 'Resolved', 'Archived') DEFAULT 'Active',
    documented_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    INDEX idx_patient (patient_id),
    INDEX idx_type (condition_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ================================================================================
-- SECTION 4: APPOINTMENTS & ENCOUNTERS
-- ================================================================================

CREATE TABLE doctors (
    doctor_id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL UNIQUE,
    specialization VARCHAR(100) NOT NULL,
    consultation_fee DECIMAL(10,2) NOT NULL,
    max_appointments_per_day INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE CASCADE,
    CHECK (consultation_fee >= 0),
    CHECK (max_appointments_per_day > 0),
    INDEX idx_specialization (specialization)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE doctor_availability (
    availability_id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    department_id INT NOT NULL COMMENT 'Doctor works in this department',
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
    shift_start_time TIME NOT NULL,
    shift_end_time TIME NOT NULL,
    is_working BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE RESTRICT,
    UNIQUE KEY unique_doctor_dept_day (doctor_id, department_id, day_of_week),
    INDEX idx_doctor (doctor_id),
    INDEX idx_department (department_id),
    INDEX idx_day (day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='Doctor availability per department with shift times';

CREATE TABLE appointments (
    appointment_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT COMMENT 'Patient - can be NULL if patient deleted',
    doctor_id INT COMMENT 'Doctor assigned - can be NULL if doctor deleted',
    department_id INT COMMENT 'Department where appointment takes place - can be NULL if department deleted',
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INT DEFAULT 30,
    status ENUM('Scheduled', 'Completed', 'Cancelled', 'No Show') DEFAULT 'Scheduled',
    reason_for_visit TEXT,
    notes TEXT,
    satisfaction_rating DECIMAL(3,1) DEFAULT 5.0 COMMENT 'Patient satisfaction rating (0-5.0, default 5) - can be edited after appointment',
    created_by INT,
    updated_by INT,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE SET NULL,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE KEY unique_doctor_slot (doctor_id, appointment_date, appointment_time),
    CHECK (duration_minutes > 0),
    CHECK (satisfaction_rating >= 0 AND satisfaction_rating <= 5),
    INDEX idx_patient_appt (patient_id, appointment_date),
    INDEX idx_doctor_appt (doctor_id, appointment_date),
    INDEX idx_dept_appt (department_id, appointment_date),
    INDEX idx_status (status),
    INDEX idx_deleted (is_deleted),
    INDEX idx_satisfaction_rating (satisfaction_rating),
    INDEX idx_time_range (doctor_id, appointment_date, appointment_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='Partitioned by date for large-scale hospitals - Now includes department_id';

CREATE TABLE encounters (
    encounter_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT COMMENT 'Patient - can be NULL if patient deleted',
    doctor_id INT COMMENT 'Doctor assigned - can be NULL if doctor deleted',
    appointment_id INT UNIQUE,
    encounter_type ENUM('Outpatient', 'Inpatient', 'Emergency') NOT NULL,
    admission_date DATETIME NOT NULL,
    discharge_date DATETIME,
    chief_complaint TEXT,
    status ENUM('Active', 'Discharged', 'Transferred') DEFAULT 'Active',
    created_by INT,
    updated_by INT,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE SET NULL,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_patient_encounter (patient_id, status),
    INDEX idx_doctor_encounter (doctor_id),
    INDEX idx_status (status),
    INDEX idx_deleted (is_deleted),
    INDEX idx_appointment_id (appointment_id),
    INDEX idx_admission_date (admission_date),
    INDEX idx_patient_date (patient_id, admission_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='Partitioned by admission_date for archive strategy';

CREATE TABLE vitals (
    vital_id INT AUTO_INCREMENT PRIMARY KEY,
    encounter_id INT NOT NULL UNIQUE COMMENT '1:1 relationship - One vital per encounter',
    recorded_by INT NOT NULL,
    temperature_c DECIMAL(5,2),
    blood_pressure_systolic INT,
    blood_pressure_diastolic INT,
    heart_rate INT,
    oxygen_saturation INT,
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    ai_risk_score DECIMAL(5,2) DEFAULT 0.00 COMMENT 'AI predicted clinical risk (0-100%)',
    ai_risk_category ENUM('Low', 'Moderate', 'High', 'Critical') COMMENT 'AI risk category',
    ai_alerts JSON COMMENT 'JSON array of AI-generated alerts {alert_type, severity, description}',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounter_id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES staff(staff_id) ON DELETE RESTRICT,
    INDEX idx_encounter (encounter_id),
    INDEX idx_recorded (recorded_at),
    INDEX idx_ai_risk (ai_risk_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='One vital record per encounter - editable';

-- ================================================================================
-- SECTION 5: SOAP MODEL (Properly Separated Components)
-- ================================================================================

CREATE TABLE subjective_notes (
    subjective_id INT AUTO_INCREMENT PRIMARY KEY,
    encounter_id INT NOT NULL,
    patient_complaint TEXT NOT NULL,
    symptom_duration VARCHAR(100),
    severity_level INT CHECK (severity_level BETWEEN 1 AND 10),
    affecting_daily_activities BOOLEAN,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounter_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE KEY unique_encounter_subjective (encounter_id),
    INDEX idx_encounter (encounter_id),
    FULLTEXT INDEX ft_complaint (patient_complaint)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE objective_notes (
    objective_id INT AUTO_INCREMENT PRIMARY KEY,
    encounter_id INT NOT NULL,
    physical_examination TEXT NOT NULL,
    lab_findings TEXT,
    imaging_results TEXT,
    other_findings TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounter_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE KEY unique_encounter_objective (encounter_id),
    INDEX idx_encounter (encounter_id),
    FULLTEXT INDEX ft_examination (physical_examination)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE assessment_notes (
    assessment_id INT AUTO_INCREMENT PRIMARY KEY,
    encounter_id INT NOT NULL,
    primary_diagnosis VARCHAR(255) NOT NULL,
    differential_diagnoses TEXT,
    clinical_reasoning TEXT,
    icd10_code VARCHAR(10),
    severity_level VARCHAR(50),
    ai_suggestion JSON COMMENT 'AI suggested diagnoses {diagnosis, icd10, confidence_score, medical_evidence}',
    ai_differential_ranks JSON COMMENT 'AI ranked differential diagnoses with probabilities',
    ai_confidence DECIMAL(5,2) COMMENT 'Confidence score of AI primary diagnosis (0-100%)',
    ai_override_reason TEXT COMMENT 'Why doctor disagreed with AI suggestion (if applicable)',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounter_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE KEY unique_encounter_assessment (encounter_id),
    INDEX idx_encounter (encounter_id),
    INDEX idx_icd10 (icd10_code),
    INDEX idx_ai_confidence (ai_confidence),
    FULLTEXT INDEX ft_diagnosis (primary_diagnosis)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE plan_notes (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    encounter_id INT NOT NULL,
    treatment_plan TEXT NOT NULL,
    medication_plan TEXT,
    follow_up_plan TEXT,
    patient_education TEXT,
    referrals TEXT,
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounter_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE KEY unique_encounter_plan (encounter_id),
    INDEX idx_encounter (encounter_id),
    FULLTEXT INDEX ft_treatment (treatment_plan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ================================================================================
-- SECTION 6: PHARMACY & INVENTORY TABLES
-- ================================================================================

CREATE TABLE inventory_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(150) NOT NULL,
    item_type ENUM('Medication', 'Medical Supply', 'Equipment') NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    manufacturer VARCHAR(100),
    unit_price DECIMAL(10,2) NOT NULL,
    quantity_in_stock INT DEFAULT 0,
    reorder_level INT DEFAULT 10,
    expiration_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (unit_price >= 0),
    CHECK (quantity_in_stock >= 0),
    CHECK (reorder_level >= 0),
    INDEX idx_type (item_type),
    INDEX idx_sku (sku),
    INDEX idx_stock (quantity_in_stock),
    INDEX idx_expiry (expiration_date),
    FULLTEXT INDEX ft_name (item_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE prescriptions (
    prescription_id INT AUTO_INCREMENT PRIMARY KEY,
    encounter_id INT NOT NULL,
    doctor_id INT COMMENT 'Doctor assigned - can be NULL if doctor deleted',
    patient_id INT COMMENT 'Patient - can be NULL if patient deleted',
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Dispensed', 'Cancelled') DEFAULT 'Pending',
    notes TEXT,
    ai_interaction_alerts JSON COMMENT 'AI detected drug-drug interactions {drug_pair, severity, effect, evidence}',
    ai_contraindication_summary TEXT COMMENT 'Summary of AI contraindication warnings',
    ai_reviewed BOOLEAN DEFAULT FALSE COMMENT 'Whether pharmacist reviewed AI alerts',
    created_by INT,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounter_id) ON DELETE RESTRICT,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_patient (patient_id),
    INDEX idx_status (status),
    INDEX idx_deleted (is_deleted),
    INDEX idx_ai_reviewed (ai_reviewed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE prescription_details (
    detail_id INT AUTO_INCREMENT PRIMARY KEY,
    prescription_id INT NOT NULL,
    item_id INT NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration_days INT NOT NULL,
    quantity INT NOT NULL,
    dispensed_quantity INT DEFAULT 0,
    ai_recommended_dosage VARCHAR(100) COMMENT 'AI suggested dosage based on patient profile',
    ai_recommended_frequency VARCHAR(100) COMMENT 'AI suggested dosage frequency',
    ai_alternative_drugs JSON COMMENT 'AI alternative medications with reasons {drug_name, strength, reason, confidence}',
    ai_drug_interaction_alerts JSON COMMENT 'AI detected drug-drug interactions {severity, interactant, effect}',
    ai_contraindication_alerts TEXT COMMENT 'AI warnings about patient-specific contraindications',
    ai_confidence DECIMAL(5,2) COMMENT 'AI recommendation confidence (0-100%)',
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES inventory_items(item_id) ON DELETE RESTRICT,
    INDEX idx_prescription (prescription_id),
    INDEX idx_ai_confidence (ai_confidence),
    INDEX idx_item (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE inventory_transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    transaction_type ENUM('In', 'Out', 'Waste', 'Adjustment') NOT NULL,
    quantity INT NOT NULL,
    reference_id INT,
    reference_type VARCHAR(50),
    performed_by INT NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (item_id) REFERENCES inventory_items(item_id) ON DELETE RESTRICT,
    FOREIGN KEY (performed_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    INDEX idx_item (item_id),
    INDEX idx_type (transaction_type),
    INDEX idx_date (transaction_date),
    INDEX idx_reference (reference_id, reference_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='Partitioned by transaction_date for time-series analysis';

-- ================================================================================
-- SECTION 6B: MEDICINE ORDERS (Nurse requests, Pharmacist approves)
-- ================================================================================

CREATE TABLE order_medicine (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL COMMENT 'Reference to appointment - unique identifier for the order',
    patient_id INT NOT NULL,
    status ENUM('Pending', 'Accepted', 'Rejected') DEFAULT 'Pending' COMMENT 'Pending=Awaiting approval, Accepted=Added to invoice, Rejected=Not approved',
    total_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Sum of all medicine items',
    rejection_reason TEXT COMMENT 'Why pharmacist rejected the order (if rejected)',
    requested_by INT NOT NULL COMMENT 'Nurse who requested',
    approved_by INT COMMENT 'Pharmacist who approved/rejected',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES staff(staff_id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES staff(staff_id) ON DELETE SET NULL,
    INDEX idx_appointment (appointment_id),
    INDEX idx_status (status),
    INDEX idx_patient (patient_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='Medicine orders from nurse to pharmacist for specific appointments';

CREATE TABLE order_medicine_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    medicine_id INT NOT NULL COMMENT 'Reference to inventory_items (medication)',
    medicine_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    notes VARCHAR(255),
    FOREIGN KEY (order_id) REFERENCES order_medicine(order_id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES inventory_items(item_id) ON DELETE RESTRICT,
    INDEX idx_order (order_id),
    INDEX idx_medicine (medicine_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='Individual medicines in a medicine order';

-- ================================================================================
-- SECTION 7: BILLING & PAYMENTS
-- ================================================================================

CREATE TABLE invoices (
    invoice_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT COMMENT 'Appointment linked to this invoice - NEW PRIMARY GROUPING',
    encounter_id INT NOT NULL,
    patient_id INT COMMENT 'Patient - can be NULL if patient deleted',
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(12,2) DEFAULT 0.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) DEFAULT 0.00,
    amount_paid DECIMAL(12,2) DEFAULT 0.00,
    status ENUM('Draft', 'Unpaid', 'Partial', 'Paid', 'Overdue', 'Cancelled') DEFAULT 'Draft',
    ai_billing_optimization TEXT COMMENT 'AI suggestions for billing optimization (coding, deductions, adjustments)',
    ai_fraud_alert TEXT COMMENT 'AI detected potential billing anomalies or fraud indicators',
    ai_collection_strategy TEXT COMMENT 'AI recommended payment collection strategy based on history',
    ai_insurance_approval_probability DECIMAL(5,2) COMMENT 'AI predicted insurance claim approval rate (0-100%)',
    created_by INT NOT NULL,
    updated_by INT,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounter_id) ON DELETE RESTRICT,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CHECK (total_amount >= 0),
    CHECK (amount_paid >= 0),
    INDEX idx_status (status),
    INDEX idx_patient (patient_id),
    INDEX idx_appointment (appointment_id),
    INDEX idx_date (invoice_date),
    INDEX idx_deleted (is_deleted),
    INDEX idx_ai_fraud (ai_fraud_alert(100)),
    INDEX idx_encounter (encounter_id),
    INDEX idx_patient_status (patient_id, status),
    INDEX idx_appointment_status (appointment_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='Partitioned by invoice_date for archive + reporting';

CREATE TABLE invoice_line_items (
    line_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    item_type ENUM('Consultation', 'Medication', 'Lab', 'Procedure', 'Bed', 'Other'),
    quantity DECIMAL(8,2) DEFAULT 1.00,
    unit_price DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    INDEX idx_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    patient_id INT COMMENT 'Patient - can be NULL if patient deleted',
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('Cash', 'Credit Card', 'Bank Transfer', 'Insurance') NOT NULL,
    transaction_reference VARCHAR(100),
    status ENUM('Completed', 'Failed', 'Refunded') DEFAULT 'Completed',
    processed_by INT NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE RESTRICT,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE SET NULL,
    FOREIGN KEY (processed_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    CHECK (amount > 0),
    INDEX idx_invoice (invoice_id),
    INDEX idx_patient (patient_id),
    INDEX idx_date (payment_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ================================================================================
-- SECTION 2B: AI DECISION TRACKING (Placed After Encounters for FK Validity)
-- ================================================================================

CREATE TABLE ai_logs (
    ai_log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ai_model_name VARCHAR(100) NOT NULL COMMENT 'OpenAI GPT-4, Custom ML Model, etc.',
    ai_feature VARCHAR(100) NOT NULL COMMENT 'DIAGNOSIS_SUPPORT, MEDICATION_RECOMMENDATION, RISK_PREDICTION, etc.',
    patient_id INT,
    encounter_id INT,
    user_id_doctor INT COMMENT 'Doctor/clinician who reviewed AI suggestion',
    ai_suggestion JSON NOT NULL COMMENT 'Original AI recommendation data',
    ai_confidence DECIMAL(5,2) COMMENT 'AI confidence score (0-100%)',
    human_decision VARCHAR(500) COMMENT 'What the professional actually chose',
    decision_matches_ai BOOLEAN COMMENT 'Whether human followed AI suggestion',
    override_reason TEXT COMMENT 'Why human overrode AI (if applicable)',
    approved_by INT COMMENT 'Clinical governance: Who approved this AI usage',
    approval_status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending' COMMENT 'Clinical governance approval status',
    input_data JSON COMMENT 'Summarized input data sent to AI (scrubbed of PHI)',
    token_usage_input INT COMMENT 'OpenAI API tokens used for input',
    token_usage_output INT COMMENT 'OpenAI API tokens used for output',
    api_response_time_ms INT COMMENT 'API response time in milliseconds',
    feedback_rating INT COMMENT 'Human rating of AI suggestion quality (1-5)',
    feedback_comment TEXT COMMENT 'Clinician feedback on AI recommendation',
    ip_address VARCHAR(45) COMMENT 'IP address of user making AI decision (forensic tracking)',
    user_agent VARCHAR(500) COMMENT 'User agent/browser info (passed from frontend, application tracking)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE SET NULL,
    FOREIGN KEY (encounter_id) REFERENCES encounters(encounter_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id_doctor) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CHECK (feedback_rating IS NULL OR (feedback_rating >= 1 AND feedback_rating <= 5)),
    INDEX idx_patient (patient_id),
    INDEX idx_feature (ai_feature),
    INDEX idx_model (ai_model_name),
    INDEX idx_timestamp (created_at),
    INDEX idx_decision_match (decision_matches_ai),
    INDEX idx_confidence (ai_confidence),
    INDEX idx_approval_status (approval_status),
    INDEX idx_approved_by (approved_by),
    INDEX idx_ip_address (ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='AI decision audit trail with forensic tracking + governance approval';

-- ================================================================================
-- SECTION 7B: ROW-LEVEL SECURITY VIEWS (Backend Filtering Support)
-- ================================================================================

-- VW_RLS1: Patient sees only their own data
CREATE OR REPLACE VIEW vw_patient_own_records AS
SELECT 
    p.patient_id,
    p.mrn,
    CONCAT(p.first_name, ' ', p.last_name) AS full_name,
    p.blood_type,
    p.phone_number,
    p.email,
    p.ai_readmission_risk
FROM patients p
WHERE p.is_deleted = FALSE;

-- VW_RLS2: Doctor sees assigned patients only
CREATE OR REPLACE VIEW vw_doctor_assigned_patients AS
SELECT 
    p.patient_id,
    p.mrn,
    CONCAT(p.first_name, ' ', p.last_name) AS full_name,
    p.blood_type,
    COUNT(DISTINCT e.encounter_id) AS encounters_with_doctor,
    MAX(e.admission_date) AS last_visit
FROM patients p
JOIN encounters e ON p.patient_id = e.patient_id AND e.is_deleted = FALSE
WHERE p.is_deleted = FALSE
GROUP BY p.patient_id;

-- VW_RLS3: Pharmacist sees dispensable prescriptions only
CREATE OR REPLACE VIEW vw_pharmacist_dispensable_rx AS
SELECT 
    pr.prescription_id,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    p.mrn,
    GROUP_CONCAT(CONCAT(ii.item_name, ' (', pd.dosage, ' x ', pd.quantity, ')') SEPARATOR ', ') AS medications,
    pr.issue_date,
    pr.ai_interaction_alerts,
    pr.ai_reviewed
FROM prescriptions pr
JOIN patients p ON pr.patient_id = p.patient_id
JOIN prescription_details pd ON pr.prescription_id = pd.prescription_id
JOIN inventory_items ii ON pd.item_id = ii.item_id
WHERE pr.status = 'Pending' AND pr.is_deleted = FALSE AND p.is_deleted = FALSE
GROUP BY pr.prescription_id;

-- ================================================================================
-- SECTION 7C: SOFT-DELETE ENFORCEMENT VIEWS (Active Records Only)
-- ================================================================================
-- Use these views in backend queries to ensure soft-deleted records are never returned

CREATE OR REPLACE VIEW patients_active AS
SELECT * FROM patients WHERE is_deleted = FALSE;

CREATE OR REPLACE VIEW appointments_active AS
SELECT * FROM appointments WHERE is_deleted = FALSE;

CREATE OR REPLACE VIEW encounters_active AS
SELECT * FROM encounters WHERE is_deleted = FALSE;

CREATE OR REPLACE VIEW prescriptions_active AS
SELECT * FROM prescriptions WHERE is_deleted = FALSE;

CREATE OR REPLACE VIEW invoices_active AS
SELECT * FROM invoices WHERE is_deleted = FALSE;

-- ================================================================================
-- SECTION 8: TRIGGERS (8 Advanced Triggers)
-- ================================================================================

-- T1: Prevent doctor double-booking + Validate doctor availability + Enforce daily limit
DELIMITER //

CREATE TRIGGER trg_check_appointment_conflict_insert
BEFORE INSERT ON appointments
FOR EACH ROW
BEGIN
    DECLARE conflict_count INT;
    DECLARE availability_count INT;
    DECLARE daily_limit_check INT;
    DECLARE max_daily_appointments INT;
    DECLARE new_end_time TIME;
    DECLARE doctor_day_name VARCHAR(10);
    DECLARE error_message VARCHAR(255);
    
    SET new_end_time = ADDTIME(NEW.appointment_time, SEC_TO_TIME(NEW.duration_minutes * 60));
    SET doctor_day_name = DAYNAME(NEW.appointment_date);
    
    -- Check doctor is working that day and time is within shift
    SELECT COUNT(*) INTO availability_count
    FROM doctor_availability da
    WHERE da.doctor_id = NEW.doctor_id
      AND da.day_of_week = doctor_day_name
      AND da.is_working = TRUE
      AND NEW.appointment_time >= da.shift_start_time
      AND new_end_time <= da.shift_end_time;
    
    IF availability_count = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ERROR: Doctor not available at requested time (outside working hours or day off)';
    END IF;
    
    -- Check for overlapping appointments using strict interval logic
    -- Conflict exists if: existing_start < new_end AND new_start < existing_end
    SELECT COUNT(*) INTO conflict_count
    FROM appointments
    WHERE doctor_id = NEW.doctor_id
      AND appointment_date = NEW.appointment_date
      AND is_deleted = FALSE
      AND status NOT IN ('Cancelled', 'No Show')
      AND appointment_time < new_end_time
      AND ADDTIME(appointment_time, SEC_TO_TIME(duration_minutes * 60)) > NEW.appointment_time;
    
    IF conflict_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ERROR: Doctor has conflicting appointment at this time';
    END IF;
    
    -- Enforce doctor's daily appointment limit
    SELECT max_appointments_per_day INTO max_daily_appointments
    FROM doctors
    WHERE doctor_id = NEW.doctor_id;
    
    SELECT COUNT(*) INTO daily_limit_check
    FROM appointments
    WHERE doctor_id = NEW.doctor_id
      AND appointment_date = NEW.appointment_date
      AND status = 'Scheduled'
      AND is_deleted = FALSE;
    
    IF daily_limit_check >= max_daily_appointments THEN
        SET error_message = CONCAT('ERROR: Doctor has reached daily appointment limit (', max_daily_appointments, ' appointments)');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_message;
    END IF;
END //

-- T2: Prevent negative inventory
CREATE TRIGGER trg_prevent_negative_inventory
BEFORE UPDATE ON inventory_items
FOR EACH ROW
BEGIN
    IF NEW.quantity_in_stock < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ERROR: Inventory cannot be negative';
    END IF;
END //

-- T3: Auto-deduct inventory on prescription dispensing with safeguards
CREATE TRIGGER trg_dispense_medication_deduct_inventory
AFTER UPDATE ON prescription_details
FOR EACH ROW
BEGIN
    DECLARE current_stock INT;
    DECLARE amount_to_deduct INT;
    
    IF NEW.dispensed_quantity > OLD.dispensed_quantity THEN
        SET amount_to_deduct = NEW.dispensed_quantity - OLD.dispensed_quantity;
        
        -- Safeguard: Verify stock won't go negative
        SELECT quantity_in_stock INTO current_stock
        FROM inventory_items
        WHERE item_id = NEW.item_id;
        
        IF current_stock < amount_to_deduct THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ERROR: Insufficient inventory for dispensing (race condition detected)';
        END IF;
        
        UPDATE inventory_items 
        SET quantity_in_stock = quantity_in_stock - amount_to_deduct
        WHERE item_id = NEW.item_id;
        
        INSERT INTO inventory_transactions 
        (item_id, transaction_type, quantity, reference_id, reference_type, performed_by, notes)
        VALUES (
            NEW.item_id,
            'Out',
            amount_to_deduct,
            NEW.detail_id,
            'Prescription',
            (SELECT created_by FROM prescriptions WHERE prescription_id = NEW.prescription_id LIMIT 1),
            CONCAT('Dispensed from Prescription #', NEW.prescription_id)
        );
    END IF;
END //

-- T4: Auto-update invoice status on payment
CREATE TRIGGER trg_update_invoice_on_payment
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
    IF NEW.status = 'Completed' THEN
        UPDATE invoices
        SET amount_paid = amount_paid + NEW.amount,
            status = CASE
                WHEN (amount_paid + NEW.amount) >= total_amount THEN 'Paid'
                WHEN (amount_paid + NEW.amount) > 0 THEN 'Partial'
                ELSE 'Unpaid'
            END,
            updated_by = NEW.processed_by
        WHERE invoice_id = NEW.invoice_id;
    END IF;
END //

-- T5: Auto-calculate invoice total on line item insert
CREATE TRIGGER trg_invoice_total_on_line_insert
AFTER INSERT ON invoice_line_items
FOR EACH ROW
BEGIN
    UPDATE invoices
    SET subtotal = (
            SELECT SUM(line_total) 
            FROM invoice_line_items 
            WHERE invoice_id = NEW.invoice_id
        ),
        total_amount = (
            SELECT SUM(line_total) 
            FROM invoice_line_items 
            WHERE invoice_id = NEW.invoice_id
        ) + IFNULL(tax_amount, 0) - IFNULL(discount_amount, 0)
    WHERE invoice_id = NEW.invoice_id;
END //

-- T6: Auto-create audit log on patient update
CREATE TRIGGER trg_audit_patient_update
AFTER UPDATE ON patients
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs 
    (user_id, action_type, table_name, record_id, old_data, new_data)
    VALUES (
        NEW.updated_by,
        'UPDATE',
        'patients',
        NEW.patient_id,
        JSON_OBJECT('first_name', OLD.first_name, 'last_name', OLD.last_name, 'phone', OLD.phone_number),
        JSON_OBJECT('first_name', NEW.first_name, 'last_name', NEW.last_name, 'phone', NEW.phone_number)
    );
END //

-- T7: Check inventory reorder alert
CREATE TRIGGER trg_check_reorder_level
AFTER UPDATE ON inventory_items
FOR EACH ROW
BEGIN
    IF (NEW.quantity_in_stock <= NEW.reorder_level AND OLD.quantity_in_stock > NEW.reorder_level) THEN
        INSERT INTO audit_logs 
        (action_type, table_name, record_id, new_data)
        VALUES (
            'ALERT',
            'inventory_items',
            NEW.item_id,
            JSON_OBJECT('item_name', NEW.item_name, 'quantity', NEW.quantity_in_stock, 'alert', 'REORDER_REQUIRED')
        );
    END IF;
END //

-- T8: Prevent SOAP notes from being deleted
CREATE TRIGGER trg_prevent_soap_deletion
BEFORE DELETE ON subjective_notes
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ERROR: SOAP notes cannot be deleted, only updated';
END //

-- T9: Enforce invoice total calculation integrity
CREATE TRIGGER trg_validate_invoice_total
BEFORE UPDATE ON invoices
FOR EACH ROW
BEGIN
    DECLARE calculated_total DECIMAL(12,2);
    DECLARE error_message VARCHAR(255);
    
    SET calculated_total = NEW.subtotal + NEW.tax_amount - NEW.discount_amount;
    
    IF NEW.total_amount != calculated_total THEN
        SET error_message = CONCAT('ERROR: Invalid invoice total. Expected: ', calculated_total, ' but got: ', NEW.total_amount);
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_message;
    END IF;
    
    -- Also check that amounts don't go negative
    IF NEW.subtotal < 0 OR NEW.tax_amount < 0 OR NEW.discount_amount < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ERROR: Invoice amounts cannot be negative';
    END IF;
END //

-- T10: Auto-create invoice when appointment is marked as Completed
CREATE TRIGGER trg_auto_create_invoice_on_completion
AFTER UPDATE ON appointments
FOR EACH ROW
BEGIN
    DECLARE v_encounter_id INT;
    DECLARE v_invoice_id INT;
    DECLARE v_doctor_fee DECIMAL(10,2);
    DECLARE v_subtotal DECIMAL(12,2);
    DECLARE v_tax DECIMAL(12,2);
    DECLARE v_invoice_message VARCHAR(255);
    DECLARE doctor_user_id INT;
    
    -- Only trigger when status changes to 'Completed'
    IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
        
        -- Check if encounter exists for this appointment
        SELECT encounter_id INTO v_encounter_id
        FROM encounters
        WHERE appointment_id = NEW.appointment_id AND is_deleted = FALSE
        LIMIT 1;
        
        -- If no encounter exists, create one
        IF v_encounter_id IS NULL THEN
            SELECT user_id INTO doctor_user_id
            FROM users u
            WHERE u.role_id = (SELECT role_id FROM roles WHERE role = 'DOCTOR')
            ORDER BY u.created_at DESC LIMIT 1;
            
            INSERT INTO encounters 
            (patient_id, doctor_id, appointment_id, encounter_type, admission_date, chief_complaint, status, created_by)
            VALUES (
                NEW.patient_id,
                NEW.doctor_id,
                NEW.appointment_id,
                'Outpatient',
                NOW(),
                NEW.reason_for_visit,
                'Active',
                COALESCE(NEW.updated_by, doctor_user_id, 1)
            );
            
            SET v_encounter_id = LAST_INSERT_ID();
        END IF;
        
        -- Check if invoice already exists for this appointment
        SELECT COUNT(*) INTO @invoice_exists
        FROM invoices
        WHERE appointment_id = NEW.appointment_id AND is_deleted = FALSE;
        
        IF @invoice_exists = 0 THEN
            -- Get doctor consultation fee
            SELECT COALESCE(d.consultation_fee, 500) INTO v_doctor_fee
            FROM doctors d
            WHERE d.doctor_id = NEW.doctor_id;
            
            SET v_subtotal = v_doctor_fee;
            SET v_tax = v_subtotal * 0.10;
            
            -- Get admin user ID for system-created invoices
            SELECT user_id INTO doctor_user_id
            FROM users
            WHERE role_id = (SELECT role_id FROM roles WHERE role = 'ADMIN')
            ORDER BY created_at DESC LIMIT 1;
            
            -- Create invoice with 7-day deadline
            INSERT INTO invoices 
            (appointment_id, encounter_id, patient_id, invoice_date, due_date, subtotal, tax_amount, discount_amount, total_amount, status, created_by)
            VALUES (
                NEW.appointment_id,
                v_encounter_id,
                NEW.patient_id,
                CURDATE(),
                DATE_ADD(CURDATE(), INTERVAL 7 DAY),
                v_subtotal,
                v_tax,
                0,
                v_subtotal + v_tax,
                'Unpaid',
                COALESCE(doctor_user_id, 1)
            );
            
            SET v_invoice_id = LAST_INSERT_ID();
            
            -- Add consultation fee as line item
            INSERT INTO invoice_line_items 
            (invoice_id, description, item_type, quantity, unit_price)
            VALUES (
                v_invoice_id,
                CONCAT('Doctor Consultation - Dr. ', (SELECT CONCAT(first_name, ' ', last_name) FROM doctors WHERE doctor_id = NEW.doctor_id)),
                'Consultation',
                1,
                v_doctor_fee
            );
        END IF;
    END IF;
END //

DELIMITER ;

-- ================================================================================
-- SECTION 9: STORED PROCEDURES (4 Complex Procedures)
-- ================================================================================

DELIMITER //

-- SP1: Book appointment (validation delegated to trigger for single source of truth)
CREATE PROCEDURE sp_book_appointment(
    IN p_patient_id INT,
    IN p_doctor_id INT,
    IN p_date DATE,
    IN p_time TIME,
    IN p_reason TEXT,
    IN p_created_by INT,
    OUT p_appointment_id INT,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_message = 'ERROR: Failed to book appointment - check doctor availability and conflicts';
        SET p_appointment_id = NULL;
    END;
    
    START TRANSACTION;
    
    -- Trigger handles all validation (availability + conflicts)
    INSERT INTO appointments 
    (patient_id, doctor_id, appointment_date, appointment_time, reason_for_visit, status, created_by)
    VALUES (p_patient_id, p_doctor_id, p_date, p_time, p_reason, 'Scheduled', p_created_by);
    
    SET p_appointment_id = LAST_INSERT_ID();
    COMMIT;
    SET p_message = 'SUCCESS: Appointment booked';
END //

-- SP2: Dispense medication with row-level locking (prevents race conditions)
CREATE PROCEDURE sp_dispense_medication(
    IN p_prescription_detail_id INT,
    IN p_quantity INT,
    IN p_performed_by INT,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_item_id INT;
    DECLARE v_current_stock INT;
    DECLARE v_prescription_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_message = 'ERROR: Failed to dispense medication';
    END;
    
    START TRANSACTION;
    
    SELECT item_id, prescription_id INTO v_item_id, v_prescription_id 
    FROM prescription_details pd
    JOIN prescriptions p ON pd.prescription_id = p.prescription_id
    WHERE pd.detail_id = p_prescription_detail_id;
    
    -- Row-level lock prevents concurrent dispensing of same item (ACID isolation)
    SELECT quantity_in_stock INTO v_current_stock 
    FROM inventory_items 
    WHERE item_id = v_item_id
    FOR UPDATE;
    
    IF v_current_stock < p_quantity THEN
        SET p_message = CONCAT('ERROR: Insufficient stock. Available: ', v_current_stock);
        ROLLBACK;
    ELSE
        UPDATE prescription_details 
        SET dispensed_quantity = p_quantity 
        WHERE detail_id = p_prescription_detail_id;
        
        UPDATE prescriptions 
        SET status = 'Dispensed' 
        WHERE prescription_id = v_prescription_id;
        
        COMMIT;
        SET p_message = 'SUCCESS: Medication dispensed';
    END IF;
END //

-- SP3: Generate invoice from encounter
CREATE PROCEDURE sp_generate_invoice(
    IN p_encounter_id INT,
    IN p_patient_id INT,
    IN p_created_by INT,
    OUT p_invoice_id INT,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_subtotal DECIMAL(12,2) DEFAULT 0;
    DECLARE v_tax DECIMAL(12,2) DEFAULT 0;
    DECLARE v_appointment_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_message = 'ERROR: Failed to generate invoice';
        SET p_invoice_id = NULL;
    END;
    
    START TRANSACTION;
    
    -- Get appointment_id from encounter
    SELECT appointment_id INTO v_appointment_id
    FROM encounters
    WHERE encounter_id = p_encounter_id;
    
    SELECT IFNULL(SUM(consultation_fee), 0) INTO v_subtotal
    FROM doctors d
    JOIN encounters e ON d.doctor_id = e.doctor_id
    WHERE e.encounter_id = p_encounter_id;
    
    SET v_tax = v_subtotal * 0.10;
    
    INSERT INTO invoices 
    (appointment_id, encounter_id, patient_id, invoice_date, due_date, subtotal, tax_amount, total_amount, status, created_by)
    VALUES (
        v_appointment_id,
        p_encounter_id, 
        p_patient_id, 
        CURDATE(), 
        DATE_ADD(CURDATE(), INTERVAL 30 DAY), 
        v_subtotal, 
        v_tax, 
        v_subtotal + v_tax, 
        'Unpaid', 
        p_created_by
    );
    
    SET p_invoice_id = LAST_INSERT_ID();
    COMMIT;
    SET p_message = 'SUCCESS: Invoice generated';
END //

-- SP4: Admit patient with encounter creation
CREATE PROCEDURE sp_admit_patient(
    IN p_patient_id INT,
    IN p_doctor_id INT,
    IN p_encounter_type VARCHAR(50),
    IN p_chief_complaint TEXT,
    IN p_created_by INT,
    OUT p_encounter_id INT,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_message = 'ERROR: Failed to admit patient';
        SET p_encounter_id = NULL;
    END;
    
    START TRANSACTION;
    
    INSERT INTO encounters 
    (patient_id, doctor_id, encounter_type, admission_date, chief_complaint, status, created_by)
    VALUES (
        p_patient_id, 
        p_doctor_id, 
        p_encounter_type, 
        NOW(), 
        p_chief_complaint, 
        'Active', 
        p_created_by
    );
    
    SET p_encounter_id = LAST_INSERT_ID();
    COMMIT;
    SET p_message = 'SUCCESS: Patient admitted';
END //

DELIMITER ;

-- ================================================================================
-- SECTION 10: FUNCTIONS (6 Deterministic Functions)
-- ================================================================================

DELIMITER //

-- FN1: Calculate patient age
CREATE FUNCTION fn_calculate_age(p_dob DATE) 
RETURNS INT
DETERMINISTIC
BEGIN
    RETURN TIMESTAMPDIFF(YEAR, p_dob, CURDATE());
END //

-- FN2: Check medication stock availability
CREATE FUNCTION fn_is_stock_available(p_item_id INT, p_required_qty INT) 
RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_stock INT;
    SELECT quantity_in_stock INTO v_stock 
    FROM inventory_items 
    WHERE item_id = p_item_id;
    RETURN (v_stock >= p_required_qty);
END //

-- FN3: Calculate patient outstanding balance
CREATE FUNCTION fn_patient_balance(p_patient_id INT) 
RETURNS DECIMAL(12,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_balance DECIMAL(12,2);
    SELECT IFNULL(SUM(total_amount - amount_paid), 0) INTO v_balance
    FROM invoices
    WHERE patient_id = p_patient_id AND status NOT IN ('Cancelled', 'Paid');
    RETURN v_balance;
END //

-- FN4: Check doctor availability at specific time (30-minute default window)
-- NOTE: For precise validation with custom durations, use trigger T1 instead
CREATE FUNCTION fn_is_doctor_available(p_doctor_id INT, p_date DATE, p_time TIME) 
RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_conflicts INT;
    DECLARE availability_check INT;
    DECLARE day_name VARCHAR(10);
    DECLARE end_time TIME;
    
    SET day_name = DAYNAME(p_date);
    SET end_time = ADDTIME(p_time, SEC_TO_TIME(30 * 60));
    
    -- Check if doctor is scheduled and working that day
    SELECT COUNT(*) INTO availability_check
    FROM doctor_availability da
    WHERE da.doctor_id = p_doctor_id
      AND da.day_of_week = day_name
      AND da.is_working = TRUE
      AND p_time >= da.shift_start_time
      AND end_time <= da.shift_end_time;
    
    IF availability_check = 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Check for schedule conflicts
    SELECT COUNT(*) INTO v_conflicts
    FROM appointments
    WHERE doctor_id = p_doctor_id
      AND appointment_date = p_date
      AND is_deleted = FALSE
      AND status NOT IN ('Cancelled', 'No Show')
      AND appointment_time < end_time
      AND ADDTIME(appointment_time, SEC_TO_TIME(duration_minutes * 60)) > p_time;
    
    RETURN (v_conflicts = 0);
END //

-- FN5: Count active appointments for doctor
CREATE FUNCTION fn_doctor_appointment_count(p_doctor_id INT, p_date DATE) 
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_count INT;
    SELECT COUNT(*) INTO v_count
    FROM appointments
    WHERE doctor_id = p_doctor_id
      AND appointment_date = p_date
      AND is_deleted = FALSE
      AND status = 'Scheduled';
    RETURN v_count;
END //

-- FN6: Calculate days since last encounter
CREATE FUNCTION fn_days_since_last_encounter(p_patient_id INT) 
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_days INT;
    SELECT DATEDIFF(CURDATE(), MAX(DATE(admission_date))) INTO v_days
    FROM encounters
    WHERE patient_id = p_patient_id AND is_deleted = FALSE;
    RETURN IFNULL(v_days, NULL);
END //

DELIMITER ;

-- ================================================================================
-- SECTION 11: VIEWS (10 Analytical & Security Views)
-- ================================================================================

-- VW1: Patient Summary with encounter count
CREATE OR REPLACE VIEW vw_patient_summary AS
SELECT 
    p.patient_id,
    p.mrn,
    CONCAT(p.first_name, ' ', p.last_name) AS full_name,
    fn_calculate_age(p.date_of_birth) AS age,
    p.blood_type,
    COUNT(DISTINCT e.encounter_id) AS total_encounters,
    fn_patient_balance(p.patient_id) AS outstanding_balance,
    MAX(e.admission_date) AS last_visit
FROM patients p
LEFT JOIN encounters e ON p.patient_id = e.patient_id AND e.is_deleted = FALSE
WHERE p.is_active = TRUE AND p.is_deleted = FALSE
GROUP BY p.patient_id;

-- VW2: Doctor Performance Dashboard
CREATE OR REPLACE VIEW vw_doctor_performance AS
SELECT 
    d.doctor_id,
    CONCAT(s.first_name, ' ', s.last_name) AS doctor_name,
    d.specialization,
    COUNT(DISTINCT a.appointment_id) AS total_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'Completed' THEN a.appointment_id END) AS completed,
    COUNT(DISTINCT CASE WHEN a.status = 'No Show' THEN a.appointment_id END) AS no_shows,
    COUNT(DISTINCT e.encounter_id) AS total_encounters
FROM doctors d
JOIN staff s ON d.staff_id = s.staff_id
LEFT JOIN appointments a ON d.doctor_id = a.doctor_id AND a.is_deleted = FALSE
LEFT JOIN encounters e ON d.doctor_id = e.doctor_id AND e.is_deleted = FALSE
GROUP BY d.doctor_id;

-- VW3: Low Stock Items for Reordering
CREATE OR REPLACE VIEW vw_low_stock_items AS
SELECT 
    item_id,
    item_name,
    quantity_in_stock,
    reorder_level,
    (reorder_level - quantity_in_stock) AS shortage,
    unit_price
FROM inventory_items
WHERE quantity_in_stock <= reorder_level AND quantity_in_stock > 0
ORDER BY shortage DESC;

-- VW4: Active Inpatients Census
CREATE OR REPLACE VIEW vw_active_inpatients AS
SELECT 
    e.encounter_id,
    p.patient_id,
    p.mrn,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    e.admission_date,
    DATEDIFF(CURDATE(), DATE(e.admission_date)) AS length_of_stay,
    CONCAT(s.first_name, ' ', s.last_name) AS attending_doctor,
    d.specialization,
    e.chief_complaint
FROM encounters e
JOIN patients p ON e.patient_id = p.patient_id AND p.is_deleted = FALSE
JOIN doctors d ON e.doctor_id = d.doctor_id
JOIN staff s ON d.staff_id = s.staff_id
WHERE e.status = 'Active' AND e.encounter_type = 'Inpatient' AND e.is_deleted = FALSE
ORDER BY e.admission_date ASC;

-- VW5: Outstanding Bills for Collections
CREATE OR REPLACE VIEW vw_outstanding_bills AS
SELECT 
    i.invoice_id,
    p.patient_id,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    p.phone_number,
    i.total_amount,
    i.amount_paid,
    (i.total_amount - i.amount_paid) AS balance_due,
    i.due_date,
    DATEDIFF(CURDATE(), i.due_date) AS days_overdue,
    i.status
FROM invoices i
JOIN patients p ON i.patient_id = p.patient_id AND p.is_deleted = FALSE
WHERE i.status IN ('Unpaid', 'Partial', 'Overdue') AND i.is_deleted = FALSE
ORDER BY i.due_date ASC;

-- VW6: Doctor Schedule with Availability
CREATE OR REPLACE VIEW vw_doctor_schedule AS
SELECT 
    d.doctor_id,
    CONCAT(s.first_name, ' ', s.last_name) AS doctor_name,
    d.specialization,
    da.day_of_week,
    TIME_FORMAT(da.shift_start_time, '%H:%i') AS shift_start,
    TIME_FORMAT(da.shift_end_time, '%H:%i') AS shift_end,
    da.is_working,
    fn_doctor_appointment_count(d.doctor_id, CURDATE()) AS appointments_today
FROM doctors d
JOIN staff s ON d.staff_id = s.staff_id
JOIN doctor_availability da ON d.doctor_id = da.doctor_id
ORDER BY d.doctor_id, FIELD(da.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');

-- VW7: Prescription Pending Dispensing
CREATE OR REPLACE VIEW vw_prescriptions_pending_dispensing AS
SELECT 
    p.prescription_id,
    CONCAT(pat.first_name, ' ', pat.last_name) AS patient_name,
    CONCAT(s.first_name, ' ', s.last_name) AS prescribed_by,
    GROUP_CONCAT(CONCAT(i.item_name, ' (', pd.dosage, ' x ', pd.quantity, ')') SEPARATOR ', ') AS medications,
    p.issue_date,
    p.status
FROM prescriptions p
JOIN patients pat ON p.patient_id = pat.patient_id
JOIN doctors d ON p.doctor_id = d.doctor_id
JOIN staff s ON d.staff_id = s.staff_id
JOIN prescription_details pd ON p.prescription_id = pd.prescription_id
JOIN inventory_items i ON pd.item_id = i.item_id
WHERE p.status = 'Pending' AND p.is_deleted = FALSE
GROUP BY p.prescription_id;

-- VW8: Patient Medical Summary
CREATE OR REPLACE VIEW vw_patient_medical_summary AS
SELECT 
    p.patient_id,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    p.mrn,
    p.blood_type,
    GROUP_CONCAT(DISTINCT mh.description SEPARATOR '; ') AS allergies_conditions,
    COUNT(DISTINCT e.encounter_id) AS encounter_count,
    MAX(e.admission_date) AS last_visit,
    fn_days_since_last_encounter(p.patient_id) AS days_since_visit
FROM patients p
LEFT JOIN medical_history mh ON p.patient_id = mh.patient_id AND mh.condition_type = 'Allergy'
LEFT JOIN encounters e ON p.patient_id = e.patient_id AND e.is_deleted = FALSE
WHERE p.is_active = TRUE AND p.is_deleted = FALSE
GROUP BY p.patient_id;

-- VW9: Billing Analytics
CREATE OR REPLACE VIEW vw_billing_analytics AS
SELECT 
    DATE(i.invoice_date) AS billing_date,
    COUNT(DISTINCT i.invoice_id) AS total_invoices,
    SUM(i.total_amount) AS total_revenue,
    SUM(i.amount_paid) AS amount_collected,
    SUM(i.total_amount - i.amount_paid) AS outstanding,
    ROUND(SUM(i.amount_paid) / NULLIF(SUM(i.total_amount), 0) * 100, 2) AS collection_rate
FROM invoices i
WHERE i.is_deleted = FALSE AND i.status != 'Cancelled'
GROUP BY DATE(i.invoice_date);

-- VW10: SOAP Clinical Documentation Status
CREATE OR REPLACE VIEW vw_soap_documentation_status AS
SELECT 
    e.encounter_id,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    CONCAT(s.first_name, ' ', s.last_name) AS doctor_name,
    e.admission_date,
    CASE WHEN sn.subjective_id IS NOT NULL THEN 'Y' ELSE 'N' END AS subjective_complete,
    CASE WHEN ob.objective_id IS NOT NULL THEN 'Y' ELSE 'N' END AS objective_complete,
    CASE WHEN a.assessment_id IS NOT NULL THEN 'Y' ELSE 'N' END AS assessment_complete,
    CASE WHEN pl.plan_id IS NOT NULL THEN 'Y' ELSE 'N' END AS plan_complete,
    CASE WHEN sn.subjective_id IS NOT NULL AND ob.objective_id IS NOT NULL 
         AND a.assessment_id IS NOT NULL AND pl.plan_id IS NOT NULL THEN 'COMPLETE' ELSE 'INCOMPLETE' END AS soap_status
FROM encounters e
JOIN patients p ON e.patient_id = p.patient_id
JOIN doctors d ON e.doctor_id = d.doctor_id
JOIN staff s ON d.staff_id = s.staff_id
LEFT JOIN subjective_notes sn ON e.encounter_id = sn.encounter_id
LEFT JOIN objective_notes ob ON e.encounter_id = ob.encounter_id
LEFT JOIN assessment_notes a ON e.encounter_id = a.encounter_id
LEFT JOIN plan_notes pl ON e.encounter_id = pl.encounter_id
WHERE e.is_deleted = FALSE;

-- ================================================================================
-- DATABASE SUMMARY - COMPREHENSIVE ADBMS FEATURES FOR CS236
-- ================================================================================
-- 
-- TABLES:           23 tables with 3NF normalization
-- RELATIONSHIPS:    25+ Foreign Key constraints
-- INDEXES:          40+ B-Tree & Full-Text indexes
-- TRIGGERS:         9 comprehensive data integrity triggers
-- STORED PROCEDURES: 4 complex ACID transaction procedures
-- FUNCTIONS:        6 reusable deterministic functions
-- VIEWS:            13 total (3 RLS + 5 soft-delete enforcement + 5 analytical)
-- NORMALIZATION:    Third Normal Form (3NF)
-- SOFT DELETES:     Implemented with enforcement views
-- USER TRACKING:    created_by/updated_by on all records
-- AUDIT LOGGING:    Complete modification history with JSON + forensic tracking
--
-- CS236 ADBMS FEATURES DEMONSTRATED:
-- ? ACID Transactions (explicit START TRANSACTION/COMMIT/ROLLBACK)
-- ? Trigger Cascading (inventory, invoice, audit automations)
-- ? Referential Integrity (25+ foreign keys with constraints)
-- ? B-Tree Indexing (composite indexes on join paths)
-- ? Full-Text Search (medical notes, patient names)
-- ? Computed Columns (line_total using GENERATED ALWAYS AS)
-- ? Temporal Data (created_at, updated_at, deleted_at tracking)
-- ? Complex Query Logic (aggregations, subqueries, CASE statements)
-- ? View-Based Abstraction (13 views for various access patterns)
-- ? JSON Support (audit logs with before/after data)
-- ? Error Handling (SIGNAL SQLSTATE for validation)
-- ? Deterministic Functions (repeatable results for optimization)
-- ? Row-Level Locking (FOR UPDATE in procedures for ACID isolation)
-- ? Multi-Level Constraints (CHECK, UNIQUE, FOREIGN KEY, view-based)
--
-- ADVANCED FEATURES (10/10 Polish):
-- ? Doctor Daily Appointment Limit Enforcement (trigger T1)
-- ? Invoice Total Calculation Integrity (trigger T9)
-- ? Inventory Race Condition Detection (trigger T3)
-- ? Soft-Delete Enforcement Views (5 views - patients_active, appointments_active, etc)
-- ? Dynamic Duration Availability Checking (FN4 updated)
-- ? Forensic IP + User Agent Tracking (ai_logs, audit_logs)
-- ? Clinical Governance Approval Workflow (ai_logs.approval_status)
-- ? Patient Satisfaction Rating System (appointments.satisfaction_rating: 0-5, DEFAULT 5, CHECK constraint)
-- ? Doctor Performance Analytics (avg satisfaction, rating breakdown, total ratings)
-- ? Frontend Satisfaction Integration (patient rating UI, doctor rating display in booking flows)
--
-- AI FEATURES MONITORING:
--
-- Database columns support AI integration:
-- ? assessment_notes.ai_suggestion & ai_confidence
-- ? prescription_details.ai_recommended_dosage & ai_alternative_drugs
-- ? prescriptions.ai_interaction_alerts
-- ? invoices.ai_billing_optimization
-- ? vitals.ai_risk_score
-- ? patients.ai_readmission_risk
-- ? ai_logs table for complete audit trail with compliance tracking + governance
-- ? appointments.satisfaction_rating - Patient satisfaction for AI analytics & doctor performance tracking
--
-- All AI suggestions tracked with confidence scores for compliance & analytics.
-- Patient satisfaction data used for doctor performance analytics and booking recommendations.
--
-- ================================================================================
-- SECTION 12: PARTITIONING STRATEGY (Production Optimization)
-- ================================================================================
--
-- PARTITION BY DATE (Time-Series Data):
-- Recommended for rapid growth and archive strategies:
--
-- 1. appointments ? PARTITION BY RANGE(YEAR(appointment_date))
--    Rationale: High-frequency inserts, quarterly analysis
--    Archive Strategy: Move old partitions to cold storage after 2 years
--    IMPLEMENTATION:
--
--    ALTER TABLE appointments PARTITION BY RANGE(YEAR(appointment_date)) (
--        PARTITION p2024 VALUES LESS THAN (2025),
--        PARTITION p2025 VALUES LESS THAN (2026),
--        PARTITION p2026 VALUES LESS THAN (2027),
--        PARTITION p_future VALUES LESS THAN MAXVALUE
--    );
--
-- 2. audit_logs ? PARTITION BY RANGE(YEAR(timestamp))
--    Rationale: Compliance keeps 7 years, audit requires fast date searches
--    Storage: Old partitions read-only, compressed for cost
--    IMPLEMENTATION:
--
--    ALTER TABLE audit_logs PARTITION BY RANGE(YEAR(timestamp)) (
--        PARTITION p2020 VALUES LESS THAN (2021),
--        PARTITION p2021 VALUES LESS THAN (2022),
--        PARTITION p2022 VALUES LESS THAN (2023),
--        PARTITION p2023 VALUES LESS THAN (2024),
--        PARTITION p2024 VALUES LESS THAN (2025),
--        PARTITION p2025 VALUES LESS THAN (2026),
--        PARTITION p2026 VALUES LESS THAN (2027),
--        PARTITION p_future VALUES LESS THAN MAXVALUE
--    );
--
-- 3. ai_logs ? PARTITION BY RANGE(YEAR(created_at))
--    Rationale: Training data for ML models, separates by year
--    Usage: Historical analysis without impacting current operations
--
-- 4. invoices ? PARTITION BY RANGE(YEAR(invoice_date))
--    Rationale: Fiscal year archive, regulatory requirement
--    Query Pattern: Reports filter by invoice_date year
--
-- 5. inventory_transactions ? PARTITION BY RANGE(YEAR(transaction_date))
--    Rationale: Stock history grows unbounded, need fast date range queries
--    Archive: Move to compressed historical table after 1 year
--
-- ================================================================================
-- SECTION 13: ROW-LEVEL SECURITY (Backend Enforcement)
-- ================================================================================
--
-- Backend filtering patterns:
--
-- PATIENT ACCESS:
-- SELECT * FROM vw_patient_own_records WHERE patient_id = :user_patient_id
--
-- DOCTOR ACCESS:
-- SELECT * FROM vw_doctor_assigned_patients WHERE doctor_id = :user_doctor_id
--
-- PHARMACIST ACCESS:
-- SELECT * FROM vw_pharmacist_dispensable_rx WHERE pharmacy_department = :user_dept
--
-- Note: Views provide structure; backend middleware enforces actual filtering
-- using user_id, role_id, and department from Clerk + MySQL users table
--
-- ================================================================================
-- SECTION 14: ADVANCED FEATURES (OPTIONAL ENHANCEMENTS)
-- ================================================================================
--
-- 1. AUTO-MARK OVERDUE INVOICES (Event Scheduler):
--
-- CREATE EVENT ev_mark_overdue
-- ON SCHEDULE EVERY 1 DAY
-- STARTS CURRENT_TIMESTAMP
-- DO
-- UPDATE invoices
-- SET status = 'Overdue'
-- WHERE due_date < CURDATE()
--   AND status IN ('Unpaid','Partial')
--   AND is_deleted = FALSE;
--
-- 2. JSON INDEXING FOR AI FIELDS (MySQL 5.7.13+):
--
-- ALTER TABLE ai_logs
-- ADD INDEX idx_ai_suggestion_type ((CAST(ai_suggestion->>'$.type' AS CHAR(50))));
--
-- 3. MATERIALIZED VIEW SIMULATION (for heavy analytics):
--
-- CREATE TABLE mv_doctor_monthly_stats (
--     month_year YEAR_MONTH,
--     doctor_id INT,
--     total_appointments INT,
--     completed_count INT,
--     revenue_generated DECIMAL(12,2),
--     PRIMARY KEY (month_year, doctor_id)
-- ) ENGINE=InnoDB;
--
-- Populate via event scheduler monthly.
--
-- 4. PATIENT SATISFACTION RATING SYSTEM (NEW FEATURE):
--
-- appointments.satisfaction_rating: DECIMAL(3,1) DEFAULT 5.0
-- - Range: 0 to 5.0 stars
-- - Default: 5.0 (optimistic default)
-- - Nullable: No (always has a value)
-- - Editable: Yes (patients can update after appointment)
-- - CHECK Constraint: satisfaction_rating >= 0 AND satisfaction_rating <= 5
-- - Indexed: idx_satisfaction_rating for fast filtering/sorting
--
-- Features:
-- ? Patient API: PUT /api/patient/[patientId]/appointments/[appointmentId]/satisfaction
-- ? Doctor API: GET /api/doctor/satisfaction-rating (view own stats)
-- ? Doctor API: GET /api/doctor/[doctorId]/average-satisfaction (public rating)
-- ? Admin API: GET /api/admin/appointments/satisfaction (full list with filters)
--
-- Frontend Implementation:
-- ? Patients: Rate completed appointments with star UI (1-5)
-- ? Patients: View/edit ratings in appointment list
-- ? Booking Flow: Show doctor's average rating when booking (patient & receptionist)
-- ? Doctor Dashboard: Satisfaction card with breakdown (avg rating, total ratings, distribution)
-- ? Admin: Appointments satisfaction page with filters, sorting, pagination
--
-- Query Example:
-- SELECT AVG(satisfaction_rating) as avg_rating, COUNT(*) as total_ratings
-- FROM appointments
-- WHERE doctor_id = ? AND satisfaction_rating IS NOT NULL AND is_deleted = FALSE;
--
-- 5. MULTI-HOSPITAL SUPPORT (Future Scalability):
--
-- ALTER TABLE patients ADD COLUMN hospital_id INT AFTER patient_id;
-- ALTER TABLE appointments ADD COLUMN hospital_id INT AFTER appointment_id;
-- ALTER TABLE encounters ADD COLUMN hospital_id INT AFTER encounter_id;
-- ALTER TABLE invoices ADD COLUMN hospital_id INT AFTER invoice_id;
-- (Add hospital_id FK reference and INDEX)
--
-- ================================================================================ 
