import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { availableToWithdrawForGoal } from "../lib/calculations.js";

export const transactionsRouter = Router();
transactionsRouter.use(requireAuth);

function insufficientFundsMessage(goalName: string, available: Prisma.Decimal): string {
  return available.lessThanOrEqualTo(0)
    ? `${goalName} doesn't have any money left to withdraw.`
    : `Only $${available.toFixed(2)} available in ${goalName}.`;
}

transactionsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { goalId, accountId } = req.query;
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.userId!,
        ...(typeof goalId === "string" ? { goalId } : {}),
        ...(typeof accountId === "string" ? { accountId } : {}),
      },
      include: { goal: { select: { name: true } }, account: { select: { name: true } } },
      orderBy: { date: "desc" },
    });
    res.json({ transactions });
  })
);

const depositSchema = z.object({
  goalId: z.string().min(1),
  accountId: z.string().min(1),
  amount: z.coerce.number().positive("Enter an amount greater than zero."),
  date: z.coerce.date(),
  description: z.string().trim().min(1, "Add a short description."),
});

transactionsRouter.post(
  "/deposit",
  asyncHandler(async (req, res) => {
    const parsed = depositSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const { goalId, accountId, amount, date, description } = parsed.data;
    const userId = req.userId!;

    const [goal, account] = await Promise.all([
      prisma.goal.findFirst({ where: { id: goalId, userId } }),
      prisma.account.findFirst({ where: { id: accountId, userId } }),
    ]);
    if (!goal) return res.status(404).json({ error: "Goal not found." });
    if (!account) return res.status(404).json({ error: "Account not found." });

    const transaction = await prisma.transaction.create({
      data: { userId, goalId, accountId, amount, date, description, type: "DEPOSIT" },
    });
    res.status(201).json({ transaction });
  })
);

// A withdrawal can be split across more than one goal in a single request —
// each line says how much comes from which goal, and whether that goal's
// saved-so-far should drop by that amount. See docs/initial-thoughts.md.
const withdrawalLineSchema = z.object({
  goalId: z.string().min(1),
  amount: z.coerce.number().positive("Each line needs an amount greater than zero."),
  reduceGoalAmount: z.boolean(),
});

const withdrawalSchema = z.object({
  accountId: z.string().min(1),
  date: z.coerce.date(),
  description: z.string().trim().min(1, "Add a short description."),
  lines: z.array(withdrawalLineSchema).min(1, "Add at least one goal to withdraw from."),
});

transactionsRouter.post(
  "/withdrawal",
  asyncHandler(async (req, res) => {
    const parsed = withdrawalSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const { accountId, date, description, lines } = parsed.data;
    const userId = req.userId!;

    const goalIds = lines.map((line) => line.goalId);
    if (new Set(goalIds).size !== goalIds.length) {
      return res.status(400).json({ error: "Each goal can only appear once in a withdrawal." });
    }

    const [account, goals] = await Promise.all([
      prisma.account.findFirst({ where: { id: accountId, userId } }),
      prisma.goal.findMany({ where: { id: { in: goalIds }, userId } }),
    ]);
    if (!account) return res.status(404).json({ error: "Account not found." });
    if (goals.length !== goalIds.length) {
      return res.status(404).json({ error: "One of those goals wasn't found." });
    }

    for (const line of lines) {
      const available = await availableToWithdrawForGoal(userId, line.goalId);
      if (new Prisma.Decimal(line.amount).greaterThan(available)) {
        const goal = goals.find((g) => g.id === line.goalId)!;
        return res.status(400).json({ error: insufficientFundsMessage(goal.name, available) });
      }
    }

    const transactions = await prisma.$transaction(
      lines.map((line) =>
        prisma.transaction.create({
          data: {
            userId,
            goalId: line.goalId,
            accountId,
            amount: line.amount,
            date,
            description,
            type: "WITHDRAWAL",
            reduceGoalAmount: line.reduceGoalAmount,
          },
        })
      )
    );

    res.status(201).json({ transactions });
  })
);

// Convenience wrapper around a withdrawal (reduceGoalAmount = true) paired
// with a matching deposit, so moving money between goals is one API call.
const reallocateSchema = z.object({
  fromGoalId: z.string().min(1),
  toGoalId: z.string().min(1),
  accountId: z.string().min(1),
  amount: z.coerce.number().positive("Enter an amount greater than zero."),
  date: z.coerce.date(),
  description: z.string().trim().optional().default(""),
});

transactionsRouter.post(
  "/reallocate",
  asyncHandler(async (req, res) => {
    const parsed = reallocateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const { fromGoalId, toGoalId, accountId, amount, date, description } = parsed.data;
    const userId = req.userId!;

    if (fromGoalId === toGoalId) {
      return res.status(400).json({ error: "Choose two different goals to transfer between." });
    }

    const [account, fromGoal, toGoal] = await Promise.all([
      prisma.account.findFirst({ where: { id: accountId, userId } }),
      prisma.goal.findFirst({ where: { id: fromGoalId, userId } }),
      prisma.goal.findFirst({ where: { id: toGoalId, userId } }),
    ]);
    if (!account) return res.status(404).json({ error: "Account not found." });
    if (!fromGoal || !toGoal) return res.status(404).json({ error: "One of those goals wasn't found." });

    const available = await availableToWithdrawForGoal(userId, fromGoalId);
    if (new Prisma.Decimal(amount).greaterThan(available)) {
      return res.status(400).json({ error: insufficientFundsMessage(fromGoal.name, available) });
    }

    const suffix = description ? ` — ${description}` : "";
    const [withdrawal, deposit] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId,
          goalId: fromGoalId,
          accountId,
          amount,
          date,
          description: `Reallocation to ${toGoal.name}${suffix}`,
          type: "WITHDRAWAL",
          reduceGoalAmount: true,
          isReallocation: true,
        },
      }),
      prisma.transaction.create({
        data: {
          userId,
          goalId: toGoalId,
          accountId,
          amount,
          date,
          isReallocation: true,
          description: `Reallocation from ${fromGoal.name}${suffix}`,
          type: "DEPOSIT",
        },
      }),
    ]);

    res.status(201).json({ withdrawal, deposit });
  })
);
