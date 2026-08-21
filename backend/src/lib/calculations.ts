import { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

const ZERO = new Prisma.Decimal(0);
const AVG_DAYS_PER_MONTH = 30.44;

export type GoalSummary = {
  id: string;
  name: string;
  targetAmount: Prisma.Decimal;
  targetDate: Date | null;
  accomplished: boolean;
  savedSoFar: Prisma.Decimal;
  totalWithdrawn: Prisma.Decimal;
  availableToWithdraw: Prisma.Decimal;
  remaining: Prisma.Decimal;
  percentComplete: number;
  monthsLeft: number | null;
  monthlyTarget: Prisma.Decimal | null;
};

export type AccountSummary = {
  id: string;
  name: string;
  previousBalance: Prisma.Decimal;
  currentBalance: Prisma.Decimal;
};

export type AllocationCell = { goalId: string; accountId: string; amount: Prisma.Decimal };

/**
 * A goal's progress only moves backward when a withdrawal is explicitly marked
 * reduceGoalAmount = true. A withdrawal spent on the goal's own purpose
 * (reduceGoalAmount = false) still shows in the ledger and still reduces the
 * account balance, but doesn't undo saved progress — see docs/initial-thoughts.md.
 */
export async function savedSoFarForGoal(userId: string, goalId: string): Promise<Prisma.Decimal> {
  const [deposits, reducingWithdrawals] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, goalId, type: "DEPOSIT" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, goalId, type: "WITHDRAWAL", reduceGoalAmount: true },
      _sum: { amount: true },
    }),
  ]);
  return (deposits._sum.amount ?? ZERO).minus(reducingWithdrawals._sum.amount ?? ZERO);
}

/**
 * How much actual cash is still sitting there for this goal, unspent — this is
 * the real ceiling on how much you can withdraw next, and it's DIFFERENT from
 * savedSoFar: every withdrawal counts here regardless of reduceGoalAmount,
 * because the money physically leaves either way. A reduceGoalAmount = false
 * withdrawal only protects progress; it doesn't reprint the cash.
 */
export async function availableToWithdrawForGoal(userId: string, goalId: string): Promise<Prisma.Decimal> {
  const [deposits, withdrawals] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, goalId, type: "DEPOSIT" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, goalId, type: "WITHDRAWAL" },
      _sum: { amount: true },
    }),
  ]);
  return (deposits._sum.amount ?? ZERO).minus(withdrawals._sum.amount ?? ZERO);
}

export async function getDashboard(userId: string) {
  const [goals, accounts, byGoal, byGoalAccount] = await Promise.all([
    prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.account.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.transaction.groupBy({
      by: ["goalId", "type", "reduceGoalAmount"],
      where: { userId },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["goalId", "accountId", "type"],
      where: { userId },
      _sum: { amount: true },
    }),
  ]);

  const savedSoFarByGoal = new Map<string, Prisma.Decimal>();
  const availableToWithdrawByGoal = new Map<string, Prisma.Decimal>();
  const totalWithdrawnByGoal = new Map<string, Prisma.Decimal>();
  for (const row of byGoal) {
    const sum = row._sum.amount ?? ZERO;

    const saved = savedSoFarByGoal.get(row.goalId) ?? ZERO;
    if (row.type === "DEPOSIT") {
      savedSoFarByGoal.set(row.goalId, saved.plus(sum));
    } else if (row.type === "WITHDRAWAL" && row.reduceGoalAmount === true) {
      savedSoFarByGoal.set(row.goalId, saved.minus(sum));
    }

    // Unlike savedSoFar, every withdrawal counts here regardless of
    // reduceGoalAmount — the cash leaves the goal's pool either way.
    const cash = availableToWithdrawByGoal.get(row.goalId) ?? ZERO;
    if (row.type === "DEPOSIT") {
      availableToWithdrawByGoal.set(row.goalId, cash.plus(sum));
    } else if (row.type === "WITHDRAWAL") {
      availableToWithdrawByGoal.set(row.goalId, cash.minus(sum));
    }

    if (row.type === "WITHDRAWAL") {
      totalWithdrawnByGoal.set(row.goalId, (totalWithdrawnByGoal.get(row.goalId) ?? ZERO).plus(sum));
    }
  }

  // Account balances and the goal/account allocation matrix both reflect real
  // cash movement, so every withdrawal counts here regardless of reduceGoalAmount
  // — that money has physically left the account either way.
  const allocation = new Map<string, Prisma.Decimal>();
  const netByAccount = new Map<string, Prisma.Decimal>();
  for (const row of byGoalAccount) {
    const sum = row._sum.amount ?? ZERO;
    const key = `${row.goalId}:${row.accountId}`;
    const delta = row.type === "DEPOSIT" ? sum : sum.negated();
    allocation.set(key, (allocation.get(key) ?? ZERO).plus(delta));
    netByAccount.set(row.accountId, (netByAccount.get(row.accountId) ?? ZERO).plus(delta));
  }

  const now = new Date();
  const goalSummaries: GoalSummary[] = goals.map((goal) => {
    const savedSoFar = savedSoFarByGoal.get(goal.id) ?? ZERO;
    const remaining = goal.targetAmount.minus(savedSoFar);
    const percentComplete = goal.targetAmount.isZero()
      ? 100
      : Math.min(100, savedSoFar.div(goal.targetAmount).times(100).toNumber());

    let monthsLeft: number | null = null;
    let monthlyTarget: Prisma.Decimal | null = null;
    if (goal.targetDate) {
      const msLeft = goal.targetDate.getTime() - now.getTime();
      monthsLeft = msLeft / (1000 * 60 * 60 * 24 * AVG_DAYS_PER_MONTH);
      // Dividing by less than a month (or a passed date) inflates the monthly
      // figure past the goal itself — "you need $15k/mo for a $5k goal" makes
      // no sense. Floor the divisor at 1 month: with under a month left (or
      // overdue), the "monthly" target is just what's left, once.
      monthlyTarget = remaining.div(Math.max(monthsLeft, 1));
    }

    return {
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate,
      accomplished: goal.accomplished,
      savedSoFar,
      totalWithdrawn: totalWithdrawnByGoal.get(goal.id) ?? ZERO,
      availableToWithdraw: availableToWithdrawByGoal.get(goal.id) ?? ZERO,
      remaining,
      percentComplete,
      monthsLeft,
      monthlyTarget,
    };
  });

  const accountSummaries: AccountSummary[] = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    previousBalance: account.previousBalance,
    currentBalance: account.previousBalance.plus(netByAccount.get(account.id) ?? ZERO),
  }));

  const allocationMatrix: AllocationCell[] = goals
    .flatMap((goal) =>
      accounts.map((account) => ({
        goalId: goal.id,
        accountId: account.id,
        amount: allocation.get(`${goal.id}:${account.id}`) ?? ZERO,
      }))
    )
    .filter((cell) => !cell.amount.isZero());

  return { goals: goalSummaries, accounts: accountSummaries, allocation: allocationMatrix };
}
