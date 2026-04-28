# 🗄️ Database Schema

**Development of a QR-Enabled Integrated Payment System with Transactional Analytics Dashboard for Government Fees of Majayjay, Laguna**

---

## 📋 Table of Contents

1. [Schema Overview](#schema-overview)
2. [Core Entities](#core-entities)
3. [Relationship Diagram](#relationship-diagram)
4. [Detailed Table Definitions](#detailed-table-definitions)
5. [Indexes & Performance](#indexes--performance)
6. [Constraints & Validations](#constraints--validations)
7. [Prisma Schema](#prisma-schema)

---

## 📊 Schema Overview

### Database Design Principles
- **Normalization**: 3NF (Third Normal Form) for data integrity
- **Performance**: Optimized for read-heavy reporting and write-heavy transactions
- **Scalability**: Partitioning strategy for large tables
- **Auditability**: Timestamps and user tracking on all transactions
- **Data Integrity**: Foreign keys and constraints enforced

### Core Data Model

```
Users
  ├── Roles (relationship)
  ├── Bills (creator)
  ├── Payments (maker)
  ├── Sessions (owner)
  └── Audit Logs (creator)

Bills
  ├── Payer (User)
  ├── Bill Items (fee items)
  ├── Payments (payments on this bill)
  ├── QR Codes (for payment)
  └── Penalties (applied penalties)

Payments
  ├── Bill (what's being paid)
  ├── Payer (who paid)
  ├── Receipt (generated receipt)
  ├── Method (payment method used)
  └── Verification (payment verification)

Fees
  ├── Bill Items (used in bills)
  ├── Penalty Rules (penalties for this fee)
  └── Category (categorization)

QR Codes
  ├── Bill (for which bill)
  └── Payment (linked payment after use)
```

---

## 🔑 Core Entities

### Entity Relationship Overview

| Entity | Purpose | Primary Key |
|--------|---------|------------|
| users | User accounts and authentication | id |
| roles | User role definitions | id |
| roles_permissions | Role-permission mapping | role_id, permission_id |
| permissions | System permissions | id |
| sessions | Active user sessions | id |
| fees | Payable fee types | id |
| fee_categories | Fee categorization | id |
| bills | Generated bills for payers | id |
| bill_items | Line items in bills | id |
| payments | Payment transactions | id |
| payment_methods | Available payment methods | id |
| qr_codes | QR code records | id |
| official_receipts | Generated receipts | id |
| penalty_rules | Penalty calculation rules | id |
| penalties | Applied penalties on bills | id |
| audit_logs | Transaction audit trail | id |
| notifications | Sent notifications | id |
| departments | LGU departments | id |
| on_demand_charges | Ad-hoc charges | id |

---

## 📐 Detailed Table Definitions

### 1. users

**Purpose**: User accounts and authentication

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  contact_number VARCHAR(20) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  department_id INTEGER REFERENCES departments(id),
  status ENUM('active', 'inactive', 'suspended', 'pending') DEFAULT 'active',
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(45),
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_status ON users(status);
```

**Fields**:
- `id`: Auto-incrementing primary key
- `email`: Unique email address (login credential)
- `password_hash`: Bcrypt hashed password
- `first_name`, `last_name`: User's full name
- `contact_number`: SMS recipient for notifications
- `role_id`: Foreign key to roles table
- `department_id`: Department assignment (for department viewers)
- `status`: Account status (active, inactive, suspended, pending)
- `email_verified`: Email verification flag
- `two_fa_enabled`: Two-factor authentication status
- `last_login_at`: Last login timestamp
- `created_at`, `updated_at`: Audit timestamps

---

### 2. roles

**Purpose**: Role definitions for access control

```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Predefined Roles**:
- `admin` - Full system access
- `cashier` - Payment recording and QR generation
- `department_viewer` - Department-specific reports
- `resident` - Self-service payments and inquiries

---

### 3. sessions

**Purpose**: Track active user sessions

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  refresh_token VARCHAR(500) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_type VARCHAR(50),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
```

---

### 4. departments

**Purpose**: LGU department organization

```sql
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  department_name VARCHAR(100) NOT NULL,
  department_head_id INTEGER REFERENCES users(id),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  office_location VARCHAR(255),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 5. fee_categories

**Purpose**: Categorize fee types

```sql
CREATE TABLE fee_categories (
  id SERIAL PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Categories**:
- Real Property Tax
- Cedula (Community Tax)
- Business Tax
- Utility Services
- Permits & Licenses
- Other Fees

---

### 6. fees

**Purpose**: Payable fee types configuration

```sql
CREATE TABLE fees (
  id SERIAL PRIMARY KEY,
  fee_name VARCHAR(100) NOT NULL,
  description TEXT,
  category_id INTEGER NOT NULL REFERENCES fee_categories(id),
  fee_type ENUM('fixed', 'variable', 'percentage', 'tiered') DEFAULT 'fixed',
  base_amount DECIMAL(12,2),
  unit_name VARCHAR(50),
  unit_rate DECIMAL(12,2),
  percentage_rate DECIMAL(5,2),
  tier_configuration JSONB,
  applicable_to ENUM('individual', 'business', 'both') DEFAULT 'both',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_fees_category ON fees(category_id);
CREATE INDEX idx_fees_active ON fees(active);
```

**Fee Types**:

1. **Fixed Amount**:
```
base_amount: 500
unit_name: NULL
unit_rate: NULL
```

2. **Variable (Unit-Based)**:
```
base_amount: 100 (connection fee)
unit_name: "Cubic Meter"
unit_rate: 25 (per cubic meter)
```

3. **Percentage**:
```
base_amount: NULL
percentage_rate: 1.5 (1.5% of revenue)
```

4. **Tiered**:
```
tier_configuration: {
  "tiers": [
    {"min": 0, "max": 50000, "rate": 0.5},
    {"min": 50001, "max": 100000, "rate": 1.0}
  ]
}
```

---

### 7. bills

**Purpose**: Generated bills for payment

```sql
CREATE TABLE bills (
  id SERIAL PRIMARY KEY,
  bill_number VARCHAR(50) UNIQUE NOT NULL,
  payer_id INTEGER NOT NULL REFERENCES users(id),
  bill_date DATE NOT NULL,
  due_date DATE NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  balance_amount DECIMAL(12,2) NOT NULL,
  penalty_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  status ENUM('draft', 'issued', 'unpaid', 'partially_paid', 'paid', 'cancelled', 'overdue') DEFAULT 'draft',
  notes TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bills_payer ON bills(payer_id);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_due_date ON bills(due_date);
CREATE INDEX idx_bills_created_at ON bills(created_at);
```

**Fields**:
- `bill_number`: Unique sequential bill reference
- `payer_id`: User who owes the bill
- `bill_date`, `due_date`: Key dates
- `total_amount`: Total amount due (including penalties)
- `paid_amount`: Amount paid so far
- `balance_amount`: Remaining amount due
- `penalty_amount`: Calculated penalties
- `status`: Current bill status

---

### 8. bill_items

**Purpose**: Line items in bills

```sql
CREATE TABLE bill_items (
  id SERIAL PRIMARY KEY,
  bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  fee_id INTEGER NOT NULL REFERENCES fees(id),
  fee_name VARCHAR(100) NOT NULL,
  unit_count DECIMAL(10,2),
  unit_price DECIMAL(12,2),
  amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bill_items_bill ON bill_items(bill_id);
```

---

### 9. penalty_rules

**Purpose**: Define penalty calculation rules

```sql
CREATE TABLE penalty_rules (
  id SERIAL PRIMARY KEY,
  fee_id INTEGER NOT NULL REFERENCES fees(id),
  penalty_type ENUM('late', 'interest', 'surcharge') NOT NULL,
  calculation_method ENUM('fixed', 'percentage') NOT NULL,
  amount_or_rate DECIMAL(12,2) NOT NULL,
  grace_period_days INTEGER DEFAULT 0,
  max_penalty_amount DECIMAL(12,2),
  apply_monthly BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_penalty_rules_fee ON penalty_rules(fee_id);
```

**Examples**:

1. **Late Payment (Fixed)**:
```
fee_id: 1 (RPT)
penalty_type: 'late'
calculation_method: 'fixed'
amount_or_rate: 100 (₱100 flat)
grace_period_days: 30 (after 30 days overdue)
```

2. **Monthly Interest (Percentage)**:
```
fee_id: 1 (RPT)
penalty_type: 'interest'
calculation_method: 'percentage'
amount_or_rate: 2 (2% per month)
apply_monthly: TRUE
```

---

### 10. penalties

**Purpose**: Applied penalties on bills

```sql
CREATE TABLE penalties (
  id SERIAL PRIMARY KEY,
  bill_id INTEGER NOT NULL REFERENCES bills(id),
  penalty_rule_id INTEGER NOT NULL REFERENCES penalty_rules(id),
  penalty_amount DECIMAL(12,2) NOT NULL,
  applied_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_penalties_bill ON penalties(bill_id);
```

---

### 11. payment_methods

**Purpose**: Available payment methods

```sql
CREATE TABLE payment_methods (
  id SERIAL PRIMARY KEY,
  method_name VARCHAR(50) UNIQUE NOT NULL,
  provider VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  requires_verification BOOLEAN DEFAULT FALSE,
  max_transaction_amount DECIMAL(12,2),
  min_transaction_amount DECIMAL(12,2),
  settlement_days INTEGER,
  transaction_fee_percent DECIMAL(5,2),
  fixed_fee DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Available Methods**:
1. Cash (In-person cashier)
2. GCash (QR-based)
3. Maya (QR-based)
4. Bank Transfer (Future)

---

### 12. payments

**Purpose**: Payment transactions

```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(50) UNIQUE NOT NULL,
  bill_id INTEGER REFERENCES bills(id),
  payer_id INTEGER NOT NULL REFERENCES users(id),
  amount DECIMAL(12,2) NOT NULL,
  payment_method_id INTEGER NOT NULL REFERENCES payment_methods(id),
  status ENUM('pending', 'paid', 'failed', 'cancelled', 'refunded') DEFAULT 'pending',
  reference_number VARCHAR(100),
  cashier_id INTEGER REFERENCES users(id),
  terminal_id VARCHAR(100),
  payment_date TIMESTAMP NOT NULL,
  verified_at TIMESTAMP,
  verified_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_bill ON payments(bill_id);
CREATE INDEX idx_payments_payer ON payments(payer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
```

---

### 13. official_receipts

**Purpose**: Generated receipts for payments

```sql
CREATE TABLE official_receipts (
  id SERIAL PRIMARY KEY,
  or_number VARCHAR(50) UNIQUE NOT NULL,
  receipt_id UUID DEFAULT gen_random_uuid(),
  payment_id INTEGER NOT NULL REFERENCES payments(id),
  bill_id INTEGER REFERENCES bills(id),
  amount_paid DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50),
  cashier_id INTEGER REFERENCES users(id),
  terminal_id VARCHAR(100),
  or_data JSONB,
  status ENUM('generated', 'delivered', 'printed', 'cancelled') DEFAULT 'generated',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_receipts_or_number ON official_receipts(or_number);
CREATE INDEX idx_receipts_payment ON official_receipts(payment_id);
```

---

### 14. qr_codes

**Purpose**: QR code records for payments

```sql
CREATE TABLE qr_codes (
  id SERIAL PRIMARY KEY,
  qr_code UUID DEFAULT gen_random_uuid(),
  bill_id INTEGER REFERENCES bills(id),
  transaction_id VARCHAR(50),
  amount DECIMAL(12,2) NOT NULL,
  fee_type VARCHAR(100),
  payer_reference VARCHAR(100),
  qr_image_url TEXT,
  encoded_data JSON,
  status ENUM('active', 'used', 'expired', 'cancelled') DEFAULT 'active',
  scanned_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP
);

CREATE INDEX idx_qr_codes_bill ON qr_codes(bill_id);
CREATE INDEX idx_qr_codes_status ON qr_codes(status);
CREATE INDEX idx_qr_codes_expires ON qr_codes(expires_at);
```

---

### 15. on_demand_charges

**Purpose**: Ad-hoc charges for miscellaneous fees

```sql
CREATE TABLE on_demand_charges (
  id SERIAL PRIMARY KEY,
  charge_number VARCHAR(50) UNIQUE NOT NULL,
  payer_id INTEGER REFERENCES users(id),
  payer_name VARCHAR(100),
  fee_description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  status ENUM('active', 'used', 'expired') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP
);

CREATE INDEX idx_charges_payer ON on_demand_charges(payer_id);
CREATE INDEX idx_charges_status ON on_demand_charges(status);
```

---

### 16. audit_logs

**Purpose**: Complete audit trail of all transactions

```sql
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  user_id INTEGER REFERENCES users(id),
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  action ENUM('create', 'read', 'update', 'delete', 'verify', 'approve', 'reject') NOT NULL,
  old_value TEXT,
  new_value TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status ENUM('success', 'failure') DEFAULT 'success',
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_date ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

**Audit Events**:
- LOGIN, LOGOUT
- BILL_CREATED, BILL_UPDATED, BILL_CANCELLED
- PAYMENT_CREATED, PAYMENT_VERIFIED, PAYMENT_FAILED
- RECEIPT_GENERATED, RECEIPT_DELIVERED
- USER_CREATED, USER_ROLE_CHANGED
- FEE_CREATED, FEE_UPDATED
- REPORT_GENERATED, REPORT_EXPORTED

---

### 17. notifications

**Purpose**: Track sent notifications

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  recipient_id INTEGER NOT NULL REFERENCES users(id),
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(200),
  message TEXT NOT NULL,
  channel ENUM('sms', 'email', 'in_app') NOT NULL,
  status ENUM('pending', 'sent', 'failed', 'read') DEFAULT 'pending',
  related_entity_type VARCHAR(50),
  related_entity_id VARCHAR(100),
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created ON notifications(created_at);
```

---

## 🔗 Relationship Diagram

```
users
  ├─→ roles (many-to-one)
  ├─→ departments (many-to-one)
  ├─→ bills (one-to-many, as creator)
  ├─→ payments (one-to-many, as payer)
  └─→ audit_logs (one-to-many, as user)

bills
  ├─→ users (many-to-one, payer)
  ├─→ bill_items (one-to-many)
  ├─→ payments (one-to-many)
  ├─→ qr_codes (one-to-many)
  ├─→ penalties (one-to-many)
  └─→ official_receipts (one-to-many)

bill_items
  ├─→ bills (many-to-one)
  └─→ fees (many-to-one)

payments
  ├─→ bills (many-to-one)
  ├─→ users (many-to-one, payer)
  ├─→ payment_methods (many-to-one)
  ├─→ official_receipts (one-to-one)
  └─→ audit_logs (one-to-many)

fees
  ├─→ fee_categories (many-to-one)
  ├─→ bill_items (one-to-many)
  ├─→ penalty_rules (one-to-many)
  └─→ audit_logs (one-to-many)

penalty_rules
  ├─→ fees (many-to-one)
  └─→ penalties (one-to-many)

penalties
  ├─→ bills (many-to-one)
  └─→ penalty_rules (many-to-one)

qr_codes
  └─→ bills (many-to-one)

official_receipts
  ├─→ payments (many-to-one)
  └─→ bills (many-to-one)

notifications
  └─→ users (many-to-one)
```

---

## ⚡ Indexes & Performance

### Primary Key Indexes
- All tables have primary key index (automatically)

### Foreign Key Indexes
- Created on all foreign keys for faster joins

### Query Optimization Indexes

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_status ON users(role_id, status);

-- Bills
CREATE INDEX idx_bills_payer_status ON bills(payer_id, status);
CREATE INDEX idx_bills_date_range ON bills(bill_date, due_date);
CREATE INDEX idx_bills_status_date ON bills(status, created_at DESC);

-- Payments
CREATE INDEX idx_payments_date_method ON payments(payment_date, payment_method_id);
CREATE INDEX idx_payments_status_date ON payments(status, payment_date DESC);

-- Audit Logs
CREATE INDEX idx_audit_entity_date ON audit_logs(entity_type, entity_id, created_at DESC);

-- Penalties
CREATE INDEX idx_penalties_bill_date ON penalties(bill_id, applied_date);

-- Notifications
CREATE INDEX idx_notifications_user_status ON notifications(recipient_id, status);
```

### Partitioning Strategy (Future Optimization)

**By Date** (for high-volume tables):
```sql
-- Partition payments by month
CREATE TABLE payments_2026_01 PARTITION OF payments
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

---

## 🔒 Constraints & Validations

### NOT NULL Constraints
- Applied to all required fields
- Prevents incomplete data entry

### UNIQUE Constraints
- `users.email`: Prevents duplicate accounts
- `bills.bill_number`: Ensures unique bill references
- `official_receipts.or_number`: COA compliance
- `payments.transaction_id`: Transaction tracking
- `fees.fee_name`: Prevents duplicate fees

### CHECK Constraints

```sql
ALTER TABLE bills
  ADD CONSTRAINT check_bill_amounts
  CHECK (total_amount > 0 AND paid_amount >= 0 AND balance_amount >= 0);

ALTER TABLE payments
  ADD CONSTRAINT check_payment_amount
  CHECK (amount > 0);

ALTER TABLE bills
  ADD CONSTRAINT check_bill_dates
  CHECK (due_date >= bill_date);
```

### Foreign Key Constraints
- ON DELETE CASCADE for child records (bills → bill_items)
- ON DELETE RESTRICT for critical references (fees)

---

## 📝 Prisma Schema

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// User Management
model User {
  id                Int            @id @default(autoincrement())
  email             String         @unique
  passwordHash      String
  firstName         String
  lastName          String
  contactNumber     String
  roleId            Int
  departmentId      Int?
  status            UserStatus     @default(ACTIVE)
  emailVerified     Boolean        @default(false)
  emailVerifiedAt   DateTime?
  lastLoginAt       DateTime?
  lastLoginIp       String?
  twoFaEnabled      Boolean        @default(false)
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  createdById       Int?
  updatedById       Int?
  
  role              Role           @relation(fields: [roleId], references: [id])
  department        Department?    @relation(fields: [departmentId], references: [id])
  bills             Bill[]         @relation("billCreator")
  payments          Payment[]      @relation("payer")
  sessions          Session[]
  auditLogs         AuditLog[]
  
  @@index([email])
  @@index([roleId])
  @@index([status])
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING
}

// Role-Based Access Control
model Role {
  id          Int      @id @default(autoincrement())
  roleName    String   @unique
  description String?
  permissions Json
  users       User[]
}

model Permission {
  id          Int     @id @default(autoincrement())
  name        String  @unique
  description String?
}

// Session Management
model Session {
  id            String   @id @default(uuid())
  userId        Int
  token         String
  refreshToken  String
  ipAddress     String?
  userAgent     String?
  deviceType    String?
  expiresAt     DateTime
  createdAt     DateTime @default(now())
  
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([token])
}

// Department Management
model Department {
  id              Int     @id @default(autoincrement())
  departmentName  String
  departmentHeadId Int?
  contactEmail    String?
  contactPhone    String?
  officeLocation  String?
  active          Boolean @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  users           User[]
}

// Fee Management
model FeeCategory {
  id           Int    @id @default(autoincrement())
  categoryName String
  description  String?
  displayOrder Int    @default(0)
  active       Boolean @default(true)
  createdAt    DateTime @default(now())
  
  fees         Fee[]
}

model Fee {
  id                  Int       @id @default(autoincrement())
  feeName             String
  description         String?
  categoryId          Int
  feeType             FeeType   @default(FIXED)
  baseAmount          Decimal?  @db.Decimal(12, 2)
  unitName            String?
  unitRate            Decimal?  @db.Decimal(12, 2)
  percentageRate      Decimal?  @db.Decimal(5, 2)
  tierConfiguration   Json?
  applicableTo        ApplicableTo @default(BOTH)
  active              Boolean   @default(true)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  createdById         Int?
  updatedById         Int?
  
  category            FeeCategory @relation(fields: [categoryId], references: [id])
  billItems           BillItem[]
  penaltyRules        PenaltyRule[]
}

enum FeeType {
  FIXED
  VARIABLE
  PERCENTAGE
  TIERED
}

enum ApplicableTo {
  INDIVIDUAL
  BUSINESS
  BOTH
}

// Bill Management
model Bill {
  id              Int       @id @default(autoincrement())
  billNumber      String    @unique
  payerId         Int
  billDate        DateTime  @db.Date
  dueDate         DateTime  @db.Date
  totalAmount     Decimal   @db.Decimal(12, 2)
  paidAmount      Decimal   @default(0) @db.Decimal(12, 2)
  balanceAmount   Decimal   @db.Decimal(12, 2)
  penaltyAmount   Decimal   @default(0) @db.Decimal(12, 2)
  discountAmount  Decimal   @default(0) @db.Decimal(12, 2)
  status          BillStatus @default(DRAFT)
  notes           String?
  createdById     Int
  updatedById     Int?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  payer           User      @relation(fields: [payerId], references: [id], name: "billCreator")
  items           BillItem[]
  payments        Payment[]
  penalties       Penalty[]
  qrCodes         QRCode[]
  receipts        OfficialReceipt[]
}

enum BillStatus {
  DRAFT
  ISSUED
  UNPAID
  PARTIALLY_PAID
  PAID
  CANCELLED
  OVERDUE
}

model BillItem {
  id        Int     @id @default(autoincrement())
  billId    Int
  feeId     Int
  feeName   String
  unitCount Decimal? @db.Decimal(10, 2)
  unitPrice Decimal? @db.Decimal(12, 2)
  amount    Decimal @db.Decimal(12, 2)
  createdAt DateTime @default(now())
  
  bill      Bill    @relation(fields: [billId], references: [id], onDelete: Cascade)
  fee       Fee     @relation(fields: [feeId], references: [id])
  
  @@index([billId])
}

// Penalty Management
model PenaltyRule {
  id               Int         @id @default(autoincrement())
  feeId            Int
  penaltyType      PenaltyType
  calculationMethod CalculationMethod
  amountOrRate     Decimal     @db.Decimal(12, 2)
  gracePeriodDays  Int         @default(0)
  maxPenaltyAmount Decimal?    @db.Decimal(12, 2)
  applyMonthly     Boolean     @default(false)
  active           Boolean     @default(true)
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  createdById      Int?
  
  fee              Fee         @relation(fields: [feeId], references: [id])
  penalties        Penalty[]
}

enum PenaltyType {
  LATE
  INTEREST
  SURCHARGE
}

enum CalculationMethod {
  FIXED
  PERCENTAGE
}

model Penalty {
  id               Int         @id @default(autoincrement())
  billId           Int
  penaltyRuleId    Int
  penaltyAmount    Decimal     @db.Decimal(12, 2)
  appliedDate      DateTime    @db.Date
  reason           String?
  createdAt        DateTime    @default(now())
  
  bill             Bill        @relation(fields: [billId], references: [id])
  rule             PenaltyRule @relation(fields: [penaltyRuleId], references: [id])
  
  @@index([billId])
}

// Payment Processing
model PaymentMethod {
  id                  Int     @id @default(autoincrement())
  methodName          String  @unique
  provider            String?
  isActive            Boolean @default(true)
  requiresVerification Boolean @default(false)
  maxTransactionAmount Decimal? @db.Decimal(12, 2)
  minTransactionAmount Decimal? @db.Decimal(12, 2)
  settlementDays      Int?
  transactionFeePercent Decimal? @db.Decimal(5, 2)
  fixedFee            Decimal? @db.Decimal(12, 2)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  payments            Payment[]
}

model Payment {
  id              Int        @id @default(autoincrement())
  transactionId   String     @unique
  billId          Int?
  payerId         Int
  amount          Decimal    @db.Decimal(12, 2)
  paymentMethodId Int
  status          PaymentStatus @default(PENDING)
  referenceNumber String?
  cashierId       Int?
  terminalId      String?
  paymentDate     DateTime
  verifiedAt      DateTime?
  verifiedById    Int?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  
  bill            Bill?      @relation(fields: [billId], references: [id])
  payer           User       @relation(fields: [payerId], references: [id], name: "payer")
  method          PaymentMethod @relation(fields: [paymentMethodId], references: [id])
  receipt         OfficialReceipt?
  auditLogs       AuditLog[]
  
  @@index([billId])
  @@index([payerId])
  @@index([status])
  @@index([paymentDate])
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  CANCELLED
  REFUNDED
}

// Receipt Management
model OfficialReceipt {
  id        Int    @id @default(autoincrement())
  orNumber  String @unique
  receiptId String @unique @default(uuid())
  paymentId Int    @unique
  billId    Int?
  amountPaid Decimal @db.Decimal(12, 2)
  paymentMethod String?
  cashierId Int?
  terminalId String?
  orData    Json?
  status    ReceiptStatus @default(GENERATED)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  payment   Payment @relation(fields: [paymentId], references: [id])
  bill      Bill?   @relation(fields: [billId], references: [id])
  
  @@index([orNumber])
  @@index([paymentId])
}

enum ReceiptStatus {
  GENERATED
  DELIVERED
  PRINTED
  CANCELLED
}

// QR Code Management
model QRCode {
  id            Int      @id @default(autoincrement())
  qrCode        String   @unique @default(uuid())
  billId        Int?
  transactionId String?
  amount        Decimal  @db.Decimal(12, 2)
  feeType       String?
  payerReference String?
  qrImageUrl    String?
  encodedData   Json?
  status        QRStatus @default(ACTIVE)
  scannedCount  Int      @default(0)
  createdAt     DateTime @default(now())
  expiresAt     DateTime
  usedAt        DateTime?
  
  bill          Bill?    @relation(fields: [billId], references: [id])
  
  @@index([billId])
  @@index([status])
  @@index([expiresAt])
}

enum QRStatus {
  ACTIVE
  USED
  EXPIRED
  CANCELLED
}

// On-Demand Charges
model OnDemandCharge {
  id             Int     @id @default(autoincrement())
  chargeNumber   String  @unique
  payerId        Int?
  payerName      String?
  feeDescription String
  amount         Decimal @db.Decimal(12, 2)
  createdById    Int
  status         ChargeStatus @default(ACTIVE)
  createdAt      DateTime @default(now())
  expiresAt      DateTime
  usedAt         DateTime?
  
  payer          User?   @relation(fields: [payerId], references: [id])
  
  @@index([payerId])
  @@index([status])
}

enum ChargeStatus {
  ACTIVE
  USED
  EXPIRED
}

// Audit & Compliance
model AuditLog {
  id              BigInt   @id @default(autoincrement())
  eventType       String
  userId          Int?
  entityType      String
  entityId        String
  action          AuditAction
  oldValue        String?
  newValue        String?
  ipAddress       String?
  userAgent       String?
  status          AuditStatus @default(SUCCESS)
  reason          String?
  createdAt       DateTime @default(now())
  
  user            User?    @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([entityType, entityId])
  @@index([createdAt(sort: Desc)])
  @@index([action])
}

enum AuditAction {
  CREATE
  READ
  UPDATE
  DELETE
  VERIFY
  APPROVE
  REJECT
}

enum AuditStatus {
  SUCCESS
  FAILURE
}

// Notifications
model Notification {
  id                Int      @id @default(autoincrement())
  recipientId       Int
  notificationType  String
  title             String?
  message           String
  channel           NotificationChannel
  status            NotificationStatus @default(PENDING)
  relatedEntityType String?
  relatedEntityId   String?
  sentAt            DateTime?
  readAt            DateTime?
  errorMessage      String?
  createdAt         DateTime @default(now())
  
  recipient         User     @relation(fields: [recipientId], references: [id])
  
  @@index([recipientId])
  @@index([status])
  @@index([createdAt])
}

enum NotificationChannel {
  SMS
  EMAIL
  IN_APP
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
  READ
}
```

---

## ✅ Database Setup Checklist

- [ ] Create NeonDB PostgreSQL database
- [ ] Create `.env` with DATABASE_URL
- [ ] Run `npx prisma migrate dev --name init`
- [ ] Seed initial data (roles, departments, fees)
- [ ] Create indexes for performance
- [ ] Setup automated backups
- [ ] Configure connection pooling
- [ ] Test database connections
- [ ] Verify audit logging
- [ ] Setup replication (if production)

---

**Database Status**: Ready for Implementation  
**Last Updated**: April 28, 2026  
**Version**: 1.0
