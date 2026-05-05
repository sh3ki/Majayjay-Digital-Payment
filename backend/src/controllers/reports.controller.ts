import { Request, Response, NextFunction } from 'express';
import { reportsService } from '../services/reports.service';
import { sendSuccess } from '../utils/response';

export const reportsController = {
  async getCollectionReport(req: Request, res: Response, next: NextFunction) {
    try {
      const startDate = req.query.startDate as string || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const endDate = req.query.endDate as string || new Date().toISOString();
      const paymentMethod = req.query.paymentMethod as string | undefined;

      const data = await reportsService.getCollectionReport({ startDate, endDate, paymentMethod });
      sendSuccess(res, data, 'Collection report retrieved');
    } catch (err) {
      next(err);
    }
  },

  async getDailySummary(req: Request, res: Response, next: NextFunction) {
    try {
      const cashierId = req.user?.role === 'cashier' ? req.user.sub : undefined;
      const data = await reportsService.getDailySummary(cashierId);
      sendSuccess(res, data, 'Daily summary retrieved');
    } catch (err) {
      next(err);
    }
  },

  async getFullAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportsService.getFullAnalytics();
      sendSuccess(res, data, 'Analytics retrieved');
    } catch (err) {
      next(err);
    }
  },
};
