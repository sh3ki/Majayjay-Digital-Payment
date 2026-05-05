# To-Do: Enhancement Execution Plan — MDFAS

> **Document Purpose:** Fully detailed, step-by-step execution plan for implementing every enhancement listed in `everything-to-enhance.md`. Tasks are organized in execution phases with exact file paths, code changes, dependencies, and acceptance criteria. Follow phases in order — later phases depend on earlier ones.

---

## PHASE -1 — Fix Wrong Processes (Do Immediately — These Are Active Bugs)

> These are **incorrect behaviors already in the live codebase**. Fix these before anything else. None require schema migrations or new dependencies.

---

### TASK W1 — Fix Sidebar "My Bills" / "My Payments" Labels
**File:** `frontend/src/components/common/Sidebar.tsx`

**Problem:** The `NAV_ITEMS` array has `label: 'My Bills'` with roles including admin, cashier, and department_viewer. Staff use `/bills` to manage ALL bills — not just their own. "My Bills" is misleading for non-resident roles. Same for "Payments".

**Steps:**
1. In `SidebarContent`, after getting `userRole`, replace the flat `NAV_ITEMS.filter(...)` with a version that applies role-based label overrides:
```typescript
const filtered = NAV_ITEMS
  .filter((i) => i.roles.includes(userRole))
  .map((i) => {
    if (i.path === '/bills') return { ...i, label: userRole === 'resident' ? 'My Bills' : 'Bills' };
    if (i.path === '/payments') return { ...i, label: userRole === 'resident' ? 'My Payments' : 'Payments' };
    return i;
  });
```
2. Change the base label in `NAV_ITEMS` for `/bills` from `'My Bills'` to `'Bills'` (the map above handles the resident override).
3. Do the same for `/payments` if its label needs updating.

**Acceptance Criteria:** Admin/cashier/department_viewer see "Bills" and "Payments" in sidebar. Residents see "My Bills" and "My Payments".

---

### TASK W2 — Fix Bills Page Title and Description for Residents
**File:** `frontend/src/pages/Bills.tsx`

**Problem:** Title is hardcoded `"Bills"` and subtitle is `"Manage and track all payment bills"` for all roles. Residents cannot manage bills and shouldn't see "all bills" framing.

**Steps:**
1. Import `useAuth` (already imported in the file)
2. Add `const { isAdmin, isCashier } = useAuth();` — also add `isResident` if that helper exists, or check directly:
```typescript
const { user } = useAuth();
const isResident = (user?.role as { roleName?: string })?.roleName?.toLowerCase() === 'resident';
```
3. Replace the hardcoded title block:
```tsx
<Typography variant="h4" fontWeight={700} color="#0D47A1">
  {isResident ? 'My Bills' : 'Bills'}
</Typography>
<Typography variant="body2" color="text.secondary">
  {isResident ? 'View and pay your outstanding bills' : 'Manage and track all payment bills'}
</Typography>
```

**Acceptance Criteria:** Residents see "My Bills / View and pay your outstanding bills". Staff see "Bills / Manage and track all payment bills".

---

### TASK W3 — Hide "Payer" Column in Bills Table for Residents
**File:** `frontend/src/pages/Bills.tsx`

**Problem:** The "Payer" column always shows the resident's own name (redundant and confusing for them).

**Steps:**
1. Use the `isResident` variable from TASK W2.
2. In `<TableHead>`, conditionally render the Payer cell:
```tsx
{!isResident && <TableCell>Payer</TableCell>}
```
3. In `<TableBody>` row cells, do the same:
```tsx
{!isResident && (
  <TableCell>
    <Typography variant="body2" fontWeight={500}>
      {bill.payer?.firstName} {bill.payer?.lastName}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {bill.payer?.email}
    </Typography>
  </TableCell>
)}
```
4. Update `colSpan` on the "No bills found" empty row from `8` to `{isResident ? 7 : 8}`.

**Acceptance Criteria:** Residents see 7-column table without the Payer column. Staff still see all 8 columns.

---

### TASK W4 — Fix Payments Page Title, Description, and Payer Column for Residents
**File:** `frontend/src/pages/Payments.tsx`

**Problem:** Title says "Payments", subtitle says "View all payment transactions · X total", "Payer" column always shows resident's own name.

**Steps:**
1. Import `useAuth` at the top if not already imported.
2. Add the `isResident` check (same pattern as TASK W2).
3. Fix the page title:
```tsx
<Typography variant="h4" fontWeight={700} color="#0D47A1">
  {isResident ? 'My Payments' : 'Payments'}
</Typography>
<Typography variant="body2" color="text.secondary">
  {isResident ? `Your payment history · ${total} total` : `View all payment transactions · ${total} total`}
</Typography>
```
4. Hide the "Payer" column for residents in `<TableHead>` and `<TableBody>` (same pattern as TASK W3).
5. Fix search placeholder:
```tsx
placeholder={isResident ? 'Search by transaction ID or OR number…' : 'Search by payer name or transaction ID…'}
```

**Acceptance Criteria:** Residents see "My Payments", own-payment-scoped subtitle, no Payer column, and a relevant search placeholder.

---

### TASK W5 — Fix Dashboard — Separate Resident View from Staff View
**File:** `frontend/src/pages/Dashboard.tsx`

**Problem:** The same KPI cards (total collections, success rate, system-wide monthly revenue chart) are shown to all roles including residents. These metrics are internal LGU management data — residents should never see them.

**Steps:**
1. At the top of `Dashboard.tsx`, add the `isResident` check.
2. Create a `ResidentDashboard` section (inline or as a separate component in `frontend/src/components/dashboard/ResidentDashboard.tsx`):
```tsx
if (isResident) return <ResidentDashboard />;
```
3. `ResidentDashboard` should show:
   - **"Outstanding Bills"** card: count of unpaid/overdue bills + total balance due (fetch from `billsService.getBills({ status: 'UNPAID' })`)
   - **"Total Paid"** card: sum of all the resident's paid payments
   - **"Next Due Date"** card: earliest upcoming due date from their unpaid bills
   - **"Recent Payments"** list: last 3 payments with date, OR number, amount
   - **"My Unpaid Bills"** list: unpaid bills with "Pay" button (or "View" button linking to BillDetail)
4. All data calls use the same existing endpoints — the backend already filters by `payerId` for residents.

**Acceptance Criteria:** Residents see their personal financial summary. Admin/cashier/department_viewer see the current system-wide collection dashboard.

---

### TASK W6 — Fix Backend: `getPaymentById` — Add Resident Ownership Check
**File:** `backend/src/services/payments.service.ts`, `backend/src/controllers/payments.controller.ts`

**Problem:** A resident can access any payment's details by numeric ID — exposing other residents' payment data.

**Steps:**

1. Update `getPaymentById` signature in `payments.service.ts`:
```typescript
async getPaymentById(id: number, currentUserId?: number, userRole?: string) {
  const payment = await prisma.payment.findUnique({ where: { id }, include: { ... } });
  if (!payment) throw new Error('Payment not found');
  if (userRole === 'resident' && payment.payerId !== currentUserId) {
    throw new Error('Access denied');
  }
  return payment;
}
```

