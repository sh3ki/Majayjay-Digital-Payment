# Everything to Enhance — MDFAS (Majayjay Digital Fee & Payment System)

> **Document Purpose:** Comprehensive gap analysis and enhancement catalog based on deep-dive review of all codebase files, documentation, and system requirements. This document catalogs every missing feature, broken functionality, UI/UX gap, database deficiency, security issue, and integration need.

---

## � WRONG PROCESSES — Currently Broken Logic That Must Be Fixed

> These are not missing features — they are **incorrect behaviors** already in the live codebase. They must be fixed before any new features are built.

### W1. Sidebar "My Bills" Label Shows to ALL Roles — WRONG
**File:** `frontend/src/components/common/Sidebar.tsx`

In `NAV_ITEMS`, the entry is:
```
{ label: 'My Bills', path: '/bills', roles: ['resident','admin','cashier','department_viewer'] }
```
The label **"My Bills"** is a resident-only concept (your own bills). Admins and cashiers use `/bills` to manage **all bills** in the system — not just their own. Showing "My Bills" to a cashier or admin is semantically wrong and misleading.

**Fix required:** The sidebar nav item should show **"Bills"** for admin, cashier, and department_viewer — and **"My Bills"** only for residents. This requires either two separate nav items with different role arrays, or role-based label rendering inside the sidebar component.

---

### W2. Bills Page Title/Description Is Wrong for Residents
**File:** `frontend/src/pages/Bills.tsx`

The page heading is hardcoded:
- Title: `"Bills"`
- Subtitle: `"Manage and track all payment bills"`

This is correct for staff (admin, cashier, department_viewer) who manage all bills. But for a **resident**, they:
- Cannot "manage" bills (they can only view and pay their own)
- Do not see "all" bills — the backend correctly filters by `payerId = currentUser.id`
- Should see **"My Bills"** as the title and **"View and pay your bills"** as the subtitle

**Fix required:** Use role check (`isResident`) to conditionally render the correct title and subtitle.

---

### W3. Bills Page Shows "Payer" Column to Residents — REDUNDANT
**File:** `frontend/src/pages/Bills.tsx`

The bills table has a **"Payer"** column showing the payer's name and email. For a resident viewing their own bills, every single row displays **their own name** — because they ARE the payer. This column is completely redundant for residents and wastes table space.

**Fix required:** Hide the "Payer" column (and the payer email subtext) when the logged-in user is a resident. Show it only for admin/cashier/department_viewer who need to see whose bill it is.

---

### W4. Payments Page Title/Description Is Wrong for Residents
**File:** `frontend/src/pages/Payments.tsx`

The page heading is hardcoded:
- Title: `"Payments"`
- Subtitle: `"View all payment transactions · X total"`

The phrase **"all payment transactions"** is wrong for residents — they only see their own. Should be **"My Payments"** with subtitle **"Your payment history · X total"**.

**Fix required:** Same as W2 — conditional rendering based on role.

---

### W5. Payments Page Shows "Payer" Column to Residents — REDUNDANT
**File:** `frontend/src/pages/Payments.tsx`

The payments table has a **"Payer"** column. For residents, every payment in the list was made by them — the "Payer" column always shows their own name. Same redundancy issue as W3.

**Fix required:** Hide the "Payer" column for residents.

---

### W6. Payments Page Search Placeholder Is Wrong for Residents
**File:** `frontend/src/pages/Payments.tsx`

The search field placeholder is: `"Search by payer name or transaction ID…"`

For a resident, searching **by payer name** makes no sense — every payment has the same payer (themselves). The useful search for a resident is by transaction ID, OR number, or bill number.

**Fix required:** For residents, change the placeholder to `"Search by transaction ID or OR number…"` and optionally remove the payer name search logic on the backend for resident queries.

---

### W7. Dashboard Shows Admin/Cashier KPIs to Residents — WRONG
**File:** `frontend/src/pages/Dashboard.tsx`

The dashboard currently shows the **same KPI cards** to all roles:
- Total Collections This Month
- Successful Transactions
- Average Transaction Amount
- Active Bills
- Monthly collection revenue line chart
- Payment methods pie chart (GCash, Maya, Cash distribution)

