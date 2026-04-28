import prisma from '../config/database';

export const reportsService = {
  async getDashboardKPIs() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      thisMonthPayments,
      lastMonthPayments,
      totalOutstandingBills,
      pendingPayments,
      totalPayments,
      paidPayments,
      recentTransactions,
    ] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: 'PAID', paymentDate: { gte: startOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: { status: 'PAID', paymentDate: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.bill.aggregate({
        where: { status: { in: ['UNPAID', 'OVERDUE', 'PARTIALLY_PAID'] } },
        _sum: { balanceAmount: true },
        _count: true,
      }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.payment.count(),
      prisma.payment.count({ where: { status: 'PAID' } }),
      prisma.payment.findMany({
        take: 10,
        orderBy: { paymentDate: 'desc' },
        include: {
          payer: { select: { firstName: true, lastName: true } },
          method: true,
          bill: { select: { billNumber: true } },
          receipt: { select: { orNumber: true } },
        },
      }),
    ]);

    const thisMonthTotal = parseFloat(thisMonthPayments._sum.amount?.toString() || '0');
    const lastMonthTotal = parseFloat(lastMonthPayments._sum.amount?.toString() || '0');
    const monthOverMonth = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
    const successRate = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;

    return {
      thisMonthCollection: thisMonthTotal,
      lastMonthCollection: lastMonthTotal,
      monthOverMonth: parseFloat(monthOverMonth.toFixed(2)),
      totalOutstanding: parseFloat(totalOutstandingBills._sum.balanceAmount?.toString() || '0'),
      outstandingCount: totalOutstandingBills._count,
      pendingPayments,
      successRate: parseFloat(successRate.toFixed(2)),
      recentTransactions,
    };
  },

  async getCollectionReport(params: {
    startDate: string;
    endDate: string;
    groupBy?: 'day' | 'week' | 'month';
    departmentId?: number;
    paymentMethod?: string;
  }) {
    const { startDate, endDate, paymentMethod } = params;

    const where: Record<string, unknown> = {
      status: 'PAID',
      paymentDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    if (paymentMethod) {
      where.method = { methodName: paymentMethod };
    }

    const [payments, byMethod, totalAmount, count] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          payer: { select: { firstName: true, lastName: true } },
          method: true,
          bill: { include: { items: { include: { fee: { include: { category: true } } } } } },
          receipt: { select: { orNumber: true } },
        },
        orderBy: { paymentDate: 'desc' },
      }),
      prisma.payment.groupBy({
        by: ['paymentMethodId'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.count({ where }),
    ]);

    const methodDetails = await prisma.paymentMethod.findMany();
    const byMethodWithNames = byMethod.map((m) => ({
      method: methodDetails.find((d) => d.id === m.paymentMethodId)?.methodName || 'Unknown',
      total: parseFloat(m._sum.amount?.toString() || '0'),
      count: m._count,
    }));

    return {
      payments,
      summary: {
        total: parseFloat(totalAmount._sum.amount?.toString() || '0'),
        count,
        byMethod: byMethodWithNames,
      },
    };
  },

  async getRevenueSummary(year: number) {
    const months = [];
    for (let m = 0; m < 12; m++) {
      const start = new Date(year, m, 1);
      const end = new Date(year, m + 1, 0, 23, 59, 59);
      const result = await prisma.payment.aggregate({
        where: { status: 'PAID', paymentDate: { gte: start, lte: end } },
        _sum: { amount: true },
        _count: true,
      });
      months.push({
        month: m + 1,
        monthName: start.toLocaleString('default', { month: 'long' }),
        total: parseFloat(result._sum.amount?.toString() || '0'),
        count: result._count,
      });
    }
    return months;
  },

  async getPaymentMethodBreakdown(startDate: string, endDate: string) {
    const where = {
      status: 'PAID' as const,
      paymentDate: { gte: new Date(startDate), lte: new Date(endDate) },
    };

    const grouped = await prisma.payment.groupBy({
      by: ['paymentMethodId'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    const methods = await prisma.paymentMethod.findMany();
    const total = grouped.reduce((sum, g) => sum + parseFloat(g._sum.amount?.toString() || '0'), 0);

    return grouped.map((g) => {
      const method = methods.find((m) => m.id === g.paymentMethodId);
      const amount = parseFloat(g._sum.amount?.toString() || '0');
      return {
        methodName: method?.methodName || 'Unknown',
        total: amount,
        count: g._count,
        percentage: total > 0 ? parseFloat(((amount / total) * 100).toFixed(2)) : 0,
      };
    });
  },

  async getDailySummary(cashierId?: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const where: Record<string, unknown> = {
      paymentDate: { gte: today, lt: tomorrow },
      status: 'PAID',
    };
    if (cashierId) where.cashierId = cashierId;

    const [payments, summary] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          payer: { select: { firstName: true, lastName: true } },
          method: true,
          bill: { select: { billNumber: true } },
          receipt: { select: { orNumber: true } },
        },
        orderBy: { paymentDate: 'desc' },
      }),
      prisma.payment.aggregate({ where, _sum: { amount: true }, _count: true }),
    ]);

    return {
      payments,
      totalAmount: parseFloat(summary._sum.amount?.toString() || '0'),
      totalCount: summary._count,
      date: today.toISOString().split('T')[0],
    };
  },
};
