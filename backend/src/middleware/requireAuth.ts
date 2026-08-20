import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/auth.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Sign in to continue." });
  }

  try {
    req.userId = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Your session expired. Sign in again." });
  }
}
