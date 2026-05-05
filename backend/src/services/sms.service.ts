import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const SEMAPHORE_URL = 'https://api.semaphore.co/api/v4/messages';

export const smsService = {
  async send(to: string, message: string): Promise<boolean> {
    if (!env.SMS_API_KEY) {
      logger.warn('[sms] SMS_API_KEY not set, skipping SMS send');
      return false;
    }
    try {
      await axios.post(SEMAPHORE_URL, {
        apikey: env.SMS_API_KEY,
        number: to.replace(/\D/g, ''), // strip non-digits
        message,
        sendername: env.SMS_SENDER_ID,
      });
      return true;
    } catch (err) {
      logger.error(`[sms] Failed to send SMS to ${to}: ${(err as Error).message}`);
      return false;
    }
  },

  async sendPaymentConfirmation(to: string, orNumber: string, amount: number) {
    const msg = `[Majayjay LGU] Payment confirmed. OR#${orNumber} Amount: PHP${amount.toFixed(2)}. Thank you!`;
    return this.send(to, msg);
  },

  async sendBillIssued(to: string, billNumber: string, amount: number, dueDate: string) {
    const msg = `[Majayjay LGU] New bill ${billNumber} issued. Amount: PHP${amount.toFixed(2)}. Due: ${dueDate}. Please pay on time.`;
    return this.send(to, msg);
  },

  async sendPasswordReset(to: string, token: string) {
    const msg = `[Majayjay LGU] Your password reset link: ${env.FRONTEND_URL}/reset-password?token=${token} (expires in 1 hour)`;
    return this.send(to, msg);
  },
};
