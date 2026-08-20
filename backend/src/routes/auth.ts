import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword, signToken } from "../lib/auth.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().trim().min(1, "Enter your name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(8, "Use at least 8 characters."),
});

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "That email's already registered. Try signing in." });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { name, email, passwordHash } });
    const token = signToken(user.id);

    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  })
);

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
  })
);
