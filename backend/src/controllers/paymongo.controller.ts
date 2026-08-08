import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { paymongoService } from '../services/paymongo.service';
import { sendSuccess, sendError } from '../utils/response';
import { env } from '../config/env';
import { generateTransactionId, generateOrNumber, buildReceiptData, generateSequentialTransactionId } from '../utils/receiptGenerator';
import { logger } from '../utils/logger';
import { emailService } from '../services/email.service';

export const paymongoController = {
  /**
   * Initiate GCash or Maya payment for a bill.
   * POST /api/v1/paymongo/initiate
   */
  async initiatePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { billId, method } = req.body as { billId: number; method: 'gcash' | 'paymaya' };
      if (!billId || !method) return sendError(res, 'billId and method are required', 400);
      if (!['gcash', 'paymaya'].includes(method)) return sendError(res, 'method must be gcash or paymaya', 400);

      const bill = await prisma.bill.findUnique({
        where: { id: billId },
        include: { payer: true, items: true },
      });
      if (!bill) return sendError(res, 'Bill not found', 404);
      if (bill.status === 'PAID') return sendError(res, 'Bill is already paid', 400);

      // Residents can only pay their own bills
      if (req.user?.role === 'resident' && bill.payerId !== req.user.sub) {
        return sendError(res, 'Access denied', 403);
      }

      const amount = parseFloat(bill.balanceAmount.toString());
      const successUrl = `${env.FRONTEND_URL}/payment-success?billId=${billId}`;
      const failedUrl = `${env.FRONTEND_URL}/payment-failed?billId=${billId}`;

      const source = await paymongoService.createSource(method, amount, bill.billNumber, successUrl, failedUrl);

      // Store PaymentIntent record
      await prisma.paymentIntent.create({
        data: {
          billId,
          payerId: req.user!.sub,
          paymongoPaymentIntentId: source.id,
          amount: bill.balanceAmount,
          paymentMethod: method,
          returnUrl: successUrl,
          failedUrl,
          paymentUrl: source.attributes?.redirect?.checkout_url,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      sendSuccess(res, {
        sourceId: source.id,
        checkoutUrl: source.attributes?.redirect?.checkout_url,
        amount,
        billNumber: bill.billNumber,
      }, 'Payment initiated');
    } catch (err) {
      logger.error(`[paymongo] initiatePayment error: ${(err as Error).message}`);
      next(err);
    }
  },

  /**
   * Get payment status by source ID.
   * GET /api/v1/paymongo/status/:sourceId
   */
  async getPaymentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { sourceId } = req.params;
      const source = await paymongoService.retrieveSource(sourceId);
      sendSuccess(res, {
        id: source.id,
        status: source.attributes?.status,
        amount: source.attributes?.amount / 100,
        type: source.attributes?.type,
      }, 'Payment status retrieved');
    } catch (err) {
      next(err);
    }
  },

  /**
   * Confirm payment for a bill — checks intent status and processes if source is chargeable.
   * Called by the success page to handle cases where webhooks haven't fired yet.
   * POST /api/v1/paymongo/confirm
   */
  async confirmPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { billId } = req.body as { billId: number };
      if (!billId) return sendError(res, 'billId required', 400);

      // Check if the bill is already paid
      const bill = await prisma.bill.findUnique({
        where: { id: billId },
        include: { payer: true, items: true },
      });
      if (!bill) return sendError(res, 'Bill not found', 404);

      if (bill.status === 'PAID') {
        const latestPayment = await prisma.payment.findFirst({
          where: { billId },
          orderBy: { createdAt: 'desc' },
          include: { receipt: true },
        });
        return sendSuccess(res, { status: 'paid', payment: latestPayment }, 'Bill already paid');
      }

      // Find latest pending intent for this bill
      const intent = await prisma.paymentIntent.findFirst({
        where: { billId, status: { in: ['pending', 'processing'] } },
        orderBy: { createdAt: 'desc' },
      });

      if (!intent) {
        return sendSuccess(res, { status: 'pending', payment: null }, 'No pending payment intent found');
      }

      // Poll PayMongo source status
      let source: any;
      try {
        source = await paymongoService.retrieveSource(intent.paymongoPaymentIntentId);
      } catch {
        return sendSuccess(res, { status: 'pending' }, 'Could not retrieve source status');
      }

      const sourceStatus = source?.attributes?.status;
      if (sourceStatus !== 'chargeable') {
        return sendSuccess(res, { status: sourceStatus || 'pending' }, 'Payment not yet chargeable');
      }

      // Source is chargeable — check if payment already exists from webhook
      const existingPayment = await prisma.payment.findFirst({
        where: { billId, paymongoPaymentIntentId: intent.paymongoPaymentIntentId },
      });
      if (existingPayment) {
        return sendSuccess(res, { status: 'paid', payment: existingPayment }, 'Payment already processed');
      }

      // Process the payment (same logic as webhook)
      const pmPayment = await paymongoService.createPayment(
        intent.paymongoPaymentIntentId,
        parseFloat(intent.amount.toString()),
        `Bill ${bill.billNumber}`,
      );

      const methodName = intent.paymentMethod === 'gcash' ? 'GCash' : 'Maya';
      let paymentMethod = await prisma.paymentMethod.findUnique({ where: { methodName } });
      if (!paymentMethod) {
        paymentMethod = await prisma.paymentMethod.create({
          data: { methodName, provider: 'PayMongo', isActive: true },
        });
      }

      const transactionId = await generateSequentialTransactionId();
      const orNumber = generateOrNumber();
      const amount = parseFloat(intent.amount.toString());

      const payment = await prisma.payment.create({
        data: {
          transactionId, billId, payerId: intent.payerId,
          amount: intent.amount, paymentMethodId: paymentMethod.id,
          status: 'PAID', paymongoPaymentIntentId: intent.paymongoPaymentIntentId,
          paymongoSourceId: pmPayment.id, paymentDate: new Date(), verifiedAt: new Date(),
        },
      });

      const newPaidAmount = parseFloat(bill.paidAmount.toString()) + amount;
      const newBalance = parseFloat(bill.totalAmount.toString()) - newPaidAmount;
      const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';

      await prisma.bill.update({
        where: { id: billId },
        data: { paidAmount: newPaidAmount, balanceAmount: Math.max(0, newBalance), status: newStatus },
      });

      const receiptData = buildReceiptData({
        orNumber, receiptId: '',
        payerFirstName: bill.payer.firstName, payerLastName: bill.payer.lastName,
        billNumber: bill.billNumber,
        items: bill.items.map((i) => ({ feeName: i.feeName, amount: parseFloat(i.amount.toString()) })),
        totalAmount: amount, penaltyAmount: parseFloat(bill.penaltyAmount.toString()),
        discountAmount: parseFloat(bill.discountAmount.toString()), paymentMethod: methodName,
      });

      const receipt = await prisma.officialReceipt.create({
        data: {
          orNumber, paymentId: payment.id, billId, amountPaid: amount,
          paymentMethod: methodName, payerName: `${bill.payer.firstName} ${bill.payer.lastName}`,
          issuedAt: new Date(), orData: receiptData as unknown as any, status: 'GENERATED',
        },
      });

      await prisma.paymentIntent.update({
        where: { id: intent.id },
        data: { status: 'paid', paidAt: new Date() },
      });

      logger.info(`[paymongo confirm] Payment processed: ${transactionId} for bill ${bill.billNumber}`);
      sendSuccess(res, { status: 'paid', payment, receipt, orNumber }, 'Payment confirmed and processed');
    } catch (err) {
      logger.error(`[paymongo confirm] Error: ${(err as Error).message}`);
      next(err);
    }
  },
};

