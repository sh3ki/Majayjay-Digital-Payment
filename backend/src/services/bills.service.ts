import prisma from '../config/database';
import { generateBillNumber } from '../utils/receiptGenerator';
import { calculatePenalties, calculateTotalPenalty } from '../utils/penaltyCalculator';

export interface CreateBillDto {
  payerId: number;
  billDate?: string;
  dueDate: string;
  notes?: string;
  items: Array<{
    feeId: number;
    unitCount?: number;
  }>;
}

export const billsService = {
  async getBills(params: {
    page: number;
    limit: number;
    status?: string;
    payerId?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page, limit, status, payerId, search, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (payerId) where.payerId = payerId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { billNumber: { contains: search, mode: 'insensitive' } },
        { payer: { firstName: { contains: search, mode: 'insensitive' } } },
        { payer: { lastName: { contains: search, mode: 'insensitive' } } },
        { payer: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          payer: { select: { id: true, firstName: true, lastName: true, email: true, contactNumber: true } },
          items: { include: { fee: true } },
          creator: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.bill.count({ where }),
    ]);

    return { bills, total };
  },

  async getBillById(id: number, currentUserId?: number, userRole?: string) {
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        payer: { select: { id: true, firstName: true, lastName: true, email: true, contactNumber: true } },
        items: { include: { fee: { include: { penaltyRules: true } } } },
        payments: { include: { method: true }, orderBy: { createdAt: 'desc' } },
        penalties: { include: { rule: true } },
        receipts: true,
        creator: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!bill) throw new Error('Bill not found');

    if (userRole === 'resident' && bill.payerId !== currentUserId) {
      throw new Error('Access denied');
    }

    // Calculate current penalties
    const penaltyRules = bill.items.flatMap((item) => item.fee.penaltyRules);
    const penalties = calculatePenalties(
      { ...bill, items: bill.items.map((i) => ({ amount: parseFloat(i.amount.toString()), feeId: i.feeId })) } as Parameters<typeof calculatePenalties>[0],
      penaltyRules
    );
    const currentPenaltyTotal = calculateTotalPenalty(penalties);

    return { ...bill, currentPenalties: penalties, currentPenaltyTotal };
  },

  async createBill(dto: CreateBillDto, createdById: number) {
    // Fetch fee details and calculate amounts
    const feeDetails = await Promise.all(
      dto.items.map(async (item) => {
        const fee = await prisma.fee.findUnique({ where: { id: item.feeId } });
        if (!fee || !fee.active) throw new Error(`Fee ${item.feeId} not found or inactive`);

        let amount = 0;
        if (fee.feeType === 'FIXED') {
          amount = parseFloat(fee.baseAmount?.toString() || '0');
        } else if (fee.feeType === 'VARIABLE') {
          const base = parseFloat(fee.baseAmount?.toString() || '0');
          const rate = parseFloat(fee.unitRate?.toString() || '0');
          const units = item.unitCount || 1;
          amount = base + rate * units;
        } else if (fee.feeType === 'PERCENTAGE') {
          // For percentage, caller should provide a base value through unitCount
          const rate = parseFloat(fee.percentageRate?.toString() || '0');
          const base = item.unitCount || 0;
          amount = (base * rate) / 100;
        }

        return { fee, amount, unitCount: item.unitCount };
      })
    );

    const totalAmount = feeDetails.reduce((sum, f) => sum + f.amount, 0);
    const billNumber = generateBillNumber();

    const bill = await prisma.bill.create({
      data: {
        billNumber,
        payerId: dto.payerId,
        billDate: dto.billDate ? new Date(dto.billDate) : new Date(),
        dueDate: new Date(dto.dueDate),
        totalAmount,
        balanceAmount: totalAmount,
        notes: dto.notes,
        status: 'ISSUED',
        createdById,
        items: {
          create: feeDetails.map((f) => ({
            feeId: f.fee.id,
            feeName: f.fee.feeName,
            unitCount: f.unitCount,
            unitPrice: f.fee.unitRate ? parseFloat(f.fee.unitRate.toString()) : null,
            amount: f.amount,
          })),
        },
      },
      include: {
        items: true,
        payer: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        eventType: 'BILL_CREATED',
        userId: createdById,
        entityType: 'bill',
        entityId: String(bill.id),
        action: 'CREATE',
        newValue: JSON.stringify({ billNumber, totalAmount }),
        status: 'SUCCESS',
      },
    });

    return bill;
  },

  async updateBillStatus(id: number, status: string, updatedById: number) {
    const bill = await prisma.bill.findUnique({ where: { id } });
    if (!bill) throw new Error('Bill not found');

    const updated = await prisma.bill.update({
      where: { id },
      data: { status: status as 'DRAFT' | 'ISSUED' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'OVERDUE', updatedById },
    });

    await prisma.auditLog.create({
      data: {
        eventType: 'BILL_UPDATED',
        userId: updatedById,
        entityType: 'bill',
        entityId: String(id),
        action: 'UPDATE',
        oldValue: bill.status,
        newValue: status,
        status: 'SUCCESS',
      },
    });

    return updated;
  },

  async searchBills(query: string, userRole?: string, userId?: number) {
    const where: Record<string, unknown> = {
      OR: [
        { billNumber: { contains: query, mode: 'insensitive' } },
        { payer: { firstName: { contains: query, mode: 'insensitive' } } },
        { payer: { lastName: { contains: query, mode: 'insensitive' } } },
        { payer: { email: { contains: query, mode: 'insensitive' } } },
        { payer: { contactNumber: { contains: query, mode: 'insensitive' } } },
      ],
    };

    if (userRole === 'resident') where.payerId = userId;

    return prisma.bill.findMany({
      where,
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        payer: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: { include: { fee: true } },
      },
    });
  },

  async confirmBill(id: number, confirmedById: number) {
    const bill = await prisma.bill.findUnique({ where: { id } });
    if (!bill) throw new Error('Bill not found');
    if (bill.status !== 'ISSUED') throw new Error('Only bills with ISSUED status can be confirmed');

    const updated = await prisma.bill.update({
      where: { id },
      data: { status: 'UNPAID', updatedById: confirmedById },
      include: {
        payer: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: { include: { fee: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        eventType: 'BILL_CONFIRMED',
        userId: confirmedById,
        entityType: 'bill',
        entityId: String(id),
        action: 'UPDATE',
        oldValue: 'ISSUED',
        newValue: 'UNPAID',
        status: 'SUCCESS',
      },
    });

    return updated;
  },
};

