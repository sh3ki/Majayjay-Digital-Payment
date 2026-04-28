# 💳 LGU Digital Payment & Transaction Management System

*Focused on digitizing collections, payments, and transaction tracking for Majayjay.*

---

## 🎯 System Scope

This system is designed to:

* Digitize **all municipal payments and collections**
* Support **QR-based and online payments**
* Record **cash transactions digitally**
* Provide **real-time tracking, reporting, and auditability**

> ❗ Excludes: permit processing workflows, inspections, and approvals
> ✔ Includes: payment recording, billing, receipts, and monitoring

---

## 🔐 1. Authentication & Access Control

### 1.1 User Registration

* Register using:

  * Email & password
  * Google (Gmail OAuth)
* Required info:

  * Full name
  * Contact number
* Email verification required

### 1.2 User Login

* Login via:

  * Email/password
  * Google login (SSO)
* Forgot password recovery

### 1.3 User Roles

* **Admin**

  * Full access
* **Cashier**

  * Records payments (cash + assisted digital)
* **Department Viewer**

  * View reports only
* **Resident / Taxpayer**

  * View bills & pay online

---

## 💰 2. Fee & Billing Management

### 2.1 Fee Setup

* Configure all payable items:

  * Taxes (RPT, Cedula)
  * Utilities (Water, Electricity)
  * Permits & clearances (payment only)
  * Barangay fees
  * Miscellaneous fees
* Define:

  * Fixed amount OR
  * Variable (unit-based, percentage)

### 2.2 Bill Generation

* Create bills for:

  * Individuals
  * Businesses
* Bill includes:

  * Fee breakdown
  * Due date
  * Auto-calculated penalties (if overdue)

### 2.3 On-Demand Charges

* Cashier/Admin can:

  * Add custom charges
  * Generate instant payable transactions

---

## ⚙️ 3. Penalty & Auto-Calculation Engine

* Automatically applies:

  * Late payment penalties
  * Monthly interest (e.g., 2% RPT)
  * Surcharges (e.g., 25% business tax)
* Real-time computation before payment
* Transparent breakdown shown to payer

---

## 📱 4. QR Code Payment System

### 4.1 QR Generation

* Each transaction generates a **unique QR code**
* Contains:

  * Transaction ID
  * Amount
  * Fee type
  * Payer reference

### 4.2 Supported Payments

* GCash
* Maya
* Future-ready for other e-wallets

### 4.3 Payment Flow

1. User views bill
2. System generates QR
3. User scans and pays
4. Payment confirmation is received
5. Transaction is automatically marked as **PAID**

---

## 💵 5. Cash Payment Recording

### 5.1 Cashier Module

* Cashiers can:

  * Search payer
  * Select unpaid bill
  * Record cash payment

### 5.2 Digital Recording

* Even cash payments are:

  * Logged in the system
  * Assigned OR number
  * Included in reports

### 5.3 Assisted Digital Payment

* Cashier can:

  * Generate QR for walk-in payer
  * Let payer scan using their phone

---

## 🧾 6. Official Receipt (OR) System

### 6.1 Auto-Generated Receipts

* Generated upon successful payment
* Includes:

  * OR number
  * Payment method (Cash / GCash / Maya)
  * Date & time
  * Breakdown of fees

### 6.2 Receipt Delivery

* Options:

  * SMS
  * Email
  * Printable copy (for cashier)
  * Downloadable PDF

### 6.3 Compliance

* Sequential OR numbering
* COA/BIR-ready format

---

## 🔎 7. Transaction & Payer Lookup

### 7.1 Search Functionality

* Search by:

  * Name
  * Reference number
  * Tax declaration / CTC

### 7.2 Transaction History

* View:

  * Paid transactions
  * Pending balances
  * Payment methods used

---

## 🔔 8. Notifications & Alerts

* Automated reminders:

  * Upcoming due dates
  * Overdue payments
* Channels:

  * SMS
  * Email
* Real-time confirmation after payment

---

## 📊 9. Reporting & Analytics

### 9.1 Collection Reports

* Filter by:

  * Date range
  * Department
  * Payment method (Cash vs Digital)

### 9.2 Revenue Breakdown

* By:

  * Fee category
  * Office/department
  * Daily / Monthly / Annual

### 9.3 Export Options

* Excel
* CSV
* PDF

---

## 🧮 10. Unified Transaction Ledger

* All payments (cash + digital) stored in one system
* Real-time updates across:

  * Cashier terminals
  * Online portal
* Eliminates duplicate or missing records

---

## 🔐 11. Audit Trail & Security

* Every transaction logs:

  * Timestamp
  * User (cashier/admin)
  * Payment channel
* Tamper-proof logs
* Supports COA audits

---

## 🏢 12. Department-Based Tracking

* Each office can:

  * View its own collections
  * Track performance
* Central admin can:

  * View LGU-wide revenue

---

## 🌐 13. Multi-Channel Payment Access

* **Online Portal**

  * Residents can pay remotely
* **Cashier Terminal**

  * For walk-in payments
* **QR Scan Anywhere**

  * Pay via mobile wallets

---

## ⚡ 14. Real-Time System Features

* Instant payment confirmation
* Live dashboard updates
* No manual reconciliation needed

---

## 🧩 15. Admin Controls

* Manage:

  * Fee types
  * Penalty rules
  * Users & roles
* Enable/disable payment channels
* Monitor system activity

---

## 🎯 Key Outcome

* Digitized all municipal collections
* Reduced manual errors and queues
* Improved transparency and audit readiness
* Enabled **cash + cashless unified tracking**
* Increased efficiency in revenue collection
