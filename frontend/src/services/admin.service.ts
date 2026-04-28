import api from './api';
import { ApiResponse, User, Fee, PenaltyRule, Department, AuditLog, PaymentMethod } from '../types';

export const adminService = {
  async getUsers(params?: Record<string, string | number>) {
    const { data } = await api.get<ApiResponse<User[]>>('/admin/users', { params });
    return data;
  },

  async createUser(dto: Partial<User> & { password: string; roleId: number }) {
    const { data } = await api.post<ApiResponse<User>>('/admin/users', dto);
    return data;
  },

  async updateUser(id: number, dto: Partial<User> & { roleId?: number; departmentId?: number }) {
    const { data } = await api.put<ApiResponse<User>>(`/admin/users/${id}`, dto);
    return data;
  },

  async updateUserStatus(id: number, status: string) {
    const { data } = await api.put<ApiResponse<User>>(`/admin/users/${id}/status`, { status });
    return data;
  },

  async getFees() {
    const { data } = await api.get<ApiResponse<Fee[]>>('/admin/fees');
    return data;
  },

  async createFee(dto: Partial<Fee> & { categoryId: number }) {
    const { data } = await api.post<ApiResponse<Fee>>('/admin/fees', dto);
    return data;
  },

  async updateFee(id: number, dto: Partial<Fee>) {
    const { data } = await api.put<ApiResponse<Fee>>(`/admin/fees/${id}`, dto);
    return data;
  },

  async toggleFeeStatus(id: number) {
    const { data } = await api.put<ApiResponse<Fee>>(`/admin/fees/${id}/toggle`);
    return data;
  },

  async getFeeCategories() {
    const { data } = await api.get<ApiResponse<{ id: number; categoryName: string }[]>>('/admin/fee-categories');
    return data;
  },

  async getPenaltyRules() {
    const { data } = await api.get<ApiResponse<PenaltyRule[]>>('/admin/penalty-rules');
    return data;
  },

  async createPenaltyRule(dto: Partial<PenaltyRule>) {
    const { data } = await api.post<ApiResponse<PenaltyRule>>('/admin/penalty-rules', dto);
    return data;
  },

  async updatePenaltyRule(id: number, dto: Partial<PenaltyRule>) {
    const { data } = await api.put<ApiResponse<PenaltyRule>>(`/admin/penalty-rules/${id}`, dto);
    return data;
  },

  async togglePenaltyRuleStatus(id: number) {
    const { data } = await api.put<ApiResponse<PenaltyRule>>(`/admin/penalty-rules/${id}/toggle`);
    return data;
  },

  async getDepartments() {
    const { data } = await api.get<ApiResponse<Department[]>>('/admin/departments');
    return data;
  },

  async createDepartment(dto: Partial<Department>) {
    const { data } = await api.post<ApiResponse<Department>>('/admin/departments', dto);
    return data;
  },

  async updateDepartment(id: number, dto: Partial<Department>) {
    const { data } = await api.put<ApiResponse<Department>>(`/admin/departments/${id}`, dto);
    return data;
  },

  async getAuditLogs(params?: Record<string, string | number>) {
    const { data } = await api.get<ApiResponse<AuditLog[]>>('/admin/audit-logs', { params });
    return data;
  },

  async getPaymentMethods() {
    const { data } = await api.get<ApiResponse<PaymentMethod[]>>('/admin/payment-methods');
    return data;
  },

  async togglePaymentMethod(id: number) {
    const { data } = await api.put<ApiResponse<PaymentMethod>>(`/admin/payment-methods/${id}/toggle`);
    return data;
  },

  async getSystemStats() {
    const { data } = await api.get<ApiResponse<Record<string, number>>>('/admin/system-stats');
    return data;
  },
};