These are **staff/cashier/admin metrics** about the entire system. A **resident** should never see aggregate system collection data. Residents should see a completely different dashboard:
- Their outstanding bills summary
- Their total amount paid lifetime
- Next upcoming due date
- Quick "Pay Now" buttons for unpaid bills

**Fix required:** Check user role in `Dashboard.tsx`. If resident → render `ResidentDashboard` component with resident-specific data. If staff → render current `StaffDashboard` component.

---

### W8. Backend: `getPaymentById` Has No Resident Ownership Check — SECURITY BUG
**File:** `backend/src/services/payments.service.ts`, `backend/src/controllers/payments.controller.ts`

`getBillById` correctly checks:
```typescript
if (userRole === 'resident' && bill.payerId !== currentUserId) throw new Error('Access denied');
```

But `getPaymentById` has **no such check**:
```typescript
async getPaymentById(id: number) {
  const payment = await prisma.payment.findUnique({ where: { id }, ... });
  ...
}
```

A resident who knows (or guesses) another payment's numeric ID can access it and see the other payer's name, amount, and receipt. This is a **data exposure bug**.

**Fix required:** Pass `currentUserId` and `userRole` to `getPaymentById`. Add the same ownership check: if `userRole === 'resident' && payment.payerId !== currentUserId → throw 'Access denied'`.

---

### W9. Backend: `getReceipt` Has No Resident Ownership Check — SECURITY BUG
**File:** `backend/src/controllers/payments.controller.ts`

The `getReceipt` endpoint fetches any receipt by `receiptId` or `orNumber` with **no ownership verification**:
```typescript
const receipt = await prisma.officialReceipt.findFirst({
  where: { OR: [{ receiptId: id }, { orNumber: id }] },
  ...
});
```

A resident can enumerate OR numbers (e.g., `OR-2026-0001`, `OR-2026-0002`, ...) and view other residents' official receipts, exposing payment amounts and personal details.

**Fix required:** After fetching the receipt, add: if `req.user.role === 'resident' && receipt.payment.payerId !== req.user.sub → return 403`.

---

### W10. Sidebar "Payments" Label — Should Be "My Payments" for Residents
**File:** `frontend/src/components/common/Sidebar.tsx`

Similar to W1, the "Payments" nav item shows the same label for all roles. For residents viewing their own payment history, "My Payments" is the correct and consistent label (matching "My Bills").

**Fix required:** Same approach as W1 — show "My Payments" for residents, "Payments" for staff.

---

## �🔴 CRITICAL GAPS (Core System Purpose Blockers)

### 1. PayMongo Integration — NOT IMPLEMENTED
The entire online payment flow via GCash and Maya through PayMongo is absent. The env variables `PAYMONGO_API_KEY`, `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET` exist but NO PayMongo service, controller, or routes are built. This is the primary reason the system exists.

**Missing pieces:**
- `backend/src/services/paymongo.service.ts` — create payment intents, sources, handle checkout sessions
- `backend/src/controllers/paymongo.controller.ts` — routes for initiating and confirming payments
- `backend/src/routes/paymongo.routes.ts` — PayMongo-specific endpoints
- `backend/src/webhooks/paymongo.webhook.ts` — webhook receiver for `payment.paid`, `payment.failed` events from PayMongo
- PayMongo payment intent creation when a resident clicks "Pay Online"
- PayMongo source creation for GCash (`gcash`) and Maya (`paymaya`) e-wallets
- Redirect URL handling: `success_url` and `failed_url` after payment
- Webhook signature verification using `PAYMONGO_WEBHOOK_SECRET`
- Idempotency key generation for duplicate payment prevention
- Auto-update of bill and payment status when PayMongo confirms payment
- `payment_intents` table to track PayMongo payment intent IDs
- Resident-facing "Pay Online" button that launches the PayMongo checkout

### 2. Webhook Endpoint — MISSING
No `/api/v1/webhooks/paymongo` endpoint exists. Without this, PayMongo cannot notify the system when a GCash or Maya payment is completed. Bills will never auto-update to PAID for online payments.

### 3. Online Payment Page for Residents — MISSING
Residents can view their bills but have no way to pay online. There is no "Pay Now" flow that redirects to GCash/Maya checkout or shows a PayMongo payment link. The `/pay/:transactionId` URL referenced in QR codes doesn't have a corresponding page in the frontend.