2. Update the call in `payments.controller.ts`:
```typescript
async getPaymentById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    const payment = await paymentsService.getPaymentById(id, req.user?.sub, req.user?.role);
    sendSuccess(res, payment, 'Payment retrieved');
  } catch (err) {
    if ((err as Error).message === 'Payment not found') return sendError(res, 'Payment not found', 404);
    if ((err as Error).message === 'Access denied') return sendError(res, 'Access denied', 403);
    next(err);
  }
},
```

**Acceptance Criteria:** A resident calling `GET /payments/999` where payment 999 belongs to a different payer receives a 403 response.

---

### TASK W7 — Fix Backend: `getReceipt` — Add Resident Ownership Check
**File:** `backend/src/controllers/payments.controller.ts`

**Problem:** Any authenticated user can view any receipt by guessing an OR number (e.g., `OR-2026-0001`). No ownership check exists.

**Steps:**
1. After `if (!receipt) return sendError(res, 'Receipt not found', 404);`, add:
```typescript
if (req.user?.role === 'resident' && receipt.payment?.payerId !== req.user?.sub) {
  return sendError(res, 'Access denied', 403);
}
```

**Acceptance Criteria:** Resident calling `GET /payments/receipt/OR-2026-0001` where that receipt belongs to another payer receives 403.

---

## PHASE 0 — Foundation & Security Fixes (Do First, Blocks Everything)

### TASK 0.1 — Enforce Environment Variable Validation
**Files:** `backend/src/config/env.ts`
**Steps:**
1. Install `zod`: `npm install zod` in backend
2. Replace the flat `env` object with a `zod` schema that `.parse(process.env)` at startup
3. Mark `JWT_SECRET`, `DATABASE_URL`, `PAYMONGO_SECRET_KEY` as `z.string().min(32)` — throws on missing/short values
4. Remove the `'fallback_secret_change_in_production'` default from `JWT_SECRET`
5. Add startup validation log: `logger.info('✅ Environment validated')`

**Acceptance Criteria:** Server refuses to start if any required env var is missing or invalid.

---

### TASK 0.2 — Fix Google OAuth Token Verification (Security)
**Files:** `backend/src/services/oauth.service.ts`
**Steps:**
1. Install `google-auth-library`: `npm install google-auth-library`
2. Replace `jwt.decode(idToken)` with `OAuth2Client.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID })`
3. Extract payload from the verified ticket object
4. Handle `TokenExpiredError` and `JsonWebTokenError` properly

**Acceptance Criteria:** Forged Google tokens are rejected with 401.

---

### TASK 0.3 — Fix OAuth User Password Storage (Security)
**Files:** `backend/src/services/oauth.service.ts`, `backend/prisma/schema.prisma`
**Option A (Quick):** Hash the random password with bcrypt before storing:
1. Import `bcrypt` in oauth.service.ts
2. Replace `randomPassword` with `await bcrypt.hash(randomPassword, 10)`

**Option B (Proper — requires migration):**
1. Add `oauth_provider` and `oauth_provider_id` fields to User model
2. Create Prisma migration
3. Use `passwordHash: null` (make nullable) for OAuth users
4. In login service, check `passwordHash` is not null before comparing

**Acceptance Criteria:** OAuth user passwords are not stored as plaintext or unverifiable strings.

---

### TASK 0.4 — Stricter Rate Limiting
**Files:** `backend/src/middlewares/rateLimiter.middleware.ts`
**Steps:**
1. Add `authLimiter`: 5 requests per 15 minutes (for login + forgot-password)
2. Add `webhookLimiter`: 100 requests per minute (for PayMongo webhook)
3. Export both limiters
4. In `auth.routes.ts`: apply `authLimiter` to `POST /login` and `POST /forgot-password`
5. In `paymongo.routes.ts` (new): apply `webhookLimiter`

**Acceptance Criteria:** `/auth/login` returns 429 after 5 failed attempts in 15 minutes.

---

### TASK 0.5 — Remove localhost from CORS in Production
**Files:** `backend/src/server.ts`
**Steps:**
1. Change CORS origin array to:
```typescript
origin: env.NODE_ENV === 'production' ? [env.FRONTEND_URL] : [env.FRONTEND_URL, 'http://localhost:3000'],
```
2. Add `env.NODE_ENV` to the validated env schema

**Acceptance Criteria:** In production, `http://localhost:3000` is not allowed as CORS origin.

---

### TASK 0.6 — Add Missing Fields to Prisma Schema + Migration
**Files:** `backend/prisma/schema.prisma`
**Steps:**
1. Add to `User` model:
   - `address String?`
   - `barangay String?`
   - `middleName String? @map("middle_name")`
   - `failedLoginAttempts Int @default(0) @map("failed_login_attempts")`
   - `lockedUntil DateTime? @map("locked_until")`
2. Add to `Bill` model:
   - `billingYear Int? @map("billing_year")`
   - `billingPeriodStart DateTime? @db.Date @map("billing_period_start")`
   - `billingPeriodEnd DateTime? @db.Date @map("billing_period_end")`
3. Add to `Payment` model:
   - `paymongoPaymentIntentId String? @map("paymongo_payment_intent_id")`
   - `paymongoSourceId String? @map("paymongo_source_id")`
4. Add to `OfficialReceipt` model:
   - `issuedAt DateTime? @map("issued_at")`
   - `payerName String? @map("payer_name")`
   - `payerAddress String? @map("payer_address")`
5. Add new models: `CashierSession`, `PaymentIntent`, `Refund`, `SystemSetting`, `NotificationTemplate`
6. Run: `npx prisma migrate dev --name add_missing_fields`
7. Run: `npx prisma generate`

**Acceptance Criteria:** Migration runs successfully, all new fields accessible via Prisma client.

---

### TASK 0.7 — Add Account Lockout to Auth Service
**Files:** `backend/src/services/auth.service.ts`
**Steps:**
1. In `login()`, after fetching user, check: `if (user.lockedUntil && user.lockedUntil > new Date()) throw new Error('Account temporarily locked')`
2. On failed password: increment `failedLoginAttempts`; if reaches 5, set `lockedUntil = new Date(Date.now() + 15 * 60 * 1000)`
3. On successful login: reset `failedLoginAttempts = 0`, `lockedUntil = null`
4. In `auth.controller.ts`: handle `'Account temporarily locked'` with 423 status

**Acceptance Criteria:** After 5 failed logins, account is locked for 15 minutes.

---

### TASK 0.8 — Enhance Database Seed Script
**Files:** `backend/prisma/seed.ts`
**Steps:**
1. Seed all 4 roles: `admin`, `cashier`, `department_viewer`, `resident`
2. Seed all 22 fee categories from the documentation
3. Seed payment methods: `Cash`, `GCash`, `Maya`, `Bank Transfer` (inactive)
4. Seed 1 admin user: `admin@majayjay.gov.ph` / `Admin@1234`
5. Seed 1 cashier user
6. Seed 1 sample resident user
7. Seed sample fees: at least 2 per fee category
8. Seed 15 departments

**Acceptance Criteria:** `npx prisma db seed` creates a fully working demo dataset.

---

## PHASE 1 — PayMongo Integration (Core Feature)

### TASK 1.1 — Install PayMongo Dependencies
**Directory:** `backend/`
**Steps:**
1. `npm install axios` (already installed, verify)
2. No official PayMongo SDK; implement via direct Axios calls to `https://api.paymongo.com/v1/`
3. Add PayMongo base64 auth helper: `Buffer.from(secretKey + ':').toString('base64')`

