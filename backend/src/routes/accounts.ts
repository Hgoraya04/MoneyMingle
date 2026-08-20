import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const accountsRouter = Router();
accountsRouter.use(requireAuth);

const accountSchema = z.object({
  name: z.string().trim().min(1, "Give the account a name."),
  previousBalance: z.coerce.number().default(0),
});

accountsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const accounts = await prisma.account.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: "asc" },
    });
    res.json({ accounts });
  })
);

accountsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = accountSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    const account = await prisma.account
      .create({
        data: { userId: req.userId!, name: parsed.data.name, previousBalance: parsed.data.previousBalance },
      })
      .catch(() => null);

    if (!account) return res.status(409).json({ error: "You already have an account with that name." });
    res.status(201).json({ account });
  })
);

accountsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const parsed = accountSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    const { count } = await prisma.account.updateMany({
      where: { id: req.params.id, userId: req.userId! },
      data: parsed.data,
    });
    if (count === 0) return res.status(404).json({ error: "Account not found." });
    res.json({ ok: true });
  })
);

accountsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { count } = await prisma.account.deleteMany({ where: { id: req.params.id, userId: req.userId! } });
    if (count === 0) return res.status(404).json({ error: "Account not found." });
    res.status(204).end();
  })
);