### 4. Forgot Password Email — SKELETON ONLY
`authService.forgotPassword()` is a stub — it finds the user but sends no email. Residents and staff who forget passwords have no recovery path.

### 5. Receipt PDF Download — NOT IMPLEMENTED
Receipts exist in the database but there is no PDF generation. `window.print()` on the PaymentDetail page is the only option, which is not official receipt quality. The docs specify PDF receipts sent via email.

---

## 🟠 HIGH PRIORITY ENHANCEMENTS

### 6. Email Notification System — NOT IMPLEMENTED
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` are configured in `env.ts` but no email service (`nodemailer` or similar) is used anywhere in the codebase. Required emails:
- Password reset link
- Payment confirmation with PDF receipt attached
- Bill issuance notification (new bill assigned to resident)
- Overdue bill reminder (3, 7, 14, 30 days after due date)
- Account registration confirmation
- OAuth new account welcome email

### 7. SMS Notification System — NOT IMPLEMENTED
`SMS_API_KEY` and `SMS_SENDER_ID` are configured but no SMS provider integration exists. Required SMS events:
- Payment confirmation (immediate)
- Due date reminder (7 days before)
- Overdue notice
- Bill issuance alert

### 8. Automated Penalty Application — MISSING
Penalties are calculated on-the-fly when a bill is viewed (`getBillById` returns `currentPenalties`) but they are NEVER persisted back to the bill. There is no cron job or scheduled task to:
- Automatically set bill status to `OVERDUE` after due date
- Apply and store penalties in the `penalties` table
- Add penalty amount to `bill.penaltyAmount`
- Update `bill.balanceAmount` with accumulated penalties

### 9. Resident Online Payment Flow — MISSING
The entire resident self-service payment journey is incomplete:
- No "Pay Online" button on `BillDetail.tsx` for residents
- No PayMongo payment initiation from the frontend
- No payment status polling (resident sees pending → paid)
- No payment success/failure page
- The `/pay/:transactionId` page referenced in QR codes doesn't exist in `App.tsx`

### 10. On-Demand Charges — SCHEMA EXISTS, NO IMPLEMENTATION
The `on_demand_charges` table exists in the Prisma schema but there are no:
- Backend service methods
- API controller or routes
- Frontend UI for creating/managing on-demand charges
- QR code generation tied to on-demand charges

### 11. Tiered Fee Calculation — INCOMPLETE
`bills.service.ts` handles `FIXED`, `VARIABLE`, and `PERCENTAGE` fee types but the `TIERED` type is not implemented. The tier configuration JSON is stored in the schema but the calculation logic falls through without computing anything.

### 12. Bill Edit Functionality — MISSING
Once a bill is created, there is no way to edit it. The API only has `updateBillStatus`. There is no:
- Edit bill endpoint (`PUT /api/v1/bills/:id`)
- Edit bill page in the frontend
- Ability to add/remove fee items from an existing draft bill

### 13. Batch Bill Generation — MISSING
The docs specify "Admin selects fee type → system identifies applicable payers → generates bills for all." Currently only individual bills can be created one at a time. Missing:
- Batch bill creation endpoint
- Payer group selection UI
- Batch bill preview before confirmation
- Progress feedback during generation

---

## 🟡 MEDIUM PRIORITY ENHANCEMENTS

### 14. Department-Specific Reports — INCOMPLETE
The `department_viewer` role exists and has access to `/reports` but the Reports page has no department filter. A department viewer sees all LGU data instead of only their department. Missing:
- Department filter dropdown in Reports page
- Backend report filtering by `departmentId`
- Department head dashboard widget with their collections
- Revenue by fee category under a department

### 15. Resident-Tailored Dashboard — MISSING
The Dashboard page shows admin/cashier KPIs (total monthly collection, success rate, etc.) to all roles including residents. Residents should see:
- Their own outstanding bills summary
- Their total paid amount
- Their recent payment history
- Upcoming due dates with countdown
- Quick "Pay Now" button for unpaid bills

### 16. In-App Notification Center — MISSING
The `notifications` table exists in the schema but there is no:
- Notification bell icon in the Navbar
- Notification dropdown panel
- Unread count badge
- Mark as read functionality
- Notification list page
- Real-time notification delivery via Socket.IO (Socket.IO is set up on the backend)

### 17. Cashier Session / Shift Management — MISSING
The docs describe cashier shift start/end, opening/closing cash counts, and daily closeout. The schema doesn't include `cashier_sessions` table (mentioned in docs), and the frontend has no shift management UI. Missing:
- `cashier_sessions` database table
- Shift start/end API
- Opening cash amount entry
- End-of-shift reconciliation modal
- Daily closeout report generation

### 18. Public Receipt Verification Page — MISSING
The OR system includes a QR code that links to `/receipt/verify/:receiptId` but this route doesn't exist in `App.tsx` and there is no public verification page. Residents/staff cannot scan the QR on a receipt to verify its authenticity.

### 19. Reports: Fee Category Breakdown — MISSING
The Reports page shows collection by payment method but not by fee category (RPT, Cedula, Business Permit, etc.). Missing:
- "Revenue by Fee Category" bar chart
- Top fee categories table
- Category filter for detailed drilldown
- Backend aggregation by fee category

### 20. Reports: Export to PDF — MISSING
Only CSV export is available. The docs specify PDF reports. Missing:
- PDF export button in Reports page
- Server-side or client-side PDF generation (e.g., `jsPDF` or `pdfmake`)
- Printable report layout with LGU header, seal, etc.

### 21. Advanced Search in Cashier Terminal — LIMITED
The Cashier terminal only searches by payer name/email/contact/bill number. Missing:
- Search by barangay/address
- Search by fee type (e.g., "show all RPT bills")
- Filter by overdue status
- Quick "Show All Overdue" button
- Filter by balance amount range

### 22. User Detail / Profile Admin View — MISSING
Admins can create and edit users in the Users page, but there is no individual user detail/profile page for admin. Missing:
- `GET /admin/users/:id` endpoint with full user details
- User detail page showing: profile info, all bills, payment history, total paid, outstanding balance
- Admin notes field on user profiles

### 23. Admin System Settings Page — MISSING
There is no system settings/configuration page. Missing:
- OR number format/prefix configuration
- System name, logo upload
- Default penalty grace period setting
- Email/SMS toggle settings
- PayMongo test/live mode toggle
- Maintenance mode flag

### 24. Two-Factor Authentication (2FA) — SCHEMA ONLY
`twoFaEnabled` field exists on User model but 2FA is never implemented. For a government financial system, 2FA for admin and cashier accounts is critical.

### 25. Account Lockout After Failed Logins — MISSING
The docs specify "account locked after 5 failed attempts (15-minute lock)" but this is not implemented in `auth.service.ts`. There is no failed attempt counter or lockout mechanism.

### 26. Address Field on Users — MISSING
The User model lacks an `address` field. For a government payment system, the payer's address is required for:
- Official receipts (must show payer address per COA requirements)
- Bill delivery
- Cedula/CTC (requires barangay/address)

### 27. Payer Profile / History Page — MISSING
There is no dedicated "Payer Profile" page. Residents have a Profile page but it only shows account settings, not their full payment history. Missing:
- Sortable transaction history table (resident view)
- Total paid summary
- Outstanding bills with quick pay buttons
- Downloadable payment history report

---

## 🔵 LOWER PRIORITY / POLISH ENHANCEMENTS

### 28. Recurring Bill Auto-Generation — MISSING
The docs specify automatic recurring bill generation (annual/monthly fees). No scheduler or cron system exists. Missing:
- Recurring bill configuration on fee types
- Scheduled job to auto-generate bills (e.g., `node-cron`)
- Notification to payer upon auto-generation

### 29. QR Code Print Layout — BASIC
QR codes are displayed in a Dialog but have no proper print-friendly layout. Missing:
- Print-specific CSS layout for QR code + transaction details
- "Print QR" button that opens formatted print view
- QR code with LGU logo watermark
- Bill details shown alongside QR

### 30. Bill Notes / Comments — BASIC
Bills have a `notes` field but there is no:
- Admin/cashier internal notes (separate from public notes)
- Comment thread on bills for admin communication
- Cancellation reason field (required when cancelling)

### 31. Payment Method Filter — INCOMPLETE
The Payments list page has no payment method filter (unlike the Ledger page which does). Cashier terminal has no payment method selection for recording (assumes Cash always).

### 32. Sortable Table Columns — MISSING
Tables in Bills, Payments, Ledger, Users, and Audit Logs pages lack column sorting. Users cannot click column headers to sort. This is a fundamental table UX feature.

### 33. Bulk Actions — MISSING
- Bulk cancel bills
- Bulk mark bills as overdue
- Bulk export selected records

### 34. Dashboard Enhancements — INCOMPLETE
Current dashboard is functional but missing:
- Department performance comparison table
- Top 5 fee categories this month
- Overdue bills aging chart (0-30, 31-60, 61-90, 90+ days)
- Collection target vs actual (if targets are configured)
- Year-over-year comparison toggle
- Date range picker (not just current month/year)

### 35. Sidebar Navigation Enhancements — MISSING
- Active route highlighting is likely basic; add proper active state
- Collapse/expand submenu for Admin section
- Unread notification badge on Notifications link (when implemented)
- Role-based menu visibility (residents see simplified menu)
- Mobile sidebar drawer (hamburger menu on small screens)

### 36. Dark Mode — MISSING
No dark mode support. The entire UI is hardcoded with `#0D47A1`, `#1565C0` etc. colors. A dark mode toggle would improve usability for cashiers working long shifts.

