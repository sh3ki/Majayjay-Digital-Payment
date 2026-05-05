import cron from 'node-cron';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { emailService } from '../services/email.service';

/**
 * Runs every day at midnight: marks overdue bills, applies penalties, sends reminders.
 */
async function processOverdueBills() {
  logger.info('[overdue-job] Starting overdue bills processing...');
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Find all unpaid/partially-paid bills past due date
    const overdueBills = await prisma.bill.findMany({
      where: {
        status: { in: ['ISSUED', 'UNPAID', 'PARTIALLY_PAID'] },
        dueDate: { lt: today },
      },
      include: {
        payer: true,
        penalties: { include: { rule: true } },
      },
    });

    logger.info(`[overdue-job] Found ${overdueBills.length} overdue bill(s)`);

    for (const bill of overdueBills) {
      try {
        // Mark as OVERDUE if not already
        if (bill.status !== 'OVERDUE') {
          await prisma.bill.update({
            where: { id: bill.id },
            data: { status: 'OVERDUE' },
          });
        }

        // Find applicable penalty rules for each fee
        const penaltyRules = await prisma.penaltyRule.findMany({
          where: {
            active: true,
            fee: {
              billItems: { some: { billId: bill.id } },
            },
          },
        });

        for (const rule of penaltyRules) {
          const daysOverdue = Math.floor((today.getTime() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24));

          if (daysOverdue <= rule.gracePeriodDays) continue;

          // Apply monthly penalties only once per month
          if (rule.applyMonthly) {
            const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const alreadyApplied = await prisma.penalty.findFirst({
              where: {
                billId: bill.id,
                penaltyRuleId: rule.id,
                appliedDate: { gte: lastMonthStart },
              },
            });
            if (alreadyApplied) continue;
          }

          let penaltyAmount = 0;
          if (rule.calculationMethod === 'FIXED') {
            penaltyAmount = parseFloat(rule.amountOrRate.toString());
          } else {
            penaltyAmount = parseFloat(bill.balanceAmount.toString()) * parseFloat(rule.amountOrRate.toString()) / 100;
          }

          if (rule.maxPenaltyAmount) {
            penaltyAmount = Math.min(penaltyAmount, parseFloat(rule.maxPenaltyAmount.toString()));
          }

          if (penaltyAmount > 0) {
            await prisma.penalty.create({
              data: {
                billId: bill.id,
                penaltyRuleId: rule.id,
                penaltyAmount,
                appliedDate: today,
                reason: `Auto-applied: ${rule.penaltyType} penalty`,
              },
            });

            const newPenaltyTotal = parseFloat(bill.penaltyAmount.toString()) + penaltyAmount;
            const newBalance = parseFloat(bill.balanceAmount.toString()) + penaltyAmount;

            await prisma.bill.update({
              where: { id: bill.id },
              data: {
                penaltyAmount: newPenaltyTotal,
                balanceAmount: newBalance,
                totalAmount: parseFloat(bill.totalAmount.toString()) + penaltyAmount,
              },
            });

            logger.info(`[overdue-job] Applied ₱${penaltyAmount} penalty to bill ${bill.billNumber}`);
          }
        }

        // Send overdue reminder email
        const daysOverdue = Math.floor((today.getTime() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        if (daysOverdue === 1 || daysOverdue === 7 || daysOverdue === 30) {
          emailService.sendOverdueReminder(
            bill.payer.email,
            bill.payer.firstName,
            bill.billNumber,
            parseFloat(bill.balanceAmount.toString()),
            daysOverdue,
          ).catch((e) => logger.warn(`[overdue-job] Email failed for ${bill.billNumber}: ${e.message}`));
        }

        // Create in-app notification
        await prisma.notification.create({
          data: {
            recipientId: bill.payerId,
            notificationType: 'OVERDUE_REMINDER',
            title: 'Overdue Bill',
            message: `Your bill ${bill.billNumber} is overdue. Please pay to avoid further penalties.`,
            channel: 'IN_APP',
            status: 'SENT',
            relatedEntityType: 'bill',
            relatedEntityId: String(bill.id),
            sentAt: new Date(),
          },
        });
      } catch (billErr) {
        logger.error(`[overdue-job] Error processing bill ${bill.billNumber}: ${(billErr as Error).message}`);
      }
    }

    logger.info('[overdue-job] Overdue bills processing complete');
  } catch (err) {
    logger.error(`[overdue-job] Fatal error: ${(err as Error).message}`);
  }
}

export function startOverdueJob() {
  // Run every day at midnight
  cron.schedule('0 0 * * *', processOverdueBills, { timezone: 'Asia/Manila' });
  logger.info('[overdue-job] Scheduled daily overdue bill processor at midnight (Asia/Manila)');
}
