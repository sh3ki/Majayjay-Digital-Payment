import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

const FROM = `"Majayjay LGU Billing" <${env.EMAIL_FROM}>`;

export const emailService = {
  async sendPasswordReset(to: string, firstName: string, resetToken: string) {
    const link = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await transporter.sendMail({
      from: FROM,
      to,
      subject: 'Reset Your Password — Majayjay LGU',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
          <h2 style="color:#0D47A1">Password Reset Request</h2>
          <p>Hi ${firstName},</p>
          <p>We received a request to reset your password. Click the button below to continue:</p>
          <a href="${link}" style="display:inline-block;background:#0D47A1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0">Reset Password</a>
          <p>This link expires in <strong>1 hour</strong>.</p>
          <p>If you did not request this, please ignore this email.</p>
          <hr style="border:none;border-top:1px solid #eee;margin-top:32px">
          <p style="color:#9E9E9E;font-size:12px">Majayjay, Laguna LGU Billing System</p>
        </div>`,
    });
  },

  async sendPaymentConfirmation(
    to: string,
    firstName: string,
    orNumber: string,
    billNumber: string,
    amount: number,
    paymentDate: Date,
  ) {
    await transporter.sendMail({
      from: FROM,
      to,
      subject: `Payment Confirmed — OR# ${orNumber}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
          <h2 style="color:#0D47A1">Payment Confirmed</h2>
          <p>Hi ${firstName},</p>
          <p>Your payment has been successfully processed.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#757575">OR Number</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">${orNumber}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#757575">Bill Number</td><td style="padding:8px;border-bottom:1px solid #eee">${billNumber}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#757575">Amount Paid</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;color:#1565C0">₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td></tr>
            <tr><td style="padding:8px;color:#757575">Date</td><td style="padding:8px">${paymentDate.toLocaleDateString('en-PH', { dateStyle: 'long' })}</td></tr>
          </table>
          <p>Please keep your OR number for your records. You can view your receipt online anytime.</p>
          <hr style="border:none;border-top:1px solid #eee;margin-top:32px">
          <p style="color:#9E9E9E;font-size:12px">Majayjay, Laguna LGU Billing System</p>
        </div>`,
    });
  },

  async sendBillIssued(
    to: string,
    firstName: string,
    billNumber: string,
    totalAmount: number,
    dueDate: Date,
  ) {
    const billUrl = `${env.FRONTEND_URL}/bills`;
    await transporter.sendMail({
      from: FROM,
      to,
      subject: `New Bill Issued — ${billNumber}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
          <h2 style="color:#0D47A1">New Bill Issued</h2>
          <p>Hi ${firstName},</p>
          <p>A new bill has been issued to your account.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#757575">Bill Number</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">${billNumber}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#757575">Total Amount</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;color:#F44336">₱${totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td></tr>
            <tr><td style="padding:8px;color:#757575">Due Date</td><td style="padding:8px;color:#FF9800;font-weight:bold">${dueDate.toLocaleDateString('en-PH', { dateStyle: 'long' })}</td></tr>
          </table>
          <a href="${billUrl}" style="display:inline-block;background:#0D47A1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0">View Bill</a>
          <p>Please pay before the due date to avoid penalties.</p>
          <hr style="border:none;border-top:1px solid #eee;margin-top:32px">
          <p style="color:#9E9E9E;font-size:12px">Majayjay, Laguna LGU Billing System</p>
        </div>`,
    });
  },

  async sendOverdueReminder(
    to: string,
    firstName: string,
    billNumber: string,
    balanceAmount: number,
    daysOverdue: number,
  ) {
    await transporter.sendMail({
      from: FROM,
      to,
      subject: `Overdue Bill Reminder — ${billNumber}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
          <h2 style="color:#F44336">Overdue Bill Reminder</h2>
          <p>Hi ${firstName},</p>
          <p>Your bill <strong>${billNumber}</strong> is <strong>${daysOverdue} day(s) overdue</strong>.</p>
          <p>Outstanding Balance: <strong style="color:#F44336">₱${balanceAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></p>
          <p>Please settle this as soon as possible to avoid additional penalties.</p>
          <a href="${env.FRONTEND_URL}/bills" style="display:inline-block;background:#F44336;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0">Pay Now</a>
          <hr style="border:none;border-top:1px solid #eee;margin-top:32px">
          <p style="color:#9E9E9E;font-size:12px">Majayjay, Laguna LGU Billing System</p>
        </div>`,
    });
  },
};

// Verify transporter at startup (non-blocking)
if (env.SMTP_USER && env.SMTP_PASS) {
  transporter.verify().then(() => {
    logger.info('[email] SMTP connection verified');
  }).catch((err: Error) => {
    logger.warn(`[email] SMTP verification failed: ${err.message}`);
  });
}