### 37. LGU Branding / Logo — MISSING
- No Majayjay LGU logo in the Navbar, sidebar, or receipts
- No favicon set up
- Official receipt PDF/print should show the municipal seal

### 38. Loading State Improvements — BASIC
- Skeleton loaders instead of centered spinners for better perceived performance
- Optimistic UI updates for status changes
- Better empty state illustrations (instead of plain text "No records found")

### 39. Error Handling Improvements — BASIC
- Generic "Failed to load" messages throughout; should show specific reason
- No retry button on failed data fetches
- No global error boundary in React

### 40. Mobile Responsiveness — PARTIAL
- Tables are `overflowX: 'auto'` which works but isn't mobile-optimized
- Cashier terminal form could be better on tablet (used at a cashier station)
- No touch-friendly QR scanner integration for mobile cashiers

---

## 🗄️ DATABASE / SCHEMA ENHANCEMENTS

### 41. Missing Tables in Prisma Schema
The following tables are referenced in documentation but absent from `schema.prisma`:
- `cashier_terminals` — Terminal management
- `cashier_sessions` — Shift tracking
- `notification_templates` — Email/SMS templates
- `payment_intents` — PayMongo payment intent tracking
- `refunds` — Payment refund records
- `oauth_accounts` — Separate OAuth account records (security improvement)
- `bill_comments` — Internal notes on bills
- `system_settings` — Key-value config store

