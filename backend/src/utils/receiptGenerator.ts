import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';

export function generateOrNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `OR-${year}-${month}-${day}-${seq}`;
}

export function generateTransactionId(): string {
  const now = new Date();
  const ts = now.getTime().toString(36).toUpperCase();
  return `TXN-${ts}-${uuidv4().split('-')[0].toUpperCase()}`;
}

export function generateBillNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0');
  return `BILL-${year}-${month}-${seq}`;
}

export function generateChargeNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  return `CHG-${ts}`;
}

export async function generateSequentialBillNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const month = String(monthIndex + 1).padStart(2, '0');
  const start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  const count = await prisma.bill.count({ where: { billDate: { gte: start, lte: end } } });
  const seq = String(count + 1).padStart(5, '0');
  return `BILL-${year}-${month}-${seq}`;
}

export async function generateSequentialTransactionId(): Promise<string> {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const start = new Date(y, now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(y, now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const count = await prisma.payment.count({ where: { paymentDate: { gte: start, lte: end } } });
  const seq = String(count + 1).padStart(6, '0');
  return `TXN-${y}${m}${d}-${seq}`;
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

export function buildReceiptData(params: {
  orNumber: string;
  receiptId: string;
  payerFirstName: string;
  payerLastName: string;
  billNumber?: string;
  items: Array<{ feeName: string; amount: number }>;
  totalAmount: number;
  penaltyAmount: number;
  discountAmount: number;
  paymentMethod: string;
  cashierName?: string;
  terminalId?: string;
}): ReceiptData {
  const now = new Date();
  return {
    orNumber: params.orNumber,
    receiptId: params.receiptId,
    date: now.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }),
    time: now.toLocaleTimeString('en-PH'),
    payerName: `${params.payerFirstName} ${params.payerLastName}`,
    payerReference: params.billNumber,
    items: params.items.map((i) => ({ description: i.feeName, amount: i.amount })),
    subtotal: params.totalAmount,
    penalties: params.penaltyAmount,
    discount: params.discountAmount,
    totalPaid: params.totalAmount + params.penaltyAmount - params.discountAmount,
    paymentMethod: params.paymentMethod,
    cashier: params.cashierName,
    terminal: params.terminalId,
    verificationUrl: `${process.env.FRONTEND_URL}/receipt/verify/${params.receiptId}`,
  };
}
