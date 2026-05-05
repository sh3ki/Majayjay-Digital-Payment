import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import {
  generateTransactionId,
  generateOrNumber,
  buildReceiptData,
} from '../utils/receiptGenerator';
import { generateQRCode } from '../utils/qrGenerator';
import { env } from '../config/env';

export interface RecordCashPaymentDto {
  billId: number;
  payerId: number;
  amount: number;
  cashierId: number;
  terminalId?: string;
  referenceNumber?: string;
}

export interface CreateDigitalPaymentDto {
  billId: number;
  payerId: number;
  amount: number;
  paymentMethodName: string;
}

export const paymentsService = {
  async recordCashPayment(dto: RecordCashPaymentDto) {
    const bill = await prisma.bill.findUnique({
      where: { id: dto.billId },
      include: { items: { include: { fee: true } }, payer: true },
    });
    if (!bill) throw new Error('Bill not found');
    if (bill.status === 'PAID') throw new Error('Bill is already paid');

    const cashMethod = await prisma.paymentMethod.findUnique({ where: { methodName: 'Cash' } });
    if (!cashMethod) throw new Error('Cash payment method not found');

    const transactionId = generateTransactionId();
    const orNumber = generateOrNumber();

    const payment = await prisma.payment.create({
      data: {
        transactionId,
        billId: dto.billId,
        payerId: dto.payerId,
        amount: dto.amount,
        paymentMethodId: cashMethod.id,
        status: 'PAID',
        referenceNumber: referenceNumber(dto),
        cashierId: dto.cashierId,
        terminalId: dto.terminalId,
        paymentDate: new Date(),
        verifiedAt: new Date(),
        verifiedById: dto.cashierId,
      },
    });

    const newPaidAmount = parseFloat(bill.paidAmount.toString()) + dto.amount;
    const newBalance = parseFloat(bill.totalAmount.toString()) - newPaidAmount;
    const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';

    await prisma.bill.update({
      where: { id: dto.billId },
      data: {
        paidAmount: newPaidAmount,
        balanceAmount: Math.max(0, newBalance),
        status: newStatus,
      },
    });

    const cashier = await prisma.user.findUnique({ where: { id: dto.cashierId } });
    const receiptData = buildReceiptData({
      orNumber,
      receiptId: '',
      payerFirstName: bill.payer.firstName,
      payerLastName: bill.payer.lastName,
      billNumber: bill.billNumber,
      items: bill.items.map((i) => ({ feeName: i.feeName, amount: parseFloat(i.amount.toString()) })),
      totalAmount: dto.amount,
      penaltyAmount: parseFloat(bill.penaltyAmount.toString()),
      discountAmount: parseFloat(bill.discountAmount.toString()),
      paymentMethod: 'Cash',
      cashierName: cashier ? `${cashier.firstName} ${cashier.lastName}` : undefined,
      terminalId: dto.terminalId,
    });

    const receipt = await prisma.officialReceipt.create({
      data: {
        orNumber,
        paymentId: payment.id,
        billId: dto.billId,
        amountPaid: dto.amount,
        paymentMethod: 'Cash',
        cashierId: dto.cashierId,
        terminalId: dto.terminalId,
        orData: receiptData as unknown as Prisma.InputJsonValue,
        status: 'GENERATED',
      },
    });

    await prisma.auditLog.create({
      data: {
        eventType: 'PAYMENT_CREATED',
        userId: dto.cashierId,
        entityType: 'payment',
        entityId: transactionId,
        action: 'CREATE',
        newValue: JSON.stringify({ amount: dto.amount, method: 'Cash', billId: dto.billId }),
        status: 'SUCCESS',
      },
    });

    return { payment, receipt };
  },

  async getPayments(params: {
    page: number;
    limit: number;
    status?: string;
    payerId?: number;
    startDate?: string;
    endDate?: string;
    paymentMethod?: string;
  }) {
    const { page, limit, status, payerId, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (payerId) where.payerId = payerId;
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) (where.paymentDate as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.paymentDate as Record<string, unknown>).lte = new Date(endDate);
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paymentDate: 'desc' },
        include: {
          payer: { select: { id: true, firstName: true, lastName: true, email: true } },
          method: true,
          bill: { select: { id: true, billNumber: true } },
          receipt: true,
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return { payments, total };
  },

  async getPaymentById(id: number, currentUserId?: number, userRole?: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        payer: { select: { id: true, firstName: true, lastName: true, email: true } },
        method: true,
        bill: { include: { items: true } },
        receipt: true,
        cashier: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!payment) throw new Error('Payment not found');
    if (userRole === 'resident' && currentUserId !== payment.payerId) {
      throw new Error('Access denied');
    }
    return payment;
  },

  async generateQRForBill(billId: number, createdById: number) {
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: { items: true, payer: true },
    });
    if (!bill) throw new Error('Bill not found');

    // QR encodes the bill detail URL — scan → redirect to bill details
    const billUrl = `${env.FRONTEND_URL}/bills/${billId}`;

    const qrData = {
      type: 'BILL',
      billId,
      billNumber: bill.billNumber,
      amount: parseFloat(bill.balanceAmount.toString()),
      currency: 'PHP',
      payerReference: bill.billNumber,
      dueDate: bill.dueDate.toISOString().split('T')[0],
      systemId: 'MAJAYJAY_LGU',
      url: billUrl,
    };

    const qrImageDataUrl = await generateQRCode(billUrl);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const qrCode = await prisma.qRCode.create({
      data: {
        billId,
        transactionId: `BILL-${billId}-${Date.now()}`,
        amount: parseFloat(bill.balanceAmount.toString()),
        feeType: bill.items.map((i) => i.feeName).join(', '),
        payerReference: bill.billNumber,
        qrImageUrl: qrImageDataUrl,
        encodedData: qrData as unknown as Prisma.InputJsonValue,
        expiresAt,
      },
    });

    return { qrCode, qrImageDataUrl, billUrl, billNumber: bill.billNumber };
  },

  async generateQRForPayment(paymentId: number) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { payer: true, bill: true, receipt: true },
    });
    if (!payment) throw new Error('Payment not found');

    const paymentUrl = `${env.FRONTEND_URL}/payments/${paymentId}`;

    const qrData = {
      type: 'PAYMENT',
      paymentId,
      transactionId: payment.transactionId,
      amount: parseFloat(payment.amount.toString()),
      currency: 'PHP',
      systemId: 'MAJAYJAY_LGU',
      url: paymentUrl,
    };

    const qrImageDataUrl = await generateQRCode(paymentUrl);

    return { qrImageDataUrl, paymentUrl, transactionId: payment.transactionId };
  },
};

function referenceNumber(dto: RecordCashPaymentDto): string {
  return dto.referenceNumber || `CASH-${Date.now()}`;
}