### 42. Missing Fields on Existing Tables
- `users.address` — Barangay + full address
- `users.barangay` — For filtering and receipt
- `users.middle_name` — Common in PH government forms
- `users.failed_login_attempts` — For account lockout
- `users.locked_until` — Lockout timestamp
- `bills.billing_year` — Which tax year (especially for RPT)
- `bills.billing_period_start` / `bills.billing_period_end` — Already in frontend form but NOT in Prisma schema
- `payments.paymongo_payment_intent_id` — For reconciliation
- `payments.paymongo_source_id` — For GCash/Maya source reference
- `official_receipts.issued_at` — Missing (only `created_at` exists)
- `official_receipts.payer_name` — Missing (should be denormalized for audit immutability)
- `official_receipts.payer_address` — Missing
- `on_demand_charges.qr_code_id` — Link to generated QR

### 43. Database Indexes — INCOMPLETE
Missing indexes for commonly queried patterns:
- `idx_bills_bill_number` — Frequently searched
- `idx_bills_due_date_status` — Compound index for overdue queries
- `idx_payments_transaction_id` — Already exists but verify
- `idx_audit_logs_event_type` — For filtering by event type
- `idx_notifications_read_at` — Unread notification queries

### 44. OAuth Security Issue
`oauth.service.ts` stores a random `Math.random()` string as the OAuth user's `passwordHash`. This is not bcrypt-hashed and represents a security risk if the field is ever exposed. OAuth users should have a separate `oauth_accounts` table or at minimum a bcrypt hash of the random string.

