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
    const payload = {
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
    };

    try {
      logger.info('[paymongo] createSource payload', { payload: JSON.stringify(payload), type });
      const response = await axios.post(`${PAYMONGO_BASE}/sources`, payload, { headers: authHeader() });
      return response.data.data;
    } catch (err: any) {
      logger.error('[paymongo] createSource error response', { response: err.response?.data });
      // If PayMongo rejects `paymaya` as invalid, attempt with alternate type 'maya'
      if (type === 'paymaya' && err.response && err.response.data) {
        const pd = err.response.data;
        const msg = pd.errors ? pd.errors.map((e: any) => e.detail || e.message).join('; ') : pd.message || JSON.stringify(pd);
        if (String(msg).toLowerCase().includes('paymaya') || String(msg).toLowerCase().includes('source_type')) {
          try {
            const altPayload = {
              data: {
                attributes: {
                  amount: amountCentavos,
                  currency: 'PHP',
                  type: 'maya',
                  redirect: { success: successUrl, failed: failedUrl },
                  billing: { name: 'Majayjay LGU Billing', email: env.EMAIL_FROM },
                  statement_descriptor: `MAJAYJAY-${billNumber}`,
                },
              },
            };
            logger.info('[paymongo] createSource trying fallback payload', { payload: JSON.stringify(altPayload) });
            const altResponse = await axios.post(`${PAYMONGO_BASE}/sources`, altPayload, { headers: authHeader() });
            logger.info('[paymongo] Fallback: used type=maya for paymaya source creation');
            return altResponse.data.data;
          } catch (e: any) {
            // fall through to original error handling below
            err = e;
          }
        }
      }

      if (err.response && err.response.data) {
        const pd = err.response.data;
        const message = pd.errors ? pd.errors.map((e: any) => e.detail || e.message).join('; ') : pd.message || JSON.stringify(pd);
        const status = err.response.status || 500;
        const error = new Error(`PayMongo createSource failed: ${message}`);
        (error as any).status = status;
        throw error;
      }
      throw err;
    }
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
    const payload = {
      data: {
        attributes: {
          amount: amountCentavos,
          currency: 'PHP',
          description,
          source: { id: sourceId, type: 'source' },
        },
      },
    };
    try {
      logger.info('[paymongo] createPayment payload', { payload: JSON.stringify(payload) });
      const response = await axios.post(`${PAYMONGO_BASE}/payments`, payload, { headers: authHeader() });
      return response.data.data;
    } catch (err: any) {
      logger.error('[paymongo] createPayment error response', { response: err.response?.data });
      if (err.response && err.response.data) {
        const pd = err.response.data;
        const message = pd.errors ? pd.errors.map((e: any) => e.detail || e.message).join('; ') : pd.message || JSON.stringify(pd);
        const status = err.response.status || 500;
        const error = new Error(`PayMongo createPayment failed: ${message}`);
        (error as any).status = status;
        throw error;
      }
      throw err;
    }
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
