// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  contactNumber?: string;
  address?: string;
  barangay?: string;
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  role: { roleName: string; description?: string };
  department?: { id: number; departmentName: string };
}

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
export type UserRole = 'admin' | 'cashier' | 'collector' | 'department_viewer' | 'resident';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  pendingVerificationUserId: number | null;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
}

// ─── Bills ───────────────────────────────────────────────────────────────────

export type BillStatus = 'DRAFT' | 'ISSUED' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'OVERDUE';

export interface BillItem {
  id: number;
  feeId: number;
  feeName: string;
  unitCount?: number;
  unitPrice?: number;
  amount: number;
  fee?: Fee;
}

export interface Bill {
  id: number;
  billNumber: string;
  payerId: number;
  billDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  penaltyAmount: number;
  discountAmount: number;
  status: BillStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  payer?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'contactNumber'>;
  items?: BillItem[];
  payments?: Payment[];
  receipts?: OfficialReceipt[];
  currentPenalties?: PenaltyResult[];
  currentPenaltyTotal?: number;
}

export interface CreateBillDto {
  payerId: number;
  billType?: 'INDIVIDUAL' | 'BUSINESS';
  dueDate: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  notes?: string;
  items: Array<{ feeId: number; quantity?: number; unitCount?: number; overrideAmount?: number }>;
}

// ─── Fees ────────────────────────────────────────────────────────────────────

export type FeeType = 'FIXED' | 'VARIABLE' | 'PERCENTAGE' | 'TIERED';
export type ApplicableTo = 'INDIVIDUAL' | 'BUSINESS' | 'BOTH';

export interface FeeCategory {
  id: number;
  categoryName: string;
  description?: string;
  displayOrder: number;
  active: boolean;
}

export interface Fee {
  id: number;
  feeName: string;
  description?: string;
  categoryId: number;
  feeType: FeeType;
  baseAmount?: number;
  unitName?: string;
  unitRate?: number;
  percentageRate?: number;
  tierConfiguration?: unknown;
  applicableTo: ApplicableTo;
  active: boolean;
  createdAt: string;
  category?: FeeCategory;
  penaltyRules?: PenaltyRule[];
}

// ─── Payments ────────────────────────────────────────────────────────────────

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface PaymentMethod {
  id: number;
  methodName: string;
  provider?: string;
  isActive: boolean;
  maxTransactionAmount?: number;
  minTransactionAmount?: number;
  transactionFeePercent?: number;
}

export interface Payment {
  id: number;
  transactionId: string;
  billId?: number;
  payerId: number;
  amount: number;
  paymentMethodId: number;
  status: PaymentStatus;
  referenceNumber?: string;
  notes?: string;
  cashierId?: number;
  terminalId?: string;
  paymentDate: string;
  verifiedAt?: string;
  createdAt: string;
  payer?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
  method?: PaymentMethod;
  bill?: Pick<Bill, 'id' | 'billNumber'>;
  receipt?: OfficialReceipt;
  cashier?: Pick<User, 'id' | 'firstName' | 'lastName'>;
}

// ─── Receipts ────────────────────────────────────────────────────────────────

export type ReceiptStatus = 'GENERATED' | 'DELIVERED' | 'PRINTED' | 'CANCELLED';

export interface OfficialReceipt {
  id: number;
  orNumber: string;
  receiptId: string;
  paymentId: number;
  billId?: number;
  amountPaid: number;
  paymentMethod?: string;
  cashierId?: number;
  terminalId?: string;
  orData?: ReceiptData;
  status: ReceiptStatus;
  createdAt: string;
  payment?: Payment;
  bill?: Pick<Bill, 'id' | 'billNumber' | 'items'>;
}

export interface ReceiptData {
  orNumber: string;
  receiptId: string;
  date: string;
  time: string;
  payerName: string;
  payerReference?: string;
  items: Array<{ description: string; amount: number }>;
  subtotal: number;
  penalties: number;
  discount: number;
  totalPaid: number;
  paymentMethod: string;
  cashier?: string;
  terminal?: string;
  verificationUrl: string;
}

// ─── QR Codes ────────────────────────────────────────────────────────────────

export interface QRCode {
  id: number;
  qrCode: string;
  billId?: number;
  transactionId?: string;
  amount: number;
  feeType?: string;
  payerReference?: string;
  qrImageUrl?: string;
  encodedData?: Record<string, unknown>;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';
  scannedCount: number;
  createdAt: string;
  expiresAt: string;
}

// ─── Penalties ───────────────────────────────────────────────────────────────

export type PenaltyType = 'LATE' | 'INTEREST' | 'SURCHARGE';
export type CalculationMethod = 'FIXED' | 'PERCENTAGE';

export interface PenaltyRule {
  id: number;
  feeId: number;
  penaltyType: PenaltyType;
  calculationMethod: CalculationMethod;
  amountOrRate: number;
  gracePeriodDays: number;
  maxPenaltyAmount?: number;
  applyMonthly: boolean;
  active: boolean;
  createdAt: string;
  fee?: Pick<Fee, 'feeName'>;
}

export interface PenaltyResult {
  ruleId: number;
  type: string;
  amount: number;
  reason: string;
}

// ─── Dashboard & Reports ─────────────────────────────────────────────────────

export interface DashboardKPIs {
  thisMonthCollection: number;
  lastMonthCollection: number;
  monthOverMonth: number;
  totalOutstanding: number;
  outstandingCount: number;
  pendingPayments: number;
  successRate: number;
  recentTransactions: Payment[];
}

export interface MonthlyRevenue {
  month: number;
  monthName: string;
  total: number;
  count: number;
}

export interface PaymentMethodBreakdown {
  methodName: string;
  total: number;
  count: number;
  percentage: number;
}

export interface CollectionReport {
  payments: Payment[];
  summary: {
    total: number;
    count: number;
    byMethod: Array<{ method: string; total: number; count: number }>;
  };
}

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  eventType: string;
  userId?: number;
  entityType: string;
  entityId: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILURE';
  reason?: string;
  createdAt: string;
  user?: Pick<User, 'firstName' | 'lastName' | 'email'>;
}

// ─── Departments ─────────────────────────────────────────────────────────────

export interface Department {
  id: number;
  departmentName: string;
  departmentHeadId?: number;
  contactEmail?: string;
  contactPhone?: string;
  officeLocation?: string;
  active: boolean;
}

// ─── API Response ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  status: number;
  message: string;
  data?: T;
  errors?: Array<{ field?: string; message: string }>;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}