---

## 🔒 SECURITY ENHANCEMENTS

### 45. Google ID Token Verification — INSECURE
`oauthService.decodeIdToken()` decodes the JWT without verifying the Google signature. An attacker could forge a Google ID token. Must use `google-auth-library` to properly verify the token against Google's public keys.

### 46. JWT Secret Fallback — RISK
`env.ts` falls back to `'fallback_secret_change_in_production'` if `JWT_SECRET` is not set. In production this must throw an error instead of using a default.

### 47. Input Sanitization — MISSING
No sanitization middleware exists. User-supplied strings go directly into Prisma queries (safe via parameterization) but HTML/script injection in `notes`, `description`, `reason` fields could be an issue when rendered.

### 48. PayMongo Webhook Signature Verification — MISSING
When the webhook endpoint is implemented, it MUST verify the `x-paymongo-signature` header using HMAC-SHA256 and `PAYMONGO_WEBHOOK_SECRET`. Without this, anyone can forge payment confirmations.

### 49. Rate Limiting — TOO GENERIC
`generalLimiter` applies uniformly. Should have:
- Stricter limiter on `/auth/login` (e.g., 5 attempts/15 min per IP)
- Stricter limiter on `/auth/forgot-password`
- Separate limit for webhook endpoint (only PayMongo IPs should hit it)

### 50. CORS — NEEDS REVIEW
CORS is set to `[env.FRONTEND_URL, 'http://localhost:3000']`. In production, `'http://localhost:3000'` must be removed and only the production URL should be allowed.

### 51. SQL via Prisma — Generally Safe
Prisma's parameterized queries protect against SQL injection. However, the raw `where` object constructions using `Record<string, unknown>` in services should be reviewed for any inadvertent injection vectors.

---

## 📊 REPORTING ENHANCEMENTS

### 52. Revenue by Fee Category Report
Backend lacks aggregation by fee category. Required:
- `GET /api/v1/reports/by-category?startDate=&endDate=` endpoint
- Frontend chart: horizontal bar chart, fee category vs collected amount
- Downloadable breakdown table

### 53. Department Collection Report
- `GET /api/v1/reports/by-department?startDate=&endDate=` endpoint
- Department performance table with target vs actual (if targets added)
- Department viewer role limited to their own department data

### 54. Outstanding Bills Aging Report
- Bills grouped by overdue age bracket: current, 1-30 days, 31-60 days, 61-90 days, 90+ days
- Critical for collections team prioritization

### 55. Daily / Weekly / Monthly Summary Export
- PDF daily summary for cashier end-of-shift
- Monthly collection report for municipal treasurer
- Year-end summary for COA compliance

### 56. Individual Payer Statement of Account
- Official document: payer's full ledger (all bills, payments, penalties)
- Exportable as PDF
- Can be submitted as supporting document

---

## 🎨 UI/UX ENHANCEMENTS

### 57. Empty State Illustrations
Replace all "No records found" text with proper empty state graphics + contextual action buttons (e.g., "No bills yet — Create First Bill" button).

### 58. Confirmation Dialogs
Many destructive actions (Cancel Bill, Delete User) need better confirmation dialogs with typed confirmation (e.g., type "CANCEL" to confirm).

### 59. Toast Notifications
Success/error alerts are shown inline. A global toast/snackbar system would be better UX for transient feedback.

### 60. Table Column Sorting
All data tables (Bills, Payments, Users, Fees, Audit Logs, Ledger) need clickable column headers to sort ascending/descending.

### 61. Advanced Filters Panel
Bills and Payments pages need an expandable "Advanced Filters" panel:
- Bills: filter by fee category, department, amount range, billing year
- Payments: filter by cashier, terminal, payment method, amount range

### 62. Keyboard Shortcuts
Cashier terminal should support keyboard shortcuts for speed:
- `Enter` to submit search
- `F1` for new search
- `F2` to record cash payment
- `F3` to generate QR

### 63. Breadcrumbs Navigation
BillDetail and PaymentDetail pages have a back button but no breadcrumbs. Add consistent breadcrumb trail.

### 64. Loading Skeleton Cards
Replace `CircularProgress` with MUI Skeleton components to show loading placeholders matching the content layout.