---

### TASK 1.2 — Create PayMongo Service
**File:** `backend/src/services/paymongo.service.ts` (NEW)
**Steps:**
1. Create `paymongoService` object with methods:
   - `createPaymentIntent(amount: number, description: string, metadata: object)` → returns PayMongo payment intent object
   - `createGCashSource(amount: number, billId: number, successUrl: string, failedUrl: string)` → returns source with `redirect.checkout_url`
   - `createMayaSource(amount: number, billId: number, successUrl: string, failedUrl: string)` → same as GCash with `paymaya` type
   - `retrievePaymentIntent(paymentIntentId: string)` → check intent status
   - `retrieveSource(sourceId: string)` → check source status
   - `createPayment(paymentIntentId: string, paymentMethodId: string)` → finalize payment
   - `createRefund(paymentId: string, amount: number, reason: string)` → initiate refund
2. All methods use Axios with Authorization header: `Basic ${base64(secretKey:)}`
3. All amounts converted to centavos (multiply PHP × 100)
4. Add error handling to extract PayMongo error messages

---

### TASK 1.3 — Create Payment Intent DB Table
**Files:** `backend/prisma/schema.prisma`, migration
**Steps:**
1. Add `PaymentIntent` model:
```prisma
model PaymentIntent {
  id                    String   @id @default(uuid())
  billId                Int      @map("bill_id")
  payerId               Int      @map("payer_id")
  paymongoIntentId      String   @unique @map("paymongo_intent_id")
  paymongoSourceId      String?  @map("paymongo_source_id")
  amount                Decimal  @db.Decimal(12, 2)
  currency              String   @default("PHP")
  paymentMethod         String   @map("payment_method") // gcash, paymaya
  status                String   @default("pending") // pending, awaiting_payment_method, awaiting_next_action, processing, succeeded, cancelled
  checkoutUrl           String?  @map("checkout_url")
  metadata              Json?
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")
  expiresAt             DateTime @map("expires_at")

  bill  Bill @relation(fields: [billId], references: [id])
  payer User @relation(fields: [payerId], references: [id])

  @@map("payment_intents")
}
```
2. Add relation `paymentIntents PaymentIntent[]` to `Bill` model
3. Run migration

---

### TASK 1.4 — Create PayMongo Controller and Routes
**Files:** `backend/src/controllers/paymongo.controller.ts` (NEW), `backend/src/routes/paymongo.routes.ts` (NEW)

**Controller methods:**
1. `initiateGCashPayment(req, res, next)`:
   - Requires: `billId`, authenticated `payerId`
   - Creates GCash source via PayMongo
   - Stores `PaymentIntent` record in DB
   - Returns `{ checkoutUrl, sourceId, expiresAt }`

2. `initiateMayaPayment(req, res, next)`:
   - Same as GCash but with `paymaya` type

3. `getPaymentStatus(req, res, next)`:
   - Param: `paymentIntentId`
   - Retrieves from PayMongo + DB
   - Returns current status

**Routes:**
```
POST /api/v1/paymongo/gcash       → authenticate → initiateGCashPayment
POST /api/v1/paymongo/maya        → authenticate → initiateMayaPayment
GET  /api/v1/paymongo/status/:id  → authenticate → getPaymentStatus
POST /api/v1/webhooks/paymongo    → (no auth, use signature) → handleWebhook
```

5. Register routes in `backend/src/routes/index.ts`

---

### TASK 1.5 — Implement PayMongo Webhook Handler
**File:** `backend/src/webhooks/paymongo.webhook.ts` (NEW)
**Steps:**
1. Create `handlePaymongoWebhook(req, res, next)` function
2. **Signature Verification (CRITICAL):**
   ```typescript
   const signature = req.headers['paymongo-signature'] as string;
   const rawBody = JSON.stringify(req.body);
   const hmac = crypto.createHmac('sha256', env.PAYMONGO_WEBHOOK_SECRET);
   hmac.update(rawBody);
   const computed = hmac.digest('hex');
   if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed))) {
     return res.status(401).json({ error: 'Invalid signature' });
   }
   ```
3. Handle event types:
   - `source.chargeable` → create charge against source
   - `payment.paid` → update PaymentIntent status to `succeeded`, create Payment record, generate receipt, update bill, emit Socket.IO event, send email notification
   - `payment.failed` → update PaymentIntent status to `failed`, notify user
4. On `payment.paid`:
   - Find `PaymentIntent` by `paymongoIntentId`
   - Create `Payment` record with `status: PAID`, `paymentMethodId` = GCash/Maya method
   - Create `OfficialReceipt`
   - Update `Bill` status (PAID / PARTIALLY_PAID)
   - Emit `io.emit('payment:confirmed', { billId, paymentId })` for real-time frontend update
   - Queue email notification (async)

**Note:** Webhook endpoint must use `express.raw()` or `express.text()` middleware (not `express.json()`) to get raw body for signature verification. Handle this in `server.ts` before the general JSON middleware.

---

### TASK 1.6 — Frontend: Online Payment Flow for Residents
**Files (NEW/MODIFIED):**
- `frontend/src/pages/OnlinePayment.tsx` (NEW)
- `frontend/src/pages/PaymentSuccess.tsx` (NEW)
- `frontend/src/pages/PaymentFailed.tsx` (NEW)
- `frontend/src/services/payments.service.ts` (add new methods)
- `frontend/src/App.tsx` (add new routes)

**Steps:**

1. **Add routes to App.tsx:**
   ```tsx
   <Route path="/pay/:billId" element={<OnlinePayment />} />
   <Route path="/payment-success" element={<PaymentSuccess />} />
   <Route path="/payment-failed" element={<PaymentFailed />} />
   ```

2. **OnlinePayment.tsx:**
   - Load bill details using `billId` from URL params
   - Show bill summary: payer name, fee items, total due, penalties
   - Show payment method selector: GCash button, Maya button
   - On GCash click: call `paymentsService.initiateGCashPayment(billId)` → redirect to `checkoutUrl`
   - On Maya click: call `paymentsService.initiateMayaPayment(billId)` → redirect to `checkoutUrl`
   - Show amount prominently in PHP
   - Show "Secure Payment via PayMongo" trust badge

3. **PaymentSuccess.tsx:**
   - URL: `/payment-success?transactionId=xxx&billId=yyy`
   - Show success message with confetti animation (optional)
   - Display OR number and amount paid
   - Button: "Download Receipt" (PDF)
   - Button: "View My Bills"
   - Socket.IO listener: `socket.on('payment:confirmed', () => refetchBill())`

4. **PaymentFailed.tsx:**
   - Show failure reason
   - "Try Again" button → back to OnlinePayment
   - "Contact Support" info

5. **Add to BillDetail.tsx for residents:**
   - Add "Pay Online" button group: GCash | Maya
   - Only shown when bill is unpaid and user is resident

6. **payments.service.ts additions:**
   ```typescript
   initiateGCashPayment(billId: number)
   initiateMayaPayment(billId: number)
   getPaymentIntentStatus(intentId: string)
   ```

---

### TASK 1.7 — Real-Time Payment Status Update via Socket.IO
**Files:** `backend/src/server.ts`, `frontend/src/services/socket.ts` (NEW)

