import { Request, Response, NextFunction } from 'express';
import { paymentsService } from '../services/payments.service';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';

export const paymentsController = {
  async recordCashPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentsService.recordCashPayment({
        ...req.body,
        cashierId: req.user!.sub,
      });
      sendSuccess(res, result, 'Cash payment recorded', 201);
    } catch (err) {
      if ((err as Error).message === 'Bill not found') return sendError(res, 'Bill not found', 404);
      if ((err as Error).message === 'Bill is already paid') return sendError(res, 'Bill is already paid', 400);
      next(err);
    }
  },

  async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { status, startDate, endDate, paymentMethod } = req.query as Record<string, string>;

      let payerId: number | undefined;
      if (req.user?.role === 'resident') payerId = req.user.sub;

      const { payments, total } = await paymentsService.getPayments({
        page, limit, status, payerId, startDate, endDate, paymentMethod,
      });
      sendPaginated(res, payments, total, page, limit, 'Payments retrieved');
    } catch (err) {
      next(err);
    }
  },

  async getPaymentById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const payment = await paymentsService.getPaymentById(id);
      sendSuccess(res, payment, 'Payment retrieved');
    } catch (err) {
      if ((err as Error).message === 'Payment not found') return sendError(res, 'Payment not found', 404);
      next(err);
    }
  },

  async generateQR(req: Request, res: Response, next: NextFunction) {
    try {
      const { billId } = req.body;
      if (!billId) return sendError(res, 'Bill ID required', 400);
      const result = await paymentsService.generateQRForBill(billId, req.user!.sub);
      sendSuccess(res, result, 'QR code generated');
    } catch (err) {
      if ((err as Error).message === 'Bill not found') return sendError(res, 'Bill not found', 404);
      next(err);
    }
  },

  async getReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      const receipt = await prisma.officialReceipt.findFirst({
        where: { OR: [{ receiptId: id }, { orNumber: id }] },
        include: {
          payment: {
            include: {
              payer: { select: { firstName: true, lastName: true, email: true } },
              method: true,
            },
          },
          bill: { include: { items: true } },
        },
      });
      if (!receipt) return sendError(res, 'Receipt not found', 404);
      sendSuccess(res, receipt, 'Receipt retrieved');
    } catch (err) {
      next(err);
    }
  },
};