/**
 * Handle PayMongo webhook events.
 * POST /api/v1/webhooks/paymongo
 * Requires raw body (registered before express.json()).
 */
export async function handlePaymongoWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers['paymongo-signature'] as string;
    if (!signature) {
      logger.warn('[paymongo webhook] Missing signature header');
      return res.status(400).json({ error: 'Missing signature' });
    }

    const rawBody = (req as Request & { rawBody?: string }).rawBody || '';
    const valid = paymongoService.verifyWebhookSignature(rawBody, signature);
    if (!valid) {
      logger.warn('[paymongo webhook] Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    const type = event?.data?.attributes?.type as string;
    const resource = event?.data?.attributes?.data;

    if (type === 'source.chargeable') {
      const sourceId: string = resource?.id;
      const intent = await prisma.paymentIntent.findFirst({
        where: { paymongoPaymentIntentId: sourceId },
      });
      if (!intent) {
        logger.warn(`[paymongo webhook] No PaymentIntent found for source ${sourceId}`);
        return res.sendStatus(200);
      }

      const bill = await prisma.bill.findUnique({
        where: { id: intent.billId },
        include: { payer: true, items: true },
      });
      if (!bill) return res.sendStatus(200);

      // Create PayMongo payment
      const pmPayment = await paymongoService.createPayment(
        sourceId,
        parseFloat(intent.amount.toString()),
        `Bill ${bill.billNumber}`,
      );

      const methodName = intent.paymentMethod === 'gcash' ? 'GCash' : 'Maya';
      let paymentMethod = await prisma.paymentMethod.findUnique({ where: { methodName } });
      if (!paymentMethod) {
        paymentMethod = await prisma.paymentMethod.create({
          data: { methodName, provider: 'PayMongo', isActive: true },
        });
      }

      const transactionId = await generateSequentialTransactionId();
      const orNumber = generateOrNumber();
      const amount = parseFloat(intent.amount.toString());

      const payment = await prisma.payment.create({
        data: {
          transactionId,
          billId: intent.billId,
          payerId: intent.payerId,
          amount: intent.amount,
          paymentMethodId: paymentMethod.id,
          status: 'PAID',
          paymongoPaymentIntentId: sourceId,
          paymongoSourceId: pmPayment.id,
          paymentDate: new Date(),
          verifiedAt: new Date(),
        },
      });

      const newPaidAmount = parseFloat(bill.paidAmount.toString()) + amount;
      const newBalance = parseFloat(bill.totalAmount.toString()) - newPaidAmount;
      const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';

      await prisma.bill.update({
        where: { id: intent.billId },
        data: {
          paidAmount: newPaidAmount,
          balanceAmount: Math.max(0, newBalance),
          status: newStatus,
        },
      });

      const receiptData = buildReceiptData({
        orNumber,
        receiptId: '',
        payerFirstName: bill.payer.firstName,
        payerLastName: bill.payer.lastName,
        billNumber: bill.billNumber,
        items: bill.items.map((i) => ({ feeName: i.feeName, amount: parseFloat(i.amount.toString()) })),
        totalAmount: amount,
        penaltyAmount: parseFloat(bill.penaltyAmount.toString()),
        discountAmount: parseFloat(bill.discountAmount.toString()),
        paymentMethod: methodName,
      });

      await prisma.officialReceipt.create({
        data: {
          orNumber,
          paymentId: payment.id,
          billId: intent.billId,
          amountPaid: amount,
          paymentMethod: methodName,
          payerName: `${bill.payer.firstName} ${bill.payer.lastName}`,
          issuedAt: new Date(),
          orData: receiptData as unknown as any,
          status: 'GENERATED',
        },
      });

      // Update intent status
      await prisma.paymentIntent.update({
        where: { id: intent.id },
        data: { status: 'paid', paidAt: new Date() },
      });

      // Send email confirmation (non-blocking)
      emailService.sendPaymentConfirmation(
        bill.payer.email,
        bill.payer.firstName,
        orNumber,
        bill.billNumber,
        amount,
        new Date(),
      ).catch((e) => logger.warn(`[webhook] email send failed: ${e.message}`));

      logger.info(`[paymongo webhook] Payment recorded: ${transactionId} for bill ${bill.billNumber}`);
    }

    return res.sendStatus(200);
  } catch (err) {
    logger.error(`[paymongo webhook] Error: ${(err as Error).message}`);
    return res.status(500).json({ error: 'Internal error' });
  }
}
