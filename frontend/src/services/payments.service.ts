import api from './api';
import { ApiResponse, Payment, OfficialReceipt, QRCode } from '../types';

export const paymentsService = {
  async getPayments(params?: Record<string, string | number>) {
    const { data } = await api.get<ApiResponse<Payment[]>>('/payments', { params });
    return data;
  },

  async getPaymentById(id: number) {
    const { data } = await api.get<ApiResponse<Payment>>(`/payments/${id}`);
    return data;
  },

  async recordCashPayment(dto: {
    billId: number;
    payerId: number;
    amount: number;
    terminalId?: string;
    referenceNumber?: string;
  }) {
    const { data } = await api.post<ApiResponse<{ payment: Payment; receipt: OfficialReceipt }>>('/payments/record-cash', dto);
    return data;
  },

  async generateQR(billId: number) {
    const { data } = await api.post<ApiResponse<{
      qrCode: QRCode;
      qrImageDataUrl: string;
      paymentUrl: string;
      transactionId: string;
    }>>('/payments/generate-qr', { billId });
    return data;
  },

  async generatePaymentQR(paymentId: number) {
    const { data } = await api.get<ApiResponse<{ qrImageDataUrl: string; paymentUrl: string; transactionId: string }>>(`/payments/${paymentId}/qr`);
    return data;
  },

  async getReceipt(id: string) {
    const { data } = await api.get<ApiResponse<OfficialReceipt>>(`/payments/receipt/${id}`);
    return data;
  },

  async downloadReceiptPDF(receiptId: string): Promise<Blob> {
    const response = await api.get(`/payments/receipt/${receiptId}/download`, { responseType: 'blob' });
    return response.data as Blob;
  },

  async initiateOnlinePayment(billId: number, method: 'gcash' | 'paymaya') {
    const { data } = await api.post<ApiResponse<{ checkoutUrl: string; sourceId: string; transactionId: string }>>('/paymongo/initiate', { billId, method });
    return data;
  },
};
