import { PenaltyRule, Bill } from '@prisma/client';

export interface PenaltyResult {
  ruleId: number;
  type: string;
  amount: number;
  reason: string;
}

export function calculatePenalties(
  bill: Bill & { items: Array<{ amount: number; feeId: number }> },
  penaltyRules: PenaltyRule[],
  currentDate: Date = new Date()
): PenaltyResult[] {
  const results: PenaltyResult[] = [];
  const dueDate = new Date(bill.dueDate);

  if (currentDate <= dueDate) return results;

  const daysOverdue = Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  const baseAmount = parseFloat(bill.totalAmount.toString());

  for (const rule of penaltyRules) {
    if (!rule.active) continue;
    if (daysOverdue <= rule.gracePeriodDays) continue;

    let penaltyAmount = 0;
    const rate = parseFloat(rule.amountOrRate.toString());

    if (rule.penaltyType === 'LATE' || rule.penaltyType === 'SURCHARGE') {
      if (rule.calculationMethod === 'FIXED') {
        penaltyAmount = rate;
      } else {
        penaltyAmount = (baseAmount * rate) / 100;
      }
    } else if (rule.penaltyType === 'INTEREST' && rule.applyMonthly) {
      const monthsOverdue = Math.floor(daysOverdue / 30);
      if (rule.calculationMethod === 'PERCENTAGE') {
        penaltyAmount = (baseAmount * rate * monthsOverdue) / 100;
      } else {
        penaltyAmount = rate * monthsOverdue;
      }
    }

    if (rule.maxPenaltyAmount) {
      const maxAmount = parseFloat(rule.maxPenaltyAmount.toString());
      penaltyAmount = Math.min(penaltyAmount, maxAmount);
    }

    if (penaltyAmount > 0) {
      results.push({
        ruleId: rule.id,
        type: rule.penaltyType,
        amount: parseFloat(penaltyAmount.toFixed(2)),
        reason: `${rule.penaltyType} penalty - ${daysOverdue} days overdue`,
      });
    }
  }

  return results;
}

export function calculateTotalPenalty(penalties: PenaltyResult[]): number {
  return penalties.reduce((sum, p) => sum + p.amount, 0);
}
