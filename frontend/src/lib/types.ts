export type User = {
  id: string;
  name: string;
  email: string;
};

export type Account = {
  id: string;
  name: string;
  previousBalance: string;
  createdAt: string;
};

export type AccountSummary = {
  id: string;
  name: string;
  previousBalance: string;
  currentBalance: string;
};

export type Goal = {
  id: string;
  name: string;
  targetAmount: string;
  targetDate: string | null;
  accomplished: boolean;
  createdAt: string;
};

export type GoalSummary = {
  id: string;
  name: string;
  targetAmount: string;
  targetDate: string | null;
  accomplished: boolean;
  savedSoFar: string;
  availableToWithdraw: string;
  remaining: string;
  percentComplete: number;
  monthsLeft: number | null;
  monthlyTarget: string | null;
};

export type AllocationCell = {
  goalId: string;
  accountId: string;
  amount: string;
};

export type Dashboard = {
  goals: GoalSummary[];
  accounts: AccountSummary[];
  allocation: AllocationCell[];
};

export type TransactionType = "DEPOSIT" | "WITHDRAWAL";

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: string;
  type: TransactionType;
  reduceGoalAmount: boolean | null;
  goal: { name: string };
  account: { name: string };
};

// Fixed, non-semantic colors for goal identity (dot, progress bar, chart segment,
// legend swatch) — assigned by position so every view agrees on the same goal's color.
export const GOAL_COLORS = [
  "--mm-lavender-deep",
  "--mm-sky-deep",
  "--mm-mint-deep",
  "--mm-peach-deep",
  "--mm-blush-deep",
] as const;