**Backend (already has Socket.IO set up):**
- In webhook handler (Task 1.5), emit `payment:confirmed` event with `{ billId, transactionId, orNumber }`

**Frontend:**
1. Create `frontend/src/services/socket.ts`:
   ```typescript
   import { io } from 'socket.io-client';
   export const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
   ```
2. In `OnlinePayment.tsx`, listen to `payment:confirmed` event
3. In `Dashboard.tsx` (cashier/admin view), listen for new payments to refresh KPIs
4. In `BillDetail.tsx`, listen for bill status changes

---

## PHASE 2 — Email & SMS Notifications

### TASK 2.1 — Install Email Dependencies
**Directory:** `backend/`
**Steps:**
1. `npm install nodemailer @types/nodemailer`
2. Create `backend/src/services/email.service.ts` (NEW)

---

### TASK 2.2 — Create Email Service
**File:** `backend/src/services/email.service.ts` (NEW)
**Steps:**
1. Create nodemailer transporter using `env.SMTP_*` config
2. Create `sendEmail(to, subject, html, attachments?)` base function
3. Create email template functions:
   - `sendWelcomeEmail(user)` — registration confirmation
   - `sendPasswordResetEmail(user, resetToken)` — forgot password
   - `sendPaymentConfirmationEmail(user, payment, receipt, pdfBuffer)` — payment receipt
   - `sendBillIssuedEmail(user, bill)` — new bill notification
   - `sendOverdueReminderEmail(user, bill, daysOverdue)` — overdue reminder
4. HTML templates must include:
   - Majayjay LGU logo/header
   - Proper Philippine peso formatting
   - Receipt verification QR code (in confirmation email)
   - Unsubscribe link (for reminders)
5. All `send*` functions return void and catch errors internally (never block payment flow)

---

### TASK 2.3 — Implement Forgot Password Reset Flow
**Files:** `backend/src/services/auth.service.ts`, `backend/prisma/schema.prisma`, `backend/src/controllers/auth.controller.ts`, `backend/src/routes/auth.routes.ts`
**Steps:**
1. Add `PasswordResetToken` model to Prisma schema:
   ```prisma
   model PasswordResetToken {
     id        Int      @id @default(autoincrement())
     userId    Int      @map("user_id")
     token     String   @unique
     expiresAt DateTime @map("expires_at")
     usedAt    DateTime? @map("used_at")
     createdAt DateTime @default(now()) @map("created_at")
     user      User     @relation(...)
     @@map("password_reset_tokens")
   }
   ```
2. Run migration
3. In `authService.forgotPassword()`:
   - Generate `crypto.randomBytes(32).toString('hex')` token
   - Hash token with bcrypt before storing (store hash, send plain)
   - Store in `PasswordResetToken` table with `expiresAt = now() + 1 hour`
   - Call `emailService.sendPasswordResetEmail(user, plainToken)`
4. Add `authService.resetPassword(token, newPassword)`:
   - Find token by hash, verify not expired and not used
   - Hash new password with bcrypt
   - Update `user.passwordHash`
   - Mark token as `usedAt = now()`
5. Add `POST /auth/reset-password` route + controller
6. **Frontend:** `ForgotPassword.tsx` is already built; ensure it calls the endpoint correctly. Add a `ResetPassword.tsx` page at route `/reset-password?token=xxx` that takes new password + confirm.

---

### TASK 2.4 — Create SMS Service
**File:** `backend/src/services/sms.service.ts` (NEW)
**Steps:**
1. Install Semaphore client: `npm install semaphore-sms` or implement via Axios to Semaphore API
2. Create `sendSMS(to: string, message: string)` function
3. Create SMS message templates:
   - `sendPaymentConfirmationSMS(contactNumber, amount, orNumber, date)`
   - `sendBillIssuedSMS(contactNumber, billNumber, dueDate, amount)`
   - `sendOverdueReminderSMS(contactNumber, billNumber, daysOverdue, amount)`
4. All SMS functions catch errors internally
5. Format PH phone numbers (add +63 prefix if needed)

---

