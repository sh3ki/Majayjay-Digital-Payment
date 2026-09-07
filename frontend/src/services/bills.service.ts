import api from './api';
import { ApiResponse, Bill, CreateBillDto } from '../types';

export const billsService = {
  async getBills(params?: Record<string, string | number>) {
    const { data } = await api.get<ApiResponse<Bill[]>>('/bills', { params });
    return data;
  },

  async getBillSummary(params?: Record<string, string>) {
    const { data } = await api.get<ApiResponse<{ counts: Record<string, number>; items: string[] }>>('/bills/summary', { params });
    return data;
  },

  async searchPayers(search: string) {
    const { data } = await api.get<ApiResponse<Array<{
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      contactNumber?: string;
      address?: string;
      barangay?: string;
      role?: { roleName: string };
    }>>>('/bills/payers', { params: { search } });
    return data;
  },

  async getBillById(id: number) {
    const { data } = await api.get<ApiResponse<Bill>>(`/bills/${id}`);
    return data;
  },

  async createBill(dto: CreateBillDto) {
    const { data } = await api.post<ApiResponse<Bill>>('/bills', dto);
    return data;
  },

  async updateBillStatus(id: number, status: string) {
    const { data } = await api.put<ApiResponse<Bill>>(`/bills/${id}/status`, { status });
    return data;
  },

  async confirmBill(id: number) {
    const { data } = await api.put<ApiResponse<Bill>>(`/bills/${id}/confirm`);
    return data;
  },

  async searchBills(q: string) {
    const { data } = await api.get<ApiResponse<Bill[]>>('/bills/search', { params: { q } });
    return data;
  },
};
