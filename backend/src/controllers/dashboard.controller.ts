import { Request, Response, NextFunction } from 'express';
import { reportsService } from '../services/reports.service';
import { sendSuccess } from '../utils/response';

export const dashboardController = {
  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const kpis = await reportsService.getDashboardKPIs();
      sendSuccess(res, kpis, 'Dashboard analytics retrieved');
    } catch (err) {
      next(err);
    }
  },

  async getRevenueSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const data = await reportsService.getRevenueSummary(year);
      sendSuccess(res, data, 'Revenue summary retrieved');
    } catch (err) {
      next(err);
    }
  },

  async getPaymentMethodBreakdown(req: Request, res: Response, next: NextFunction) {
    try {
      const startDate = req.query.startDate as string || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const endDate = req.query.endDate as string || new Date().toISOString();
      const data = await reportsService.getPaymentMethodBreakdown(startDate, endDate);
      sendSuccess(res, data, 'Payment method breakdown retrieved');
    } catch (err) {
      next(err);
    }
  },
};
