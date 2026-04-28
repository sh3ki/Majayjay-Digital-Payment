import api from './api';
import { ApiResponse, DashboardKPIs, MonthlyRevenue, PaymentMethodBreakdown, CollectionReport } from '../types';

export const reportsService = {
  async getDashboardAnalytics() {
    const { data } = await api.get<ApiResponse<DashboardKPIs>>('/dashboard/analytics');
    return data;
  },

  async getRevenueSummary(year?: number) {
    const { data } = await api.get<ApiResponse<MonthlyRevenue[]>>('/dashboard/revenue-summary', { params: { year } });
    return data;
  },

  async getPaymentMethodBreakdown(params?: { startDate?: string; endDate?: string }) {
    const { data } = await api.get<ApiResponse<PaymentMethodBreakdown[]>>('/dashboard/payment-methods-breakdown', { params });
    return data;
  },

  async getCollectionReport(params?: Record<string, string>) {
    const { data } = await api.get<ApiResponse<CollectionReport>>('/reports/collection', { params });
    return data;
  },

  async getDailySummary() {
    const { data } = await api.get<ApiResponse<unknown>>('/reports/daily-summary');
    return data;
  },
};