### 65. Print Stylesheet
The `window.print()` in PaymentDetail doesn't produce a proper receipt layout. A dedicated `@media print` CSS stylesheet is needed to format the page as an official receipt.

### 66. Pagination Size Option
Tables are locked at 20-25 records per page. Add a page size selector (10, 25, 50, 100).

### 67. Mobile-First Cashier UI
The Cashier terminal should be optimized for tablet use (common at cashier counters):
- Larger touch targets
- Numeric keypad for amount entry on mobile
- Auto-focus on search field

---

## ⚙️ BACKEND / API ENHANCEMENTS

### 68. Forgot Password Reset Flow
Full implementation:
- Generate secure reset token (UUID v4 or crypto.randomBytes)
- Store hashed token + expiry in DB (or `sessions` table)
- Send email with reset link
- `POST /auth/reset-password` endpoint to validate token and set new password
- Token invalidated after use or after 1 hour

### 69. Email Verification
Currently `emailVerified` is set to `true` by default on registration. Proper implementation:
- Set `emailVerified: false` on registration
- Send verification email with token
- `GET /auth/verify-email/:token` endpoint
- Block login if email not verified (or show warning)

### 70. Pagination Response Consistency
Some endpoints return `{ data, meta: { total, page, limit, totalPages } }` but not all. Standardize all list endpoints.

### 71. Bill Search by Multiple Fields
Currently bills search by name/email/bill number. Add:
- Search by fee category
- Search by OR number
- Search by transaction ID
- Search by contact number

### 72. PayMongo Refund API
- `POST /payments/:id/refund` endpoint
- Store refund record in DB
- Update payment status to `REFUNDED`
- Issue refund receipt/notification

### 73. Admin Override Payment Status
Admin should be able to manually mark a pending payment as paid (with reason/notes) for edge cases like bank transfer confirmation delays.

### 74. API Versioning Consistency
All routes are under `/api/v1/` which is good. Ensure this is maintained for future `v2` routes.

### 75. Health Check Enhancement
Current `/api/v1/health` only returns `{ success: true }`. Enhance with:
- Database connectivity check
- PayMongo API reachability check
- Memory/uptime stats

### 76. Soft Delete for Fees/Bills
Instead of hard deleting, implement soft delete with `deletedAt` timestamp. This preserves audit integrity.

### 77. Bill Export Endpoint
`GET /api/v1/bills/export?format=csv|pdf` for bulk bill export by admin.

### 78. Payment Methods — GCash/Maya Not Seeded
The `payment_methods` table needs to be seeded with GCash and Maya (in addition to Cash). Currently `seed.ts` must handle this.

### 79. Cashier Assigned to Payment
When a cashier assists with a digital payment (GCash/Maya at terminal), the cashier's ID should still be linked to the payment. Currently `cashierId` is only set for cash payments.

### 80. Transaction ID Format
`generateTransactionId()` format should be reviewed for uniqueness guarantees. Current format (date-based) may have collisions under concurrent requests. Use UUID v4 or database sequence.

---

## 🔌 INTEGRATION ENHANCEMENTS

### 81. PayMongo GCash Integration
- Create GCash source via PayMongo API
- Redirect resident to GCash payment URL
- Handle `chargeable` event to create charge
- Handle `payment.paid` webhook event
- Update bill + generate receipt on success

### 82. PayMongo Maya Integration
- Same flow as GCash but with `paymaya` source type
- Different redirect behavior (deep link to Maya app)

### 83. PayMongo E-wallet Checkout (New API)
PayMongo's newer API uses "Payment Intents" + "Payment Methods":
- Create Payment Intent with amount
- Attach Payment Method (GCash/Maya)
- Redirect to authorization URL
- Webhook confirms completion