### TASK 2.5 — Wire Notifications into Payment Flow
**Files:** `backend/src/services/payments.service.ts`, `backend/src/webhooks/paymongo.webhook.ts`
**Steps:**
1. In `recordCashPayment()`: after creating receipt, call:
   - `emailService.sendPaymentConfirmationEmail(...)` (async, don't await)
   - `smsService.sendPaymentConfirmationSMS(...)` (async, don't await)
   - Create `Notification` record in DB with `status: 'SENT'`
2. In PayMongo webhook `payment.paid` handler: same email/SMS calls
3. In `billsService.createBill()`: call `emailService.sendBillIssuedEmail(...)` and SMS

---

### TASK 2.6 — Automated Overdue Bill Processing (Cron Job)
**File:** `backend/src/jobs/overdue.job.ts` (NEW), `backend/src/server.ts` (register job)
**Steps:**
1. Install `node-cron`: `npm install node-cron @types/node-cron`
2. Create cron job that runs **daily at midnight**:
   ```typescript
   cron.schedule('0 0 * * *', async () => {
     // 1. Find all bills with status ISSUED/UNPAID and dueDate < today
     // 2. Update status to OVERDUE
     // 3. Calculate and store penalties in penalties table
     // 4. Update bill.penaltyAmount and bill.balanceAmount
     // 5. Create audit log
     // 6. Send overdue SMS/email to payers
   });
   ```
3. Register job in `server.ts` (import and call start function)
4. Add `lastPenaltyCalculatedAt DateTime? @map("last_penalty_calculated_at")` to Bill model to prevent double-calculation

---

## PHASE 3 — Receipt PDF Generation

### TASK 3.1 — Install PDF Library
**Directory:** `backend/`
**Steps:**
1. Install: `npm install pdfmake @types/pdfmake`
2. (Alternative if pdfmake has issues: `npm install jspdf` on frontend for client-side generation)
3. Download Majayjay LGU logo and place in `backend/src/assets/lgu-logo.png`

---

### TASK 3.2 — Create PDF Receipt Generator
**File:** `backend/src/utils/pdfGenerator.ts` (NEW)
**Steps:**
1. Create `generateReceiptPDF(receiptData: ReceiptData): Buffer` function
2. PDF layout must match the receipt format from `project-full-details.md`:
   - Header: "MUNICIPAL GOVERNMENT OF MAJAYJAY" + logo + "OFFICIAL RECEIPT"
   - OR Number (large, prominent)
   - Payer information section
   - Fee line items table
   - Subtotal / Penalties / Discount / Total section
   - Payment method
   - Cashier name, terminal
   - Footer: LGU contact info
   - QR code linking to receipt verification URL
3. Return `Buffer` (can be emailed as attachment or sent as download)

---

### TASK 3.3 — Receipt Download Endpoint
**Files:** `backend/src/controllers/payments.controller.ts`, `backend/src/routes/payments.routes.ts`
**Steps:**
1. Add `downloadReceipt(req, res, next)` controller method:
   - Fetch receipt from DB with all related data
   - Generate PDF buffer using `pdfGenerator.generateReceiptPDF()`
   - Set headers: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="receipt-OR123.pdf"`
   - Send buffer
2. Add route: `GET /payments/receipt/:id/download`

---

### TASK 3.4 — Frontend: Receipt Download Button
**Files:** `frontend/src/pages/PaymentDetail.tsx`, `frontend/src/pages/PaymentSuccess.tsx`
**Steps:**
1. Replace `window.print()` with a proper "Download PDF" button
2. `paymentsService.downloadReceiptPDF(receiptId)` that calls the new endpoint and triggers download
3. Add "Download Receipt" to PaymentSuccess page

---

### TASK 3.5 — Public Receipt Verification Page
**Files:** `frontend/src/pages/ReceiptVerify.tsx` (NEW), `frontend/src/App.tsx`
**Steps:**
1. Add public route (no auth required): `<Route path="/receipt/verify/:receiptId" element={<ReceiptVerify />} />`
2. `ReceiptVerify.tsx` page:
   - Fetch receipt by `receiptId` from `GET /payments/receipt/:id`
   - Display: OR Number, Date, Payer Name, Amount, Status, Payment Method
   - Show "VERIFIED ✓" or "INVALID" status clearly
   - Note: This page is linked from the QR code in the PDF receipt
3. This page is PUBLIC (no authentication needed) for receipt verification

---

## PHASE 4 — Missing Pages & UI Completeness

### TASK 4.1 — Resident Dashboard (Role-Based Dashboard)
**Files:** `frontend/src/pages/Dashboard.tsx`, `frontend/src/hooks/useAuth.ts`
**Steps:**
1. In `Dashboard.tsx`, check user role:
   ```tsx
   const { user, isAdmin, isCashier } = useAuth();
   if (user?.role?.roleName === 'resident') return <ResidentDashboard />;
   ```
2. Create `ResidentDashboard` component (in same file or separate):
   - "Outstanding Bills" card: count + total amount due
   - "Total Paid" card: lifetime paid amount
   - "Upcoming Due Dates" list: next 3 bills due
   - "Recent Payments" list: last 3 payments
   - "Pay Now" quick action for each unpaid bill
3. Fetch resident data from existing bills and payments endpoints (filter by `payerId = currentUser.id`)

---

### TASK 4.2 — Notification Center
**Files (NEW):**
- `frontend/src/components/common/NotificationBell.tsx`
- `frontend/src/pages/Notifications.tsx`
- `frontend/src/services/notifications.service.ts`

**Backend (NEW):**
- `GET /api/v1/notifications` — paginated notifications for current user
- `PUT /api/v1/notifications/:id/read` — mark single as read
- `PUT /api/v1/notifications/read-all` — mark all as read
- Add routes to `routes/index.ts`

**Steps:**
1. Create `notificationsController` and `notificationsService`
2. `NotificationBell.tsx`:
   - Bell icon in `Navbar.tsx` (top-right)
   - Badge showing unread count
   - Dropdown with last 5 notifications
   - "View All" link to `/notifications`
   - Socket.IO listener for real-time updates: `socket.on('notification:new', ...)`
3. `Notifications.tsx` full page: paginated list of all notifications, mark-as-read support

---

### TASK 4.3 — On-Demand Charges Page
**Files (NEW/MODIFIED):**
- `backend/src/controllers/charges.controller.ts`
- `backend/src/services/charges.service.ts`
- `backend/src/routes/charges.routes.ts`
- `frontend/src/pages/OnDemandCharges.tsx`
- `frontend/src/App.tsx`

**Backend Steps:**
1. `chargesService`:
   - `createCharge(dto)` — creates `OnDemandCharge` + generates QR code
   - `getCharges(params)` — paginated list
   - `getChargeById(id)` — with QR data
   - `markChargeUsed(id)` — after payment
2. Routes: `POST /charges`, `GET /charges`, `GET /charges/:id`

**Frontend Steps:**
1. Add `/charges` route to `App.tsx` (admin + cashier only)
2. `OnDemandCharges.tsx`:
   - "Create Charge" form: payer name (optional), fee description, amount
   - List of active/recent charges
   - "Generate QR" button per charge
   - QR modal displaying charge QR code
   - "Record Payment" button per charge

---

### TASK 4.4 — Bill Edit Page
**Files:** `backend/src/controllers/bills.controller.ts`, `backend/src/services/bills.service.ts`, `backend/src/routes/bills.routes.ts`, `frontend/src/pages/EditBill.tsx` (NEW)
**Steps:**
1. Backend: Add `PUT /bills/:id` endpoint:
   - Allow editing: `dueDate`, `notes`, `billingPeriodStart`, `billingPeriodEnd`
   - Allow adding/removing bill items (only for DRAFT status bills)
   - Recalculate `totalAmount` and `balanceAmount` after item changes
   - Log audit entry for bill edit
2. Frontend `EditBill.tsx`:
   - Pre-populate form from existing bill
   - Same layout as `CreateBill.tsx`
   - Only accessible for DRAFT/ISSUED bills
   - Cancel button + Save button
3. Add "Edit" button to `BillDetail.tsx` for admin/cashier when bill is in DRAFT/ISSUED status

---

### TASK 4.5 — Payer Detail / Resident History Page
**Files:** `frontend/src/pages/admin/PayerDetail.tsx` (NEW), `backend/src/routes/admin.routes.ts`
**Steps:**
1. Backend: Add `GET /admin/users/:id/profile`:
   - Returns user info + all bills + all payments + totals
2. Frontend `PayerDetail.tsx`:
   - User profile card (name, email, contact, address, barangay, role)
   - Stats: total paid, outstanding balance, number of payments
   - Bills table with status, due date, balance — sortable
   - Payments table with method, amount, date, OR number
   - "Create Bill for this Payer" button
   - "Export Statement of Account" PDF button
3. Link from `Users.tsx` admin page: clicking a user row navigates to PayerDetail

---

### TASK 4.6 — Statement of Account PDF Export (for Payer)
**File:** `backend/src/utils/pdfGenerator.ts` (add function), `backend/src/controllers/admin.controller.ts`
**Steps:**
1. Create `generateStatementOfAccountPDF(user, bills, payments)` function in pdfGenerator
2. PDF contains:
   - LGU header + logo
   - Payer full details
   - Table of all bills (bill number, date, fees, amount, status)
   - Table of all payments (date, OR number, method, amount)
   - Running balance
   - Certification statement (for official use)
3. Add `GET /admin/users/:id/statement-pdf` endpoint
4. Frontend: "Download Statement" button in PayerDetail page

---

### TASK 4.7 — Admin System Settings Page
**Files:** `backend/src/controllers/settings.controller.ts` (NEW), `backend/src/routes/settings.routes.ts` (NEW), `frontend/src/pages/admin/Settings.tsx` (NEW)
**Steps:**
1. `SystemSetting` model in Prisma:
   ```prisma
   model SystemSetting {
     key       String @id
     value     String
     updatedAt DateTime @updatedAt
     @@map("system_settings")
   }
   ```
2. Seed default settings: `or_number_prefix`, `system_name`, `lgu_address`, `email_notifications_enabled`, `sms_notifications_enabled`, `paymongo_mode` (`test`/`live`)
3. `GET /api/v1/admin/settings` — returns all settings as key-value object
4. `PUT /api/v1/admin/settings` — bulk update settings
5. Frontend Settings page with grouped sections:
   - General: system name, LGU address, logo upload
   - Notifications: email toggle, SMS toggle
   - Payment: PayMongo mode (test/live), per-method enable/disable
   - Security: session timeout, 2FA requirement
   - OR Numbering: prefix, reset frequency

---

### TASK 4.8 — Sortable Table Columns (All Tables)
**Files:** All table pages: `Bills.tsx`, `Payments.tsx`, `Users.tsx`, `Ledger.tsx`, `AuditLogs.tsx`, `Fees.tsx`
**Steps:**
1. Create reusable `SortableTableHead` component in `frontend/src/components/common/SortableTableHead.tsx`:
   ```tsx
   // Props: columns, sortBy, sortOrder, onSort
   // Renders TableHead with arrow icons on sortable columns
   ```
2. Add `sortBy` and `sortOrder` state to each table page
3. Pass `orderBy` and `orderDir` params to API calls
4. Update backend `getBills`, `getPayments`, `getUsers` to accept `orderBy` + `orderDir` query params and apply to Prisma `orderBy` clause

---

### TASK 4.9 — Advanced Filters Panel
**Files:** `frontend/src/pages/Bills.tsx`, `frontend/src/pages/Payments.tsx`
**Steps:**
1. Add "Advanced Filters" toggle button (Filter icon)
2. Collapsible panel with additional filters:
   - **Bills:** fee category (dropdown), billing year (year picker), amount range (min/max), department
   - **Payments:** cashier (search dropdown), payment method (dropdown), amount range
3. Show "X active filters" badge when filters applied
4. "Clear All" button resets all filters
5. Update API calls to include new filter params
6. Update backend services to handle new filter params

---

### TASK 4.10 — Pagination Size Selector
**Files:** All paginated table components
**Steps:**
1. Add `pageSize` state (default 20)
2. Add `<Select>` dropdown: 10, 25, 50, 100
3. Reset to page 1 when page size changes
4. Update all API calls to use dynamic `limit` param

---

### TASK 4.11 — Toast Notification System
**Files:** `frontend/src/components/common/Toast.tsx` (NEW), `frontend/src/store/slices/toastSlice.ts` (NEW)
**Steps:**
1. Add `react-hot-toast` or `notistack`: `npm install notistack`
2. Wrap App with `SnackbarProvider` in `main.tsx`
3. Replace all `setSuccessMsg()` / `setErrorMsg()` patterns across pages with `enqueueSnackbar('...', { variant: 'success' })`
4. Auto-dismiss after 4 seconds for success, 8 seconds for errors

---

### TASK 4.12 — Empty State Components
**Files:** `frontend/src/components/common/EmptyState.tsx` (NEW)
**Steps:**
1. Create `EmptyState` component:
   ```tsx
   // Props: icon, title, description, actionLabel, onAction
   ```
2. Use SVG icons from `@mui/icons-material` or custom illustrations
3. Replace all "No records found" text cells in tables with `<EmptyState>` component:
   - Bills: "No bills yet — Create First Bill" button
   - Payments: "No payments recorded"
   - Cashier search: "No bills found — Try different search"

---

### TASK 4.13 — Skeleton Loading Components
**Files:** All data pages
**Steps:**
1. Replace `CircularProgress` spinners with `<Skeleton>` from MUI in loading states
2. Create `SkeletonTable` component: renders N rows of skeleton cells matching the actual table layout
3. Create `SkeletonKPICards` for Dashboard loading state

---

## PHASE 5 — Reporting Enhancements

### TASK 5.1 — Revenue by Fee Category Report
**Files:** `backend/src/services/reports.service.ts`, `backend/src/controllers/reports.controller.ts`, `backend/src/routes/reports.routes.ts`, `frontend/src/pages/Reports.tsx`
**Steps:**
1. Backend: Add `getRevenueByCategory(startDate, endDate, departmentId?)`:
   - JOIN `payments → bill → bill_items → fees → fee_categories`
   - GROUP BY `fee_categories.category_name`
   - SUM `bill_items.amount` × payment completion ratio
   - Return array: `{ categoryName, total, count, percentage }`
2. Add `GET /reports/by-category` route
3. Frontend: New chart in Reports page — horizontal bar chart "Revenue by Fee Category"
4. Table below chart showing category breakdown

---

### TASK 5.2 — Department Filter in Reports
**Files:** `backend/src/services/reports.service.ts`, `frontend/src/pages/Reports.tsx`
**Steps:**
1. Backend: Add `departmentId` filter to `getCollectionReport`
2. For `department_viewer` role: automatically apply their `departmentId` filter
3. Frontend: Add "Department" filter dropdown in Reports page (only shown to admin)
4. Department viewer automatically sees filtered data (no selector needed — backend enforces it)

---

### TASK 5.3 — Overdue Bills Aging Report
**Files:** `backend/src/services/reports.service.ts`, `backend/src/routes/reports.routes.ts`, `frontend/src/pages/Reports.tsx`
**Steps:**
1. Backend: Add `getOverdueBillsAging()`:
   - Query all overdue/unpaid bills
   - Calculate days overdue for each
   - Bucket into: current, 1-30, 31-60, 61-90, 90+
   - Return bucket counts and total amounts
2. Frontend: New "Aging Analysis" card in Reports page with stacked bar chart

---

### TASK 5.4 — Daily Cashier Summary PDF
**Files:** `backend/src/controllers/reports.controller.ts`, `backend/src/utils/pdfGenerator.ts`
**Steps:**
1. Add `generateDailySummaryPDF(cashierId?, date)` in pdfGenerator
2. Add `GET /reports/daily-summary/pdf` endpoint
3. Frontend: "Export PDF" button in the daily summary section of Reports page (for cashiers)

---

### TASK 5.5 — Export Reports to PDF
**Files:** `frontend/src/pages/Reports.tsx`
**Steps:**
1. Add "Export PDF" button alongside existing "Export CSV" button
2. Client-side approach: Install `jspdf` + `jspdf-autotable`: `npm install jspdf jspdf-autotable`
3. Generate PDF with:
   - LGU header
   - Report date range
   - Summary cards data
   - Transactions table
4. Trigger download as `collection-report-YYYY-MM-DD.pdf`

---

### TASK 5.6 — Dashboard Enhancements
**Files:** `frontend/src/pages/Dashboard.tsx`, `backend/src/services/reports.service.ts`
**Steps:**
1. Backend: Enhance `getDashboardKPIs()` to also return:
   - Top 5 fee categories this month
   - Overdue bills count by age bracket
   - Year-over-year comparison
2. Frontend: Add to Dashboard:
   - "Top Fee Categories" table widget
   - "Overdue Aging" mini chart
   - Date range picker (currently locked to current month)
   - Department performance table (admin only)

---

## PHASE 6 — Cashier Terminal Enhancements

### TASK 6.1 — Cashier Session / Shift Management
**Files:** `backend/prisma/schema.prisma`, `backend/src/services/cashier.service.ts` (NEW), `frontend/src/pages/Cashier.tsx`
**Steps:**
1. Add `CashierSession` model to schema:
   ```prisma
   model CashierSession {
     id                  Int       @id @default(autoincrement())
     cashierId           Int       @map("cashier_id")
     shiftDate           DateTime  @db.Date @map("shift_date")
     shiftStartTime      DateTime  @map("shift_start_time")
     shiftEndTime        DateTime? @map("shift_end_time")
     openingCashAmount   Decimal   @db.Decimal(12, 2) @map("opening_cash_amount")
     closingCashAmount   Decimal?  @db.Decimal(12, 2) @map("closing_cash_amount")
     transactionsCount   Int       @default(0) @map("transactions_count")
     totalCollected      Decimal   @default(0) @db.Decimal(12, 2) @map("total_collected")
     terminalId          String?   @map("terminal_id")
     notes               String?
     createdAt           DateTime  @default(now()) @map("created_at")
     cashier User @relation(...)
     @@map("cashier_sessions")
   }
   ```
2. Run migration
3. Backend: `POST /cashier/session/start`, `POST /cashier/session/end`
4. Frontend: On Cashier page load, check if active session exists:
   - If no session: show "Start Shift" modal (enter opening cash amount)
   - If session active: show shift info bar at top of cashier page
   - "End Shift" button: shows closing cash amount entry + reconciliation summary
5. Auto-increment `transactionsCount` and `totalCollected` when cash payment recorded

---

### TASK 6.2 — Advanced Search in Cashier Terminal
**Files:** `frontend/src/pages/Cashier.tsx`, `backend/src/services/bills.service.ts`
**Steps:**
1. Backend: Enhance `searchBills()` to support:
   - `barangay` filter
   - `feeCategoryId` filter
   - `overdueOnly` boolean flag
   - `amountRange` (min/max)
2. Frontend: Add "Advanced Search" toggle in Cashier terminal:
   - Barangay dropdown
   - Fee category dropdown
   - "Show Overdue Only" toggle
3. Display search results count prominently
4. "Show All Overdue Bills" quick button

---

### TASK 6.3 — Keyboard Shortcuts in Cashier Terminal
**Files:** `frontend/src/pages/Cashier.tsx`
**Steps:**
1. Add `useEffect` with `keydown` event listener:
   - `Enter` → submit search (if search field focused)
   - `Escape` → clear selected bill
   - `Ctrl+P` → trigger cash payment
   - `Ctrl+Q` → generate QR code
   - `Ctrl+N` → new search (clear and focus)
2. Add keyboard shortcut hint tooltip on buttons

---

### TASK 6.4 — Cash Payment: Change Amount Calculator
**Files:** `frontend/src/pages/Cashier.tsx`, `frontend/src/pages/BillDetail.tsx`
**Steps:**
1. In cash payment dialog, add "Amount Tendered" field (what the customer gives)
2. Auto-calculate and display "Change: ₱X.XX" in real-time
3. Validate: tendered amount must be ≥ balance due
4. Pass `changAmount` to receipt generation for printed receipts

---

## PHASE 7 — Backend API Completions

### TASK 7.1 — Tiered Fee Calculation
**Files:** `backend/src/services/bills.service.ts`
**Steps:**
1. In `createBill()`, add `TIERED` case to fee calculation:
```typescript
} else if (fee.feeType === 'TIERED' && fee.tierConfiguration) {
  const config = fee.tierConfiguration as { tiers: Array<{ min: number; max: number; rate: number }> };
  const baseValue = item.unitCount || 0;
  const tier = config.tiers.find(t => baseValue >= t.min && baseValue <= t.max);
  if (tier) amount = baseValue * tier.rate;
}
```
2. Add test for tiered fee calculation in `billsService.createBill()`

---

### TASK 7.2 — Bill Export Endpoint
**Files:** `backend/src/controllers/bills.controller.ts`, `backend/src/routes/bills.routes.ts`
**Steps:**
1. Add `exportBills(req, res, next)`:
   - Accepts same filters as `getBills` but no pagination
   - Returns CSV or triggers PDF generation
2. Route: `GET /bills/export?format=csv`
3. Frontend: "Export" button in Bills page (admin only)

---

### TASK 7.3 — Soft Delete for Fees
**Files:** `backend/prisma/schema.prisma`, `backend/src/controllers/admin.controller.ts`
**Steps:**
1. Add `deletedAt DateTime? @map("deleted_at")` to Fee model
2. Add `DELETE /admin/fees/:id` route that sets `deletedAt` instead of hard delete
3. All fee queries filter `where: { deletedAt: null }`

---

### TASK 7.4 — Health Check Enhancement
**Files:** `backend/src/routes/index.ts`
**Steps:**
1. Enhance `/health` endpoint:
   ```typescript
   const dbCheck = await prisma.$queryRaw`SELECT 1`;
   return { status: 'healthy', db: 'connected', uptime: process.uptime(), timestamp: new Date() };
   ```
2. Return 503 if DB check fails

---

### TASK 7.5 — Batch Bill Generation
**Files:** `backend/src/services/bills.service.ts`, `backend/src/controllers/bills.controller.ts`, `backend/src/routes/bills.routes.ts`, `frontend/src/pages/BatchCreateBills.tsx` (NEW)
**Steps:**
1. Backend: Add `createBatchBills(feeCategoryId, dueDate, payerIds[])`:
   - Loop through payer IDs
   - Create bill for each with the specified fee category's fees
   - Return: `{ created: N, failed: M, bills: [...] }`
2. Route: `POST /bills/batch`
3. Frontend page at `/bills/batch-create` (admin only):
   - Step 1: Select fee category
   - Step 2: Select payers (from table with checkboxes, or "All Active Residents" option)
   - Step 3: Set due date and billing period
   - Preview: shows how many bills will be created
   - Confirmation button
   - Progress bar during creation
   - Result summary

---

### TASK 7.6 — Payment Refund Endpoint
**Files:** `backend/src/services/payments.service.ts`, `backend/src/controllers/payments.controller.ts`
**Steps:**
1. Add `processRefund(paymentId, amount, reason, adminId)`:
   - Find payment, verify it can be refunded (status = PAID)
   - If PayMongo payment: call `paymongoService.createRefund()`
   - Create `Refund` record in DB
   - Update payment status to `REFUNDED`
   - Update bill status back (recalculate)
   - Generate refund notification
2. Route: `POST /payments/:id/refund` (admin only)

---

### TASK 7.7 — Swagger / API Documentation
**Files:** `backend/package.json`, `backend/src/server.ts`, all route files
**Steps:**
1. Install: `npm install swagger-ui-express swagger-jsdoc @types/swagger-ui-express`
2. Create `backend/src/config/swagger.ts` with OpenAPI spec header
3. Add JSDoc comments to all route handlers
4. Serve Swagger UI at `/api/docs` (development only)
5. Document all endpoints with request/response schemas

---

## PHASE 8 — Branding, UI Polish & Accessibility

### TASK 8.1 — LGU Logo & Branding
**Files:** `frontend/src/components/common/Navbar.tsx`, `frontend/src/components/common/Sidebar.tsx`, `frontend/index.html`
**Steps:**
1. Add Majayjay LGU official seal/logo as SVG or PNG to `frontend/src/assets/`
2. Display logo in Navbar left side and Sidebar header
3. Update `index.html` `<title>` and `<meta>` tags
4. Add favicon (`frontend/public/favicon.ico`)

---

### TASK 8.2 — Print Stylesheet for Receipts
**Files:** `frontend/src/index.css`
**Steps:**
1. Add `@media print` CSS block:
   - Hide Navbar, Sidebar, action buttons
   - Show only receipt content
   - Proper receipt margins
   - Force black-and-white printing
   - Force page breaks where needed
2. Add print-specific classes to `PaymentDetail.tsx`

---

### TASK 8.3 — Mobile Responsiveness Improvements
**Files:** `frontend/src/components/common/Sidebar.tsx`, `frontend/src/pages/Cashier.tsx`
**Steps:**
1. Make Sidebar a drawer on mobile (hamburger menu button in Navbar)
2. Cashier terminal: stack search and payment panels vertically on mobile
3. Use `useMediaQuery` from MUI for responsive breakpoints
4. Tables: on mobile, hide secondary columns or use card-based layout

---

### TASK 8.4 — Consistent Loading & Error States
**Files:** All page components
**Steps:**
1. Create `LoadingState` component (skeleton variant, not spinner)
2. Create `ErrorState` component with retry button and error message
3. Create `EmptyState` component with icon, title, action button
4. Replace ad-hoc loading/error UI across all pages with these components

---

## PHASE 9 — Testing

### TASK 9.1 — Backend Unit Tests
**Files:** `backend/src/utils/penaltyCalculator.test.ts` (NEW), `backend/src/services/auth.service.test.ts` (NEW)
**Steps:**
1. Install test dependencies: `npm install -D jest ts-jest @types/jest`
2. Configure `jest.config.ts`
3. Write tests for `penaltyCalculator.ts`:
   - No penalty before due date
   - Fixed late penalty after grace period
   - Monthly interest calculation
   - Max penalty cap
   - Multiple rules applied
4. Write auth service tests:
   - Register new user
   - Register duplicate email throws
   - Login with correct credentials
   - Login with wrong password throws + increments counter
   - Account lockout after 5 failures

---

### TASK 9.2 — PayMongo Webhook Tests
**File:** `backend/src/webhooks/paymongo.webhook.test.ts` (NEW)
**Steps:**
1. Test signature verification (valid and invalid signatures)
2. Test `payment.paid` handler updates bill to PAID
3. Test `payment.failed` handler updates intent to failed
4. Use mocked Prisma client

---

## PHASE 10 — Deployment & DevOps

### TASK 10.1 — Dockerfile (Backend)
**File:** `backend/Dockerfile` (NEW)
**Steps:**
1. Multi-stage build: build stage + production stage
2. Install only production dependencies in final image
3. Run Prisma generate as part of build
4. Expose port 5000
5. `CMD ["node", "dist/server.js"]`

---

### TASK 10.2 — Dockerfile (Frontend)
**File:** `frontend/Dockerfile` (NEW)
**Steps:**
1. Build stage: `npm run build`
2. Serve stage: nginx serving `dist/`
3. `nginx.conf` with SPA routing (all routes serve `index.html`)

---

### TASK 10.3 — Docker Compose
**File:** `docker-compose.yml` (NEW in root)
**Steps:**
1. Services: `backend`, `frontend`, `postgres` (local dev DB)
2. Environment variables via `.env` file
3. Volume mounts for Postgres data
4. Health checks for all services

---

### TASK 10.4 — .env.example Files
**Files:** `backend/.env.example`, `frontend/.env.example`
**Steps:**
1. Create `.env.example` with all required keys and placeholder values
2. Document each variable with comments
3. Verify `.env` files are in `.gitignore`

---

## EXECUTION PRIORITY SUMMARY

| Phase | Tasks | Priority | Estimated Effort |
|---|---|---|---|
| Phase -1 — Fix Wrong Processes | 7 tasks | 🚨 Fix immediately | < 1 day |
| Phase 0 — Foundation & Security | 8 tasks | 🔴 Do first | 2-3 days |
| Phase 1 — PayMongo Integration | 7 tasks | 🔴 Core feature | 5-7 days |
| Phase 2 — Email & SMS Notifications | 6 tasks | 🟠 High | 3-4 days |
| Phase 3 — Receipt PDF | 5 tasks | 🟠 High | 2-3 days |
| Phase 4 — Missing Pages & UI | 13 tasks | 🟡 Medium | 7-10 days |
| Phase 5 — Reporting | 6 tasks | 🟡 Medium | 3-4 days |
| Phase 6 — Cashier Enhancements | 4 tasks | 🟡 Medium | 2-3 days |
| Phase 7 — Backend API Completions | 7 tasks | 🟡 Medium | 4-5 days |
| Phase 8 — Branding & Polish | 4 tasks | 🔵 Lower | 2-3 days |
| Phase 9 — Testing | 2 tasks | 🔵 Lower | 3-4 days |
| Phase 10 — Deployment | 4 tasks | 🔵 DevOps | 2 days |

---

## DEPENDENCIES MAP

```
Phase -1 (Fix Wrong Processes) — No dependencies, standalone fixes
  └→ All other phases benefit from correct role logic being in place first
Phase 0 (Security/Foundation)
  └→ Phase 1 (PayMongo) — depends on Task 0.6 (schema), 0.1 (env)
       └→ Phase 2 (Notifications) — depends on Phase 1 webhook (2.5)
       └→ Phase 3 (PDF) — depends on Phase 1 payment data
Phase 0 Task 0.3 (forgot password)
  └→ Phase 2 Task 2.3 (email reset flow)
Phase 0 Task 0.6 (schema)
  └→ Phase 4 Task 4.2 (notifications center) — needs notifications table
  └→ Phase 6 Task 6.1 (cashier sessions) — needs cashier_sessions table
Phase 3 Task 3.2 (PDF generator)
  └→ Phase 3 Task 3.3 (receipt download endpoint)
  └→ Phase 5 Task 5.4 (daily summary PDF)
  └→ Phase 4 Task 4.6 (statement of account PDF)
```

---

## KEY PAYMONGO API REFERENCE

```
Base URL: https://api.paymongo.com/v1

Auth: Basic base64(secret_key:)  ← note the colon after the key

Create Source (GCash):
POST /sources
{
  "data": {
    "attributes": {
      "amount": 50000,  ← in centavos (PHP 500.00)
      "redirect": {
        "success": "https://your-domain.com/payment-success",
        "failed": "https://your-domain.com/payment-failed"
      },
      "type": "gcash",
      "currency": "PHP"
    }
  }
}

Create Source (Maya):
Same but "type": "paymaya"

Webhook Events to handle:
- source.chargeable  → create charge
- payment.paid       → confirm payment
- payment.failed     → handle failure

Signature verification:
Header: paymongo-signature
Compute: HMAC-SHA256(rawBody, PAYMONGO_WEBHOOK_SECRET)
Compare: timingSafeEqual(received, computed)
```

---

## NOTES FOR DEVELOPERS

1. **Never await email/SMS sends inside payment recording** — queue them asynchronously or fire-and-forget. A failed email must never roll back a payment.
2. **All amounts in the DB are in PHP (not centavos)** — convert to centavos ONLY when calling PayMongo API (`amount * 100`).
3. **OR numbers must be sequential with no gaps** — when generating OR numbers, use a DB sequence or atomic increment to prevent gaps (audit requirement).
4. **Webhook idempotency** — PayMongo may send the same webhook multiple times. Check `if (payment.status === 'PAID') return` before processing to avoid duplicate receipt generation.
5. **Test PayMongo with test keys first** — use `pk_test_*` and `sk_test_*` keys. GCash test flow uses a test URL that simulates payment.
6. **Keep audit logs immutable** — never UPDATE or DELETE audit log records. They are the COA compliance record.
7. **Residents should ONLY see their own data** — enforce `payerId = req.user.sub` check on ALL resident-role queries.
