import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const goalsRouter = Router();
goalsRouter.use(requireAuth);

const goalSchema = z.object({
  name: z.string().trim().min(1, "Give the goal a name."),
  targetAmount: z.coerce.number().positive("Target amount must be greater than zero."),
  targetDate: z.coerce.date().optional(),
});

goalsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const goals = await prisma.goal.findMany({ where: { userId: req.userId! }, orderBy: { createdAt: "asc" } });
    res.json({ goals });
  })
);

goalsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = goalSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    const goal = await prisma.goal
      .create({ data: { userId: req.userId!, ...parsed.data } })
      .catch(() => null);

    if (!goal) return res.status(409).json({ error: "You already have a goal with that name." });
    res.status(201).json({ goal });
  })
);

goalsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const parsed = goalSchema.partial().extend({ accomplished: z.boolean().optional() }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    const { count } = await prisma.goal.updateMany({
      where: { id: req.params.id, userId: req.userId! },
      data: parsed.data,
    });
    if (count === 0) return res.status(404).json({ error: "Goal not found." });
    res.json({ ok: true });
  })
);

goalsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { count } = await prisma.goal.deleteMany({ where: { id: req.params.id, userId: req.userId! } });
    if (count === 0) return res.status(404).json({ error: "Goal not found." });
    res.status(204).end();
  })
);