### 84. SMS Provider (Semaphore or Twilio)
- Semaphore is Philippines-specific and cost-effective
- Implement SMS service class
- Queue SMS sends (don't block payment flow)
- Retry on failure

### 85. Email Provider (Nodemailer + SMTP or SendGrid)
- Implement email service using nodemailer with SMTP config already in `env.ts`
- HTML email templates with Majayjay LGU branding
- PDF receipt attachment on payment confirmation

### 86. PDF Generation Library
- `puppeteer` (headless Chrome) or `pdfmake`/`jsPDF` for receipt PDFs
- Receipt template matching the format specified in project docs
- QR verification code embedded in receipt PDF
- LGU letterhead/seal on receipts

---

## 🚀 PERFORMANCE ENHANCEMENTS

### 87. Database Query Optimization
- The `getRevenueSummary` service runs 12 separate DB queries (one per month) in a loop — replace with a single raw SQL/Prisma aggregate query
- `getCollectionReport` fetches ALL payments without pagination for the report — add pagination or streaming for large datasets
- Add `select` fields to all queries to avoid over-fetching

### 88. Caching Layer
- Cache dashboard KPIs for 5 minutes (data doesn't need real-time updates)
- Cache fee categories and fees list (rarely changes)
- Use Redis or in-memory cache (`node-cache`)

### 89. Frontend Performance
- Lazy load admin pages (code splitting with React.lazy + Suspense)
- Memoize expensive formatting functions
- Debounce search inputs (partially done in CreateBill but not Bills/Payments/Cashier)
- Virtual scrolling for large tables (> 1000 records)

---

## 📱 FUTURE FEATURES (Phase 2)

### 90. Resident Mobile App
- React Native or PWA
- Push notifications for payment reminders
- QR scanner built-in
- Biometric login

### 91. Bank Transfer Integration
- BancNet / InstaPay / PESONet integration
- Bank transfer confirmation matching
- Automated reconciliation

### 92. Credit/Debit Card Payments
- PayMongo card payment method
- Secure card entry (PayMongo.js for PCI compliance)

### 93. Installment Payment Plans
- Split bill into multiple installments
- Installment schedule tracking
- Partial payment recording (already partially in schema)

### 94. Multi-Year RPT Payment
- Pay multiple years of Real Property Tax in one transaction
- Consolidate into one bill with all years listed

### 95. Barangay-Level Reporting
- 40 barangays of Majayjay can each have a sub-report
- Barangay captain/treasurer access role

### 96. COA Compliance Report Generator
- Specifically formatted report for Commission on Audit
- OR gap detection (sequential OR number validation)
- Reconciliation summary report

### 97. Data Backup & Export
- Full database export as encrypted ZIP
- Scheduled automated backups
- Restore from backup UI

---

## 🔧 DEVELOPER EXPERIENCE / DEVOPS

### 98. Environment Validation
- Add `zod` or `envalid` to validate all required env variables at startup and throw if missing (JWT_SECRET fallback is dangerous)

### 99. Database Seed Script Enhancement
`seed.ts` likely seeds only roles. Should also seed:
- All 22 fee categories
- Sample fees per category
- Payment methods (Cash, GCash, Maya)
- Sample admin and cashier users
- Sample resident users
- Sample bills and payments for demo

### 100. API Documentation (Swagger)
No Swagger/OpenAPI documentation exists. The `tech-stack.md` specifies `swagger-ui-express` but it's not in `package.json`. All endpoints should be documented with request/response schemas.

### 101. Unit & Integration Tests
No test files exist in the codebase. At minimum:
- Auth service tests (login, register, token refresh)
- Penalty calculator tests (various scenarios)
- Bill creation tests
- Payment recording tests
- PayMongo webhook handler tests

### 102. Docker / Deployment Configuration
No `Dockerfile`, `docker-compose.yml`, or deployment scripts. For a government system, containerization ensures consistent deployment across environments.

---

## SUMMARY TABLE

| Category | Count | Priority |
|---|---|---|
| Critical / Blockers | 5 | 🔴 Must fix |
| High Priority | 8 | 🟠 Core features |
| Medium Priority | 13 | 🟡 Important |
| Lower Priority / Polish | 13 | 🔵 Nice to have |
| Database / Schema | 4 | 🗄️ Foundation |
| Security | 7 | 🔒 Required |
| Reporting | 5 | 📊 Required |
| UI/UX | 11 | 🎨 Quality |
| Backend / API | 13 | ⚙️ Completeness |
| Integrations | 6 | 🔌 Core purpose |
| Performance | 3 | 🚀 Scalability |
| Phase 2 | 8 | 📱 Future |
| Dev / DevOps | 5 | 🔧 Maintenance |
| **TOTAL** | **101** | |
