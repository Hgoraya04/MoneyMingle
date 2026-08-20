import "dotenv/config";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { accountsRouter } from "./routes/accounts.js";
import { goalsRouter } from "./routes/goals.js";
import { transactionsRouter } from "./routes/transactions.js";
import { dashboardRouter } from "./routes/dashboard.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/accounts", accountsRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/dashboard", dashboardRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found." });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Try again." });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`MoneyMingle API listening on http://localhost:${port}`);
});
