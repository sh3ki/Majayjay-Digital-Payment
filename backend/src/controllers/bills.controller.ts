import { Request, Response, NextFunction } from 'express';
import { billsService } from '../services/bills.service';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';

export const billsController = {
  async getBills(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { status, search, startDate, endDate } = req.query as Record<string, string>;

      let payerId: number | undefined;
      if (req.user?.role === 'resident') payerId = req.user.sub;
      else if (req.query.payerId) payerId = parseInt(req.query.payerId as string);

      const { bills, total } = await billsService.getBills({
        page, limit, status, payerId, search, startDate, endDate,
      });
      sendPaginated(res, bills, total, page, limit, 'Bills retrieved');
    } catch (err) {
      next(err);
    }
  },

  async getBillById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const bill = await billsService.getBillById(id, req.user?.sub, req.user?.role);
      sendSuccess(res, bill, 'Bill retrieved');
    } catch (err) {
      if ((err as Error).message === 'Bill not found') return sendError(res, 'Bill not found', 404);
      if ((err as Error).message === 'Access denied') return sendError(res, 'Access denied', 403);
      next(err);
    }
  },

  async createBill(req: Request, res: Response, next: NextFunction) {
    try {
      const bill = await billsService.createBill(req.body, req.user!.sub);
      sendSuccess(res, bill, 'Bill created successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  async updateBillStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const bill = await billsService.updateBillStatus(id, status, req.user!.sub);
      sendSuccess(res, bill, 'Bill status updated');
    } catch (err) {
      if ((err as Error).message === 'Bill not found') return sendError(res, 'Bill not found', 404);
      next(err);
    }
  },

  async searchBills(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;
      if (!q) return sendError(res, 'Search query required', 400);
      const bills = await billsService.searchBills(q as string, req.user?.role, req.user?.sub);
      sendSuccess(res, bills, 'Search results');
    } catch (err) {
      next(err);
    }
  },

  async confirmBill(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const bill = await billsService.confirmBill(id, req.user!.sub);
      sendSuccess(res, bill, 'Bill confirmed successfully');
    } catch (err) {
      if ((err as Error).message === 'Bill not found') return sendError(res, 'Bill not found', 404);
      if ((err as Error).message === 'Only bills with ISSUED status can be confirmed') return sendError(res, (err as Error).message, 400);
      next(err);
    }
  },
};
