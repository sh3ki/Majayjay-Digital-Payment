import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const PAYMONGO_BASE = 'https://api.paymongo.com/v1';

function authHeader() {
  const key = env.PAYMONGO_SECRET_KEY || env.PAYMONGO_API_KEY;
  return { Authorization: `Basic ${Buffer.from(`${key}:`).toString('base64')}` };
}

export const paymongoService = {
  /**
   * Create a GCash or Maya payment source and return the checkout URL.
   * type: 'gcash' | 'paymaya'
   */
  async createSource(
    type: 'gcash' | 'paymaya',
    amount: number,          // in PHP (will be converted to centavos)
    billNumber: string,
    successUrl: string,
    failedUrl: string,
  ) {
    const amountCentavos = Math.round(amount * 100);
    const response = await axios.post(
      `${PAYMONGO_BASE}/sources`,
      {
        data: {
          attributes: {
            amount: amountCentavos,
            currency: 'PHP',
            type,
            redirect: { success: successUrl, failed: failedUrl },
            billing: { name: 'Majayjay LGU Billing', email: env.EMAIL_FROM },
            statement_descriptor: `MAJAYJAY-${billNumber}`,
          },
        },
      },
      { headers: authHeader() },
    );
    return response.data.data;
  },

  /**
   * Retrieve a payment source by ID.
   */
  async retrieveSource(sourceId: string) {
    const response = await axios.get(`${PAYMONGO_BASE}/sources/${sourceId}`, {
      headers: authHeader(),
    });
    return response.data.data;
  },

  /**
   * Create a payment from a chargeable source.
   */
  async createPayment(sourceId: string, amount: number, description: string) {
    const amountCentavos = Math.round(amount * 100);
    const response = await axios.post(
      `${PAYMONGO_BASE}/payments`,
      {
        data: {
          attributes: {
            amount: amountCentavos,
            currency: 'PHP',
            description,
            source: { id: sourceId, type: 'source' },
          },
        },
      },
      { headers: authHeader() },
    );
    return response.data.data;
  },

  /**
   * Retrieve a PayMongo payment by ID.
   */
  async retrievePayment(paymentId: string) {
    const response = await axios.get(`${PAYMONGO_BASE}/payments/${paymentId}`, {
      headers: authHeader(),
    });
    return response.data.data;
  },

  /**
   * Issue a refund for a payment.
   */
  async createRefund(paymentId: string, amount: number, reason: string) {
    const amountCentavos = Math.round(amount * 100);
    const response = await axios.post(
      `${PAYMONGO_BASE}/refunds`,
      {
        data: {
          attributes: {
            amount: amountCentavos,
            payment_id: paymentId,
            reason,
            notes: 'LGU Refund',
          },
        },
      },
      { headers: authHeader() },
    );
    return response.data.data;
  },

  /**
   * Verify a PayMongo webhook signature (HMAC-SHA256).
   */
  verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
    if (!env.PAYMONGO_WEBHOOK_SECRET) {
      logger.warn('[paymongo] PAYMONGO_WEBHOOK_SECRET not set — skipping signature verification');
      return false;
    }
    const crypto = require('crypto');
    const [, timestamp, sig] = signatureHeader.match(/t=(\d+),te=([a-f0-9]+)/) || [];
    if (!timestamp || !sig) return false;
    const payload = `${timestamp}.${rawBody}`;
    const expected = crypto.createHmac('sha256', env.PAYMONGO_WEBHOOK_SECRET).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  },
};
