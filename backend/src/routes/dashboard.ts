import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { getDashboard } from "../lib/calculations.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const data = await getDashboard(req.userId!);
    res.json(data);
  })
);
