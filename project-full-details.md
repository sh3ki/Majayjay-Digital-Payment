# 📊 Project Full Details

**Development of a QR-Enabled Integrated Payment System with Transactional Analytics Dashboard for Government Fees of Majayjay, Laguna**

---

## 📑 Table of Contents

1. [System Overview](#system-overview)
2. [Module Specifications](#module-specifications)
3. [Feature Detailed Specifications](#feature-detailed-specifications)
4. [Database Entities](#database-entities)
5. [API Endpoints](#api-endpoints)
6. [User Workflows](#user-workflows)
7. [Payment Processing](#payment-processing)
8. [Reporting & Analytics](#reporting--analytics)
9. [Security & Compliance](#security--compliance)
10. [Technical Requirements](#technical-requirements)

---

## 🎯 System Overview

### Purpose
To provide a comprehensive, digitized payment collection system for the Local Government Unit of Majayjay, Laguna, enabling seamless, secure, and trackable government fee payments through multiple channels with real-time analytics and reporting capabilities.

### Core Value Propositions
- **Unified Payment Platform**: All payments (cash, digital, QR-based) in one system
- **Real-Time Tracking**: Instant payment confirmation and status updates
- **Revenue Intelligence**: Comprehensive analytics for decision-making
- **Reduced Errors**: Automation eliminates manual entry mistakes
- **Enhanced Accessibility**: Multiple payment channels for convenience
- **Audit Compliance**: Complete transaction trail for regulatory requirements

---

## 🏢 Module Specifications

### 1. Authentication & Access Control Module

#### 1.1 User Registration

**Features:**
- Email & password registration
- Google OAuth (Gmail) integration
- Required information capture:
  - Full name
  - Contact number
  - Email address
  - Password (min 8 characters, mix of uppercase, lowercase, numbers, special chars)
  - User role selection
- Email verification via verification link
- Terms and conditions acceptance
- Security questions setup (optional backup)

**User Stories:**
- US001: Resident can register with email and password
- US002: User can register via Google Single Sign-On
- US003: User receives verification email with unique link
- US004: System prevents duplicate email registration

**Validation Rules:**
- Email format validation
- Password strength requirements
- Contact number format validation
- Name length requirements (min 2, max 100 characters)
- Duplicate email check

---

#### 1.2 User Login

**Features:**
- Email/password login
- Google OAuth login
- Remember me functionality
- Forgot password recovery via email
- Account lockout after 5 failed attempts (15-minute lock)
- Session timeout after 30 minutes of inactivity
- Multi-device session management
- Login attempt logging

**User Stories:**
- US005: User can login with email and password
- US006: User can login via Google account
- US007: User receives password reset email with token
- US008: User account is locked after multiple failed attempts

**Security Measures:**
- Password encryption (bcrypt with salt rounds: 10)
- JWT token generation (expires in 1 hour)
- Refresh token handling (expires in 7 days)
- Secure cookie storage
- CSRF protection

---

#### 1.3 User Roles & Permissions

**Roles Definition:**

##### Admin
- Full system access
- User management (create, edit, delete, deactivate)
- Fee configuration
- Penalty rule setup
- System settings & configuration
- View all reports and analytics
- Access audit logs
- Manage payment channels
- Override transaction statuses

**Permissions:**
```
users.* (create, read, update, delete)
fees.* (create, read, update, delete)
bills.* (create, read, update, delete)
payments.* (create, read, update, delete)
reports.* (create, read, export)
settings.* (read, update)
audit_logs.* (read)
```

##### Cashier
- Cash payment recording
- QR code generation
- Transaction search & lookup
- Daily reports
- Payment verification
- Customer assistance

**Permissions:**
```
payments.create (cash payments)
payments.read (own transactions)
bills.read (search and view)
qr_codes.create
receipts.generate
reports.daily (own terminal)
```

##### Department Viewer
- View department collections
- Department-specific reports
- Performance tracking
- No transaction modification

**Permissions:**
```
reports.read (department specific)
bills.read (department bills)
payments.read (department payments)
analytics.read (department data)
```

##### Resident/Taxpayer
- View own bills
- Online payment
- Payment history
- Receipt download
- Profile management

**Permissions:**
```
bills.read (own bills)
payments.create (own bills)
payments.read (own payments)
profile.read, profile.update (own profile)
receipts.download (own receipts)
```

---

#### 1.4 Session Management

**Features:**
- JWT-based authentication
- Refresh token mechanism
- Session timeout handling
- Multi-device login support
- Logout with session cleanup
- Remember me functionality (14-day extended session)
- IP address logging
- Device fingerprinting (optional)

---

### 2. Fee & Billing Management Module

#### 2.1 Fee Setup & Configuration

**Fee Types:**
- Real Property Tax (RPT)
- Cedula (Community Tax Certificate)
- Business Tax
- Water Utility
- Electricity Utility
- Barangay Fees
- Environmental Fees
- Business Permits
- Professional Licenses
- Miscellaneous Fees
- Custom fees (admin-defined)

**Fee Attributes:**
- Fee ID (unique identifier)
- Fee name
- Fee description
- Fee category
- Base amount (fixed) OR unit-based calculation
- Applicable to: Individual / Business / Both
- Active status (enable/disable)
- Date created
- Last modified date

**Fee Calculation Types:**

1. **Fixed Amount**
   - Same amount for all payers
   - Example: P500 annual cedula

2. **Unit-Based (Variable)**
   - Amount per unit
   - Example: Water bill = Base charge + (Cubic meters × Rate)

3. **Percentage-Based**
   - Percentage of a value
   - Example: Business tax = 1% of annual revenue

4. **Tiered Calculation**
   - Different rates based on ranges
   - Example: Progressive tax rates

**Database Fields:**
```
fees:
- id (PK)
- name
- description
- category
- fee_type (fixed/variable/percentage/tiered)
- base_amount (nullable)
- unit_name (nullable - e.g., "cubic meter")
- unit_rate (nullable)
- percentage_rate (nullable)
- tier_config (JSON - for tiered fees)
- applicable_to (individual/business/both)
- active (boolean)
- created_at
- updated_at
- created_by (Admin ID)
- updated_by (Admin ID)
```

**User Stories:**
- US101: Admin can create new fee type
- US102: Admin can edit fee configuration
- US103: Admin can enable/disable fees
- US104: System calculates correct amount based on fee type

---

#### 2.2 Bill Generation

**Bill Creation Methods:**

1. **Individual Bill Creation**
   - Admin/Cashier searches for resident
   - Selects applicable fees
   - System calculates amount
   - Bill created and assigned reference number

2. **Batch Bill Generation**
   - Admin selects fee type
   - System identifies all applicable payers
   - Generates bills for all
   - Email/SMS notification sent

3. **Recurring Bills**
   - Setup for annual/monthly fees
   - System auto-generates on schedule
   - Notification sent to payer

**Bill Attributes:**
- Bill ID (unique reference number)
- Payer name & ID
- Bill date
- Due date
- Items (fees with amounts)
- Subtotal
- Penalties (if applicable)
- Discounts (if applicable)
- Total amount due
- Payment status (Unpaid/Partially Paid/Paid)
- Notes
- QR code for payment

**Bill Status Tracking:**
- **DRAFT** - Not yet finalized
- **ISSUED** - Sent to payer
- **UNPAID** - Not paid yet
- **PARTIALLY PAID** - Part payment received
- **PAID** - Full payment received
- **CANCELLED** - Canceled/void
- **OVERDUE** - Past due date, unpaid

**Database Fields:**
```
bills:
- id (PK)
- bill_number (unique, sequential)
- payer_id (FK to users)
- bill_date
- due_date
- total_amount
- paid_amount (default 0)
- penalty_amount (default 0)
- discount_amount (default 0)
- status (enum)
- created_by (Admin/Cashier ID)
- notes
- created_at
- updated_at

bill_items:
- id (PK)
- bill_id (FK)
- fee_id (FK)
- fee_name
- unit_count (nullable, for variable fees)
- unit_price (nullable)
- amount
- created_at
```

**User Stories:**
- US201: Admin can create individual bill
- US202: System auto-calculates bill amount
- US203: Payer receives bill notification
- US204: System tracks bill status changes
- US205: Admin can void/cancel bill

---

#### 2.3 On-Demand Charges

**Features:**
- Quick charge creation for immediate payments
- Custom amount entry
- Multiple fees in single charge
- Used for miscellaneous/emergency fees
- Instant QR code generation
- Immediate payment processing capability

**Process:**
1. Cashier/Admin selects "Create On-Demand Charge"
2. Enters payer name or ID
3. Selects or manually enters fee amount
4. System generates charge ID and QR code
5. Charge available for immediate payment
6. Status tracked in system

**Database Fields:**
```
on_demand_charges:
- id (PK)
- charge_number (unique)
- payer_id (FK, nullable - for walk-ins)
- payer_name (for walk-ins)
- fee_description
- amount
- created_by (Admin/Cashier ID)
- status (active/used/expired)
- expires_at (24 hours from creation)
- created_at
```

---

### 3. Penalty & Auto-Calculation Engine Module

#### 3.1 Penalty Rules Configuration

**Penalty Types:**

1. **Late Payment Penalty**
   - Applied after due date
   - Options: Fixed amount OR Percentage of bill amount
   - Examples:
     - P100 flat penalty after 30 days
     - 5% of bill amount after 60 days

2. **Monthly Interest**
   - Recurring penalty for extended overdue
   - Typically 2% per month
   - Applied on balance, not total

3. **Surcharges**
   - Additional charges for specific fees
   - Example: 25% surcharge on business tax if late

4. **Compound Penalties**
   - Multiple penalties applied
   - Penalty on penalty calculation

**Penalty Attributes:**
- Penalty ID
- Fee type (applicable to which fees)
- Penalty type (late/interest/surcharge)
- Amount (fixed) or Rate (percentage)
- Grace period (days before applying penalty)
- Maximum penalty cap (if any)
- Active status
- Date created

**Database Fields:**
```
penalty_rules:
- id (PK)
- fee_id (FK)
- penalty_type (late/interest/surcharge)
- calculation_method (fixed/percentage)
- amount_or_rate (decimal)
- grace_period_days (integer)
- max_penalty_amount (nullable)
- active (boolean)
- created_at
- updated_at
- created_by (Admin ID)
```

#### 3.2 Penalty Calculation Engine

**Calculation Logic:**

```python
def calculate_penalties(bill, current_date):
    penalties = 0
    
    if current_date > bill.due_date:
        days_overdue = (current_date - bill.due_date).days
        
        # Late payment penalty
        late_penalty_rule = get_penalty_rule(bill.fee_id, 'late')
        if late_penalty_rule and days_overdue > late_penalty_rule.grace_period:
            if late_penalty_rule.calculation_method == 'fixed':
                penalties += late_penalty_rule.amount
            else:  # percentage
                penalties += (bill.amount * late_penalty_rule.rate) / 100
        
        # Monthly interest
        monthly_interest_rule = get_penalty_rule(bill.fee_id, 'interest')
        if monthly_interest_rule:
            months_overdue = days_overdue / 30
            penalties += (bill.amount * monthly_interest_rule.rate * months_overdue) / 100
        
        # Cap maximum penalty if set
        if late_penalty_rule.max_penalty_amount:
            penalties = min(penalties, late_penalty_rule.max_penalty_amount)
    
    return penalties
```

**Real-Time Calculation:**
- Penalties calculated when bill is viewed
- Penalties calculated when payment is initiated
- Penalties displayed transparently to payer
- Payment breakdown shows base amount + penalties

**Database Fields:**
```
bill_penalties:
- id (PK)
- bill_id (FK)
- penalty_rule_id (FK)
- penalty_amount (calculated)
- applied_date
- reason (text description)
```

**User Stories:**
- US301: System auto-calculates penalties for overdue bills
- US302: Payer sees penalty breakdown before payment
- US303: Admin can configure penalty rules
- US304: Penalty calculation is transparent and auditable

---

### 4. QR Code Payment System Module

#### 4.1 QR Code Generation

**QR Code Content:**
```
{
  "transaction_id": "TXN_20260428_001",
  "amount": 5000.50,
  "currency": "PHP",
  "fee_type": "Real Property Tax",
  "payer_reference": "RPT_2024_001",
  "due_date": "2026-05-31",
  "system_id": "MAJAYJAY_LGU",
  "payment_url": "https://system.lgu.gov.ph/pay/TXN_20260428_001"
}
```

**QR Code Specifications:**
- Format: QR Code (ISO/IEC 18004)
- Error Correction Level: High (30% recovery)
- Size: Scalable (typically 200x200 pixels minimum)
- Color: Black code on white background
- Timestamp included for tracking
- Unique identifier for audit purposes

**QR Encoding:**
- Data encoded as JSON
- Base64 encoding for URL transmission
- Session-specific tokens for security

**Database Fields:**
```
qr_codes:
- id (PK)
- qr_code (UUID)
- bill_id (FK, nullable)
- transaction_id
- amount
- fee_type
- payer_reference
- encoded_data (JSON)
- qr_image_url
- status (active/used/expired)
- created_at
- used_at (nullable)
- expires_at (24 hours from creation)
- scanned_count (for analytics)
```

**User Stories:**
- US401: System generates unique QR code for each transaction
- US402: QR code contains correct payment information
- US403: QR code expires after 24 hours
- US404: QR code can be regenerated if needed

---

#### 4.2 QR Code Payment Flow

**Step 1: QR Display**
- Frontend displays QR code prominently
- QR includes transaction details
- User can scan with any QR scanner + mobile wallet
- Alternative: Manual payment URL option

**Step 2: Wallet Integration**
- User opens GCash/Maya app
- Scans QR code
- App recognizes payment details
- User selects payment source (if multiple)

**Step 3: Payment Processing**
- Mobile wallet initiates payment
- PayMongo processes transaction
- 2FA or OTP verification (if required by wallet)
- Payment confirmation sent back

**Step 4: Webhook Notification**
- PayMongo sends webhook to backend
- Backend verifies payment details
- Bill status updated to PAID
- Official Receipt generated
- User notifications triggered

**Step 5: Confirmation**
- Frontend receives real-time update
- Success page displayed
- Receipt options presented (email, SMS, download)
- User can print or share receipt

---

#### 4.3 Supported Payment Methods

**GCash Integration:**
- Mobile wallet (PSEA-regulated)
- QR scanning capability
- SMS notifications to user
- Transaction limits (standard GCash limits apply)
- Settlement time: T+1 day

**Maya Integration:**
- Mobile wallet (formerly Paymaya)
- QR scanning capability
- Email confirmations
- Security features (PIN, OTP)
- Settlement time: T+1 day

**PayMongo Gateway:**
- Acts as unified payment processor
- Handles payment intent creation
- Manages webhook callbacks
- Provides transaction security
- Offers reconciliation reports

---

### 5. Cash Payment Recording Module

#### 5.1 Cashier Terminal Interface

**Terminal Features:**
- User-friendly search interface
- Quick access to common functions
- Real-time status display
- Transaction history on terminal
- Shift management
- Cash handling tools

**Terminal Functions:**
1. **Search & View Bill**
   - Search by: Payer name, reference number, ID
   - Display bill details and amount due
   - Show payment history
   - Display current penalties

2. **Record Payment**
   - Enter payment amount
   - Select payment method (cash, voucher)
   - Record receipt number (manual OR/pre-printed)
   - Apply discounts/adjustments (admin approval)
   - Generate Official Receipt
   - Print receipt for payer

3. **Assisted Digital Payment**
   - Generate QR code for walk-in
   - Display on terminal screen
   - Payer scans with their phone
   - Process payment in real-time
   - Receive confirmation at terminal

4. **Quick Transaction**
   - On-demand charge creation
   - Payer name entry
   - Amount entry
   - Generate QR for immediate payment
   - Record payment when completed

**Terminal Settings:**
- Terminal ID assignment
- Shift start/end logging
- Cash count verification
- Daily closeout reporting
- User assignment to terminal

**Database Fields:**
```
cashier_terminals:
- id (PK)
- terminal_name
- terminal_code (unique)
- cashier_id (current assigned)
- location
- status (active/inactive)
- created_at

cashier_sessions:
- id (PK)
- terminal_id (FK)
- cashier_id (FK)
- shift_date
- shift_start_time
- shift_end_time (nullable)
- opening_cash_amount
- closing_cash_amount (nullable)
- transactions_count
```

**User Stories:**
- US501: Cashier can search for payer bills
- US502: Cashier can record cash payment
- US503: Cashier can generate QR for walk-in payer
- US504: System creates receipt automatically
- US505: All transactions logged for audit

---

#### 5.2 Digital Recording of Cash Payments

**Recording Process:**
1. Cashier searches payer
2. Views outstanding bills
3. Confirms payment amount (including penalties)
4. Enters amount received
5. Calculates change (if any)
6. Selects OR (Official Receipt) number
7. System records transaction with timestamp
8. Receipt generated immediately
9. Transaction synced to central database

**Automatic Logging:**
- Transaction ID generated
- Timestamp recorded
- Cashier ID linked
- Terminal ID recorded
- Payment method (Cash) recorded
- Amount recorded
- Payer information linked
- Receipt number assigned
- Status marked as PAID

**Receipt Generation:**
- Printed immediately
- Contains: OR number, date, amount, method, balance
- Signed/stamped by cashier (if required)
- Copy retained for audit
- Payer receives physical receipt

---

#### 5.3 Reconciliation

**Daily Reconciliation:**
- Cashier performs end-of-shift reconciliation
- System provides transaction list for shift
- Counts physical cash received
- Compares with system total
- Reconciliation report generated
- Discrepancies flagged
- Supervisor approval required for variances

**Monthly Reconciliation:**
- Admin generates reconciliation report
- Matches cash submitted vs system records
- Identifies unresolved discrepancies
- Generates audit trail
- Forwarded to finance department

---

### 6. Official Receipt (OR) System Module

#### 6.1 Receipt Generation

**OR Details:**
- Sequential numbering system
- Unique OR number per transaction
- Receipt ID (system-generated, different from OR)
- Date and time of payment
- Payer name and identification
- Payment breakdown:
  - Base amount
  - Penalties (if any)
  - Discounts (if any)
  - Total paid
- Payment method
- Change amount (for cash)
- Cashier name/ID
- Terminal information
- QR code linking to receipt verification
- Footer: Municipality info, contact

**Receipt Format:**
```
═══════════════════════════════════════════
    MUNICIPAL GOVERNMENT OF MAJAYJAY
       OFFICIAL RECEIPT (OR)
═══════════════════════════════════════════
OR Number: OR-2026-04-28-001
Receipt ID: RCP_20260428_001
Date/Time: April 28, 2026 10:30 AM

─────────────────────────────────────────
PAYER INFORMATION:
Name: Juan Dela Cruz
ID Reference: RPT_2024_001
─────────────────────────────────────────

PAYMENT DETAILS:
Real Property Tax 2024 ........... P5,000.00
Late Payment Penalty ............. P  250.00
─────────────────────────────────────────
SUBTOTAL ......................... P5,000.00
PENALTIES ........................ P  250.00
DISCOUNT ......................... P   -0.00
─────────────────────────────────────────
TOTAL AMOUNT PAID ................ P5,250.00

PAYMENT METHOD: GCASH
─────────────────────────────────────────

Processing Officer: Maria Santos (Cashier)
Terminal: TERMINAL_01
Status: PAID

For inquiries contact:
LGU Majayjay - Finance Department
Phone: (XXX) XXX-XXXX

[QR Code]
Verify receipt: https://system.lgu.gov.ph/receipt/verify/RCP_20260428_001
═══════════════════════════════════════════
```

**OR Numbering System:**
- Format: OR-YYYY-MM-DD-SEQUENCE
- Sequential within same day
- Reset at end of day
- No gaps allowed (audit requirement)
- Pre-printed ORs logged in system

**Database Fields:**
```
official_receipts:
- id (PK)
- or_number (unique)
- receipt_id (UUID, unique)
- payment_id (FK)
- payer_name
- payer_id (FK)
- payment_method
- amount_paid
- penalties_applied
- discount_applied
- change_amount (for cash)
- items (JSON - line items)
- cashier_id (FK)
- terminal_id (FK)
- created_at
- issued_at
- qr_verification_code
- status (generated/delivered/printed)
```

---

#### 6.2 Receipt Delivery Methods

**Digital Delivery:**

1. **Email**
   - PDF attachment
   - Sent immediately after payment
   - Contains verification QR code
   - Archivable by recipient
   - Reply-to support email

2. **SMS**
   - Text message with receipt number
   - Transaction summary (amount, date, reference)
   - Link to download full receipt
   - Sent within 1 minute of payment

3. **Download**
   - Payer can download from portal
   - PDF format
   - Search by date range or receipt number
   - Bulk download capability
   - Export to Excel option

**Physical Delivery:**

1. **Printed Copy**
   - Generated at cashier terminal
   - Handed to payer immediately
   - Carbon copy retained (if using pre-printed ORs)
   - Filed by cashier for shift records

**User Stories:**
- US601: Receipt generated automatically after payment
- US602: Payer receives receipt via email
- US603: Payer receives SMS confirmation
- US604: Payer can download receipt from portal
- US605: Receipt contains all required information for audit

---

#### 6.3 Receipt Verification & Compliance

**Receipt Verification:**
- Public verification portal
- Enter receipt number or OR number
- System displays receipt details (payment status, date, amount)
- Shows verification QR code
- Useful for disputes/inquiries

**Compliance Features:**
- Sequential OR tracking prevents gaps
- Receipt number history maintained
- Cancellation logged with reason
- Re-issuance tracked
- COA-ready report generation
- BIR-compliant format and numbering

**Cancellation & Re-issue:**
- Original receipt canceled (marked void)
- Reason recorded
- Admin approval required
- New receipt issued with notation
- Audit trail maintained

---

### 7. Transaction & Payer Lookup Module

#### 7.1 Search Functionality

**Search Parameters:**

1. **By Payer Name**
   - Auto-complete suggestions
   - Partial matching
   - Fuzzy search
   - Case-insensitive
   - Results: All related payers

2. **By Reference Number**
   - RPT reference
   - CTC/Cedula number
   - Business registration number
   - Barangay ID
   - Exact match required

3. **By Receipt/OR Number**
   - Search previous receipts
   - View payment details
   - Verify receipt authenticity

4. **By Transaction ID**
   - Direct transaction lookup
   - Full transaction details
   - Payment method used

**Search Results Display:**
- Payer name
- ID/Reference number
- Total outstanding balance
- Last payment date
- Number of unpaid bills
- Quick action buttons (pay, view details)

**User Stories:**
- US701: User can search by payer name
- US702: User can search by reference number
- US703: System returns matching results quickly
- US704: User can view complete payer profile

---

#### 7.2 Payer Profile

**Profile Information:**
- Full name
- Contact number
- Email address
- Address
- ID/Reference numbers (RPT, CTC, etc.)
- Business information (if applicable)
- Registration date

**Profile Statistics:**
- Total amount paid (lifetime)
- Current outstanding balance
- Number of paid transactions
- Number of unpaid bills
- Last payment date
- Payment method preference
- Average payment time

**Transaction History Display:**
- Table with sortable columns:
  - Date
  - Bill reference
  - Fee type
  - Amount
  - Payment method
  - Status
  - OR number
- Filter options:
  - Date range
  - Fee type
  - Payment status
- Pagination (20 results per page)
- Export to Excel/PDF

**User Stories:**
- US705: Payer profile shows all relevant information
- US706: Transaction history displays with filtering
- US707: User can export transaction history

---

#### 7.3 Pending Balances

**Balance Display:**
- Current outstanding amount
- Itemized list of unpaid bills
- Due date for each bill
- Penalties applied
- Days overdue (if applicable)
- Quick pay button for each bill

**Balance Notification:**
- SMS reminder: 7 days before due date
- SMS reminder: On due date
- Email reminder: 3 days after due date (if unpaid)
- Email notification: Weekly for large balances (>P10,000)

---

### 8. Notifications & Alerts Module

#### 8.1 Notification Types

**Payment Reminders:**
- **Pre-due reminder**: 7 days before due date
  - Channel: SMS + Email
  - Content: Bill summary, due date, quick pay link
  - Frequency: Once

- **Due date reminder**: On due date
  - Channel: SMS
  - Content: Final reminder, payment details
  - Frequency: Once

- **Overdue reminders**: 3, 7, 14, 30 days after due date
  - Channel: SMS + Email
  - Content: Penalty details, urgency message
  - Frequency: Multiple

**Payment Confirmations:**
- Immediate after payment
- Channel: SMS + Email
- Content: Amount, date, OR number, receipt download link
- Includes verification details

**System Notifications:**
- Account updates
- Password changes
- New bill issued
- Bill cancellation (if applicable)
- Penalty application (for overdue)

**Alert Types:**
- Successful payment: Green
- Overdue payment: Red
- Pending payment: Yellow
- System maintenance: Blue

#### 8.2 Notification Channels

**SMS Gateway:**
- Provider: [To be configured] (e.g., Twilio, Semaphore)
- Format: Plain text, max 160 characters
- Delivery: Within 2 minutes
- Retry: Up to 3 attempts
- Cost: Per message

**Email Service:**
- Provider: [To be configured] (e.g., SendGrid, AWS SES)
- Format: HTML template
- Delivery: Within 5 minutes
- Attachments: Receipt PDF
- Retry: Up to 24 hours

**In-App Notifications:**
- Real-time status updates
- Push notifications (mobile app future feature)
- Dashboard notifications
- Notification center/history

**User Preferences:**
- Opt-in/opt-out by notification type
- Channel preferences (SMS, email, both)
- Frequency settings
- Quiet hours (no notifications between 8 PM - 6 AM)

**Database Fields:**
```
notifications:
- id (PK)
- recipient_id (FK to users)
- notification_type
- title
- message
- channel (sms/email/in-app)
- status (pending/sent/failed)
- created_at
- sent_at (nullable)
- read_at (nullable)

notification_templates:
- id (PK)
- template_name
- template_type (reminder/confirmation/alert)
- subject (for email)
- body (template with variables)
- variables (JSON - dynamic fields)
- created_by (Admin)
```

**User Stories:**
- US801: Payer receives payment reminder before due date
- US802: Payer receives confirmation after payment
- US803: Payer can opt-out of notifications
- US804: Admin can customize notification templates

---

### 9. Reporting & Analytics Dashboard Module

#### 9.1 Executive Dashboard

**Dashboard Widgets (Admin View):**

1. **Key Performance Indicators (KPIs)**
   ```
   ┌─────────────────────────────────────┐
   │ Total Collection (This Month)      │
   │         ₱ 2,450,750.00             │
   │         ↑ 12.5% from last month    │
   ├─────────────────────────────────────┤
   │ Total Outstanding Balance          │
   │         ₱   890,200.00             │
   │         ↑ 5.2% from last month     │
   ├─────────────────────────────────────┤
   │ Payment Success Rate               │
   │           95.8%                    │
   │         ↓ 2.1% from last month     │
   ├─────────────────────────────────────┤
   │ Average Processing Time            │
   │          12.5 seconds              │
   │         ↓ 2.3 seconds improvement  │
   └─────────────────────────────────────┘
   ```

2. **Collection Trends (Line Chart)**
   - X-axis: Date (daily, weekly, monthly)
   - Y-axis: Collection amount
   - Multiple series: By fee type or department
   - Interactive legend
   - Hover for details

3. **Collection by Payment Method (Pie Chart)**
   - Cash vs Digital breakdown
   - Percentage and absolute values
   - Hover for details
   - Click to filter

4. **Top Fee Categories (Bar Chart)**
   - Fee type vs collection amount
   - Top 5-10 displayed
   - Sortable
   - Drill-down capability

5. **Department Performance (Table)**
   - Department name
   - Target collection
   - Actual collection
   - Percentage vs target
   - Trend indicator

6. **Recent Transactions (List)**
   - Latest 10 transactions
   - Quick view details
   - Search capability

#### 9.2 Collection Reports

**Report Types:**

1. **Daily Collection Report**
   - Date range: Single day
   - Details: All transactions for day
   - Summary: Total by payment method
   - Grouped by department
   - Officer-wise summary

2. **Weekly Collection Report**
   - Date range: 7 days
   - Daily breakdown
   - Cumulative totals
   - Comparison with previous week
   - Trend analysis

3. **Monthly Collection Report**
   - Date range: Full calendar month
   - By-day detail
   - Summary by fee type
   - Summary by department
   - Comparison with target
   - Year-over-year comparison

4. **Annual Collection Report**
   - Monthly breakdown
   - Cumulative trends
   - Fee type analysis
   - Department comparison
   - Target vs actual

**Revenue Breakdown:**

1. **By Fee Category**
   - RPT collections
   - Cedula collections
   - Business tax collections
   - Utility collections
   - Other fee collections
   - With percentages and trends

2. **By Office/Department**
   - Finance Department
   - Assessor's Office
   - Planning & Development
   - Engineering Office
   - Each with collection details

3. **By Payment Method**
   - Cash transactions
   - GCash transactions
   - Maya transactions
   - Combined statistics
   - Channel performance

4. **By Payer Status**
   - Individual payers
   - Business payers
   - Comparison

#### 9.3 Export Options

**Export Formats:**

1. **Excel (.xlsx)**
   - Multiple sheets (summary, detail, charts)
   - Formatting and formulas
   - Pivot tables
   - Charts embedded
   - Ready for further analysis

2. **CSV (.csv)**
   - Tab-delimited data
   - Quoted fields
   - Unicode support
   - Easy import to any tool

3. **PDF (.pdf)**
   - Professional formatting
   - Charts and images
   - Header and footer
   - Pagination
   - Digital signature support

**Export Customization:**
- Select columns to include
- Date range selection
- Filtering by department/fee type
- Grouping options
- Sorting preferences
- Chart inclusion option

**User Stories:**
- US901: Admin can view executive dashboard
- US902: Dashboard displays accurate KPIs
- US903: User can generate collection reports
- US904: User can export reports in multiple formats

---

### 10. Unified Transaction Ledger Module

#### 10.1 Ledger Architecture

**Ledger Purpose:**
- Single source of truth for all transactions
- Real-time updates across all interfaces
- Eliminates data silos
- Ensures consistency
- Provides audit trail

**Ledger Fields:**
```
transaction_ledger:
- id (PK)
- transaction_id (unique)
- transaction_type (payment/reversal/adjustment)
- payer_id (FK)
- bill_id (FK, nullable)
- payment_method (cash/gcash/maya)
- amount (transacted)
- date_time
- cashier_id (FK, nullable)
- terminal_id (FK, nullable)
- receipt_number (OR number)
- status (completed/pending/failed)
- notes
- created_at
- synced_at (timestamp when synced to central DB)

transaction_details:
- id (PK)
- transaction_id (FK)
- breakdown (JSON):
  - base_amount
  - penalties
  - discounts
  - total
- metadata (device, IP, location)
```

#### 10.2 Ledger Synchronization

**Real-Time Sync:**
- Cashier terminal records transaction
- Transaction immediately sent to central database
- 99.9% uptime guarantee
- Redundancy for offline mode (queued sync when online)
- Conflict resolution for simultaneous updates

**Database Replication:**
- Master-slave replication
- NeonDB handles replication
- Backup automatic daily
- Point-in-time recovery capability

**Ledger Reconciliation:**
- Hourly automatic reconciliation
- Cashier terminal ↔ Central database
- Department portal ↔ Central database
- Alert if discrepancies found
- Admin dashboard shows sync status

**User Stories:**
- US1001: All payments appear in unified ledger
- US1002: Ledger syncs in real-time across terminals
- US1003: No duplicate or missing records
- US1004: Ledger reconciliation automatic

---

### 11. Audit Trail & Security Module

#### 11.1 Audit Logging

**Events Logged:**
1. User Actions
   - Login/logout (with timestamp, IP)
   - User role changes
   - Permission changes
   - Account modifications

2. Transaction Events
   - Transaction creation
   - Transaction status changes
   - Receipt generation
   - Payment processing
   - Refunds/reversals

3. System Events
   - Fee configuration changes
   - Penalty rule changes
   - Payment method enabling/disabling
   - System maintenance
   - Error occurrences

4. Data Access
   - Report generation
   - Data export
   - Database queries
   - File downloads

**Audit Log Fields:**
```
audit_logs:
- id (PK)
- event_type
- user_id (FK, nullable - for system events)
- entity_type (user/transaction/bill/fee)
- entity_id
- action (create/read/update/delete)
- old_value (nullable, for updates)
- new_value (nullable, for updates)
- timestamp
- ip_address
- user_agent
- status (success/failure)
- reason (for failures or special actions)
```

**Audit Log Retention:**
- Retained for minimum 7 years (compliance requirement)
- Immutable once created (cannot be edited or deleted)
- Encrypted storage
- Regular backups
- Archive after 1 year

#### 11.2 Security Measures

**Authentication Security:**
- Password minimum 8 characters
- Mix of uppercase, lowercase, numbers, special characters
- No repeated characters (max 2)
- Not similar to username/email
- Password history: Cannot repeat last 5 passwords
- Expiration: Every 90 days (reminder at 80 days)
- Failed attempts: Lockout after 5 failed attempts for 15 minutes

**Session Security:**
- Session timeout: 30 minutes of inactivity
- Simultaneous session limit: 1 per device type
- Token expiration: 1 hour (with refresh token)
- Secure cookie storage: HttpOnly, Secure flags
- CSRF protection: Token-based

**Data Encryption:**
- In transit: HTTPS/TLS 1.2+
- At rest: Database encryption at field level for sensitive data
- Passwords: bcrypt with salt (rounds: 10)
- API keys: Encrypted in environment
- Personal data: Masked in logs (e.g., last 4 digits of ID only)

**API Security:**
- Rate limiting: 100 requests per minute per IP
- CORS: Restricted to known domains
- API authentication: JWT tokens
- Payload validation: JSON schema validation
- SQL injection prevention: Parameterized queries (Prisma)
- XSS prevention: Input sanitization, output encoding

**Payment Security:**
- PCI DSS compliance
- Never store payment card details
- PayMongo handles payment processing
- Webhook signature verification
- Transaction encryption
- Amount verification before processing

**Infrastructure Security:**
- Firewall rules
- DDoS protection
- Intrusion detection
- Regular security audits
- Vulnerability scanning
- Penetration testing (quarterly)

**Access Control:**
- Role-based access control (RBAC)
- Principle of least privilege
- Admin must approve high-risk actions
- Two-factor authentication (optional for admin)
- IP whitelisting (optional for sensitive roles)

**User Stories:**
- US1101: System logs all transactions with audit trail
- US1102: Audit logs cannot be modified
- US1103: Admin can view audit logs and reports
- US1104: System prevents unauthorized access
- US1105: Data encrypted both in transit and at rest

---

### 12. Department-Based Tracking Module

#### 12.1 Department Management

**Department Structure:**
- Finance Department (Primary)
- Assessor's Office (RPT collections)
- City Treasurer's Office (General collections)
- Planning & Development Office
- Engineering Office
- Other specialized departments

**Department Attributes:**
- Department ID (unique)
- Department name
- Head name
- Contact information
- Email
- Location/Office number
- Active status

**Department Permissions:**
- View own collections only
- Cannot view other departments' data
- Can generate own reports
- Can manage own staff
- Cannot modify system settings

#### 12.2 Collection Tracking by Department

**Department Dashboard:**
- Total collected (MTD, YTD)
- Target vs actual
- Breakdown by fee type
- Payment method breakdown
- Outstanding balance
- Performance metrics

**Department Reports:**
- Daily summary
- Weekly summary
- Monthly summary
- Year-to-date analysis
- Comparison with other departments
- Trend analysis

**Staff Assignment:**
- Department head
- Cashiers assigned to department
- Permission levels
- Shift assignments
- Performance tracking

**User Stories:**
- US1201: Department viewer sees only own data
- US1202: Department head can view staff performance
- US1203: Central admin can compare departments
- US1204: Department reports exportable

---

### 13. Multi-Channel Payment Access Module

#### 13.1 Online Portal

**Portal Features:**

1. **Bill Viewing**
   - List all bills (paid and unpaid)
   - Filter by date, status, fee type
   - Sort by date, amount, due date
   - Details view for each bill
   - Penalty display (if applicable)
   - Print/download bill

2. **Payment Processing**
   - Select bill to pay
   - System displays QR code
   - Manual payment option
   - Select payment method
   - Confirm payment details
   - Secure payment processing
   - Instant confirmation

3. **Receipt Management**
   - Download receipts
   - Email receipt
   - Search receipts
   - Print receipt
   - Receipt verification

4. **Account Management**
   - Profile editing
   - Password change
   - Notification preferences
   - Contact information update
   - Payment method preferences

5. **Transaction History**
   - View all past payments
   - Filter by date range
   - Export to Excel
   - Detailed transaction view
   - Receipt links

**Portal Access:**
- Email/password login
- Google OAuth option
- Forgot password recovery
- Account creation for new users
- Mobile-responsive design

#### 13.2 Cashier Terminal

**Terminal Access:**
- Physical touchscreen terminal
- Web-based interface (accessible from any computer)
- User authentication required
- Shift management (login/logout)
- Transaction recording
- Receipt printing

**Supported Functions:**
- Payment recording (cash, digital)
- QR generation for customers
- Quick balance lookup
- Receipt reprinting
- Daily reconciliation
- Quick transaction lookup

#### 13.3 QR Code Payment (Anywhere)

**QR Scanning:**
- Mobile user scans QR code
- Links to payment page
- PayMongo payment gateway
- Mobile wallet selection
- 2FA/OTP if required
- Payment confirmation
- Receipt delivery

**QR Code Variations:**
- Static QR (bill-specific)
- Dynamic QR (generated at terminal)
- Session-based QR (expires after 24 hours)
- Reusable QR (for repeated payments)

**User Stories:**
- US1301: Resident can pay online via portal
- US1302: Resident can pay via QR code scan
- US1303: Cashier can process payments at terminal
- US1304: Multiple channels available simultaneously

---

### 14. Real-Time System Features Module

#### 14.1 Instant Payment Confirmation

**Confirmation Flow:**
1. Payment processed by PayMongo
2. Webhook received by backend (< 1 second)
3. Database updated
4. WebSocket message sent to frontend
5. UI updated with success message
6. Receipt displayed to user
7. Total notification sent via SMS/email

**Confirmation Details:**
- Transaction ID
- Amount paid
- Date & time
- Receipt number
- Payment method
- Payer reference
- Next steps/balance info

#### 14.2 Live Dashboard Updates

**Update Mechanism:**
- WebSocket connection maintained
- Real-time data flow from backend
- React components re-render on update
- No page refresh required
- Smooth animations for data changes

**Updated Elements:**
- Transaction counts
- Revenue totals
- Payment method breakdown
- Outstanding balance
- Recent transactions list
- Department performance metrics

**Update Frequency:**
- Transactions: Instant (< 1 second)
- Dashboard metrics: Every 30 seconds
- Ledger sync: Real-time
- Report data: On-demand (5-10 second cache)

#### 14.3 No Manual Reconciliation

**Automated Reconciliation:**
- All transactions automatically recorded
- Instant central database updates
- Real-time sync across all terminals
- Automatic balance calculations
- Penalties applied automatically
- Receipts generated automatically

**Reconciliation Verification:**
- Hourly automatic verification
- Discrepancies identified instantly
- Alerts triggered for anomalies
- Manual review for edge cases only
- Audit-ready reconciliation reports

**User Stories:**
- US1401: User receives instant payment confirmation
- US1402: Dashboard updates in real-time
- US1403: Manual reconciliation unnecessary
- US1404: System automatically handles all calculations

---

### 15. Admin Controls Module

#### 15.1 Fee Management

**Admin Capabilities:**
- Create new fee types
- Edit existing fees
- Activate/deactivate fees
- Set calculation methods
- Configure penalty rules
- Set applicable payer types
- View fee collection statistics

**Actions:**
- Add fee: Name, description, amount, calculation method
- Edit fee: Update any attribute (with audit log)
- Delete fee: Mark as inactive (never hard delete)
- View fee usage: See how many bills/payments per fee
- Bulk operations: Enable/disable multiple fees

#### 15.2 User Management

**User Management Functions:**
- View all users
- Create new user accounts
- Edit user information
- Reset passwords
- Assign/change roles
- Deactivate accounts
- Export user list

**User Status:**
- Active: Can login and access
- Inactive: Cannot login (archived)
- Suspended: Temporarily blocked (reason recorded)
- Pending: Awaiting email verification

**Bulk Actions:**
- Bulk role assignment
- Bulk activation/deactivation
- Bulk password reset
- Bulk data export

#### 15.3 Penalty Rules Configuration

**Rule Management:**
- Define late payment penalties
- Set grace periods
- Configure monthly interest
- Set surcharges
- Configure penalty caps
- Enable/disable rules
- View penalty statistics

**Rule Types:**
- Fixed amount penalties
- Percentage-based penalties
- Time-based (after X days)
- Compound penalties
- Custom penalty formulas

#### 15.4 Payment Channel Management

**Channel Control:**
- Enable/disable payment methods
- Configure payment limits
- Set processing fees (if applicable)
- Monitor transaction volume
- View success rates
- Manage API credentials
- Set settlement preferences

**Channels Available:**
- Cash (always available to terminals)
- GCash (enable/disable)
- Maya (enable/disable)
- Future channels

#### 15.5 System Activity Monitoring

**Monitoring Dashboard:**
- Active users count
- Current transaction volume
- System performance metrics:
  - API response time
  - Database query time
  - Payment gateway response
  - Error rates
- Payment channel status
- System health indicators

**Alerts:**
- High error rate alert
- Slow response time alert
- Payment gateway timeout alert
- System resource alerts
- Security alerts (failed login attempts, etc.)

**User Stories:**
- US1501: Admin can create and manage fees
- US1502: Admin can manage users and roles
- US1503: Admin can configure penalties
- US1504: Admin can enable/disable payment channels
- US1505: Admin can monitor system activity

---

## 🌐 API Endpoints (Complete Reference)

### Authentication Endpoints

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/forgot-password
GET /api/v1/auth/verify-email
POST /api/v1/auth/refresh-token
POST /api/v1/auth/google-callback
POST /api/v1/auth/change-password
```

### User Endpoints

```
GET /api/v1/users/me
GET /api/v1/users/profile/:id
PUT /api/v1/users/:id
GET /api/v1/users (admin only)
DELETE /api/v1/users/:id (admin only)
PUT /api/v1/users/:id/role (admin only)
PUT /api/v1/users/:id/status (admin only)
```

### Fee Endpoints

```
GET /api/v1/fees
GET /api/v1/fees/:id
POST /api/v1/fees (admin only)
PUT /api/v1/fees/:id (admin only)
DELETE /api/v1/fees/:id (admin only)
PUT /api/v1/fees/:id/status (admin only)
```

### Bill Endpoints

```
GET /api/v1/bills
GET /api/v1/bills/:id
POST /api/v1/bills (admin/cashier)
PUT /api/v1/bills/:id (admin only)
DELETE /api/v1/bills/:id (admin only)
PUT /api/v1/bills/:id/status
GET /api/v1/bills/search?query=...
```

### Payment Endpoints

```
POST /api/v1/payments/create
GET /api/v1/payments
GET /api/v1/payments/:id
POST /api/v1/payments/verify
GET /api/v1/payments/receipt/:id
POST /api/v1/payments/receipt/:id/download
GET /api/v1/payments/search?query=...
```

### QR Code Endpoints

```
POST /api/v1/qr-code/generate
GET /api/v1/qr-code/:id
GET /api/v1/qr-code/:id/image
```

### Cashier Endpoints

```
POST /api/v1/cashier/record-cash
GET /api/v1/cashier/terminal-dashboard
GET /api/v1/cashier/daily-summary
GET /api/v1/cashier/transactions
POST /api/v1/cashier/reconciliation
```

### Dashboard & Report Endpoints

```
GET /api/v1/dashboard/analytics
GET /api/v1/dashboard/kpis
GET /api/v1/reports/collection
GET /api/v1/reports/revenue
GET /api/v1/reports/payment-channels
GET /api/v1/reports/export?format=pdf|excel|csv
GET /api/v1/reports/department/:dept_id
```

### Webhook Endpoints

```
POST /api/v1/webhooks/paymongo
POST /api/v1/webhooks/notifications
```

### Admin Endpoints

```
GET /api/v1/admin/audit-logs
GET /api/v1/admin/system-stats
PUT /api/v1/admin/settings
POST /api/v1/admin/penalty-rules
PUT /api/v1/admin/penalty-rules/:id
```

---

## 🎨 Color Palette (Green Theme)

### Primary Colors
- **Primary Green**: #00873E (Professional, trustworthy)
- **Light Green**: #E8F5E9 (Backgrounds)
- **Dark Green**: #004D2E (Text, accents)

### Secondary Colors
- **Light Gray**: #F5F5F5 (Backgrounds)
- **Medium Gray**: #BDBDBD (Borders, disabled)
- **Dark Gray**: #424242 (Text)

### Status Colors
- **Success**: #4CAF50 (Payments completed)
- **Warning**: #FFC107 (Pending/overdue)
- **Error**: #F44336 (Failures)
- **Info**: #2196F3 (Messages)

---

## 📝 Summary of All Features

### Core Features Implemented
✅ Multi-channel payment processing
✅ QR code generation and scanning
✅ Cash and digital payment recording
✅ Real-time transaction tracking
✅ Automatic receipt generation
✅ Penalty calculation engine
✅ User role-based access control
✅ Department-based tracking
✅ Comprehensive reporting
✅ Audit trail logging
✅ SMS/Email notifications
✅ Payment verification
✅ Revenue analytics dashboard
✅ Google OAuth integration
✅ Admin controls

### Design Features
✅ Green color palette (professional theme)
✅ Modern, minimalist interface
✅ Responsive design (mobile-first)
✅ Accessibility compliance
✅ Real-time UI updates
✅ Intuitive user workflows

### Security Features
✅ JWT authentication
✅ Password encryption
✅ HTTPS/TLS encryption
✅ Audit logging
✅ Role-based permissions
✅ Rate limiting
✅ Input validation
✅ CSRF protection

---

**Project Status**: Ready for Development  
**Last Updated**: April 28, 2026  
**Version**: 2.0
