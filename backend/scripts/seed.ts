// One-off script to load sample goals/accounts/transactions onto an existing
// user, for testing the app without hand-entering data. Safe to re-run — it
// wipes that user's goals/accounts/transactions first, then recreates them.
//
// Usage: npx tsx scripts/seed.ts you@email.com
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/seed.ts you@email.com");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user with email ${email}. Sign up in the app first.`);
    process.exit(1);
  }

  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.goal.deleteMany({ where: { userId: user.id } });
  await prisma.account.deleteMany({ where: { userId: user.id } });

  const amex = await prisma.account.create({ data: { userId: user.id, name: "AMEX", previousBalance: 0 } });
  const apple = await prisma.account.create({ data: { userId: user.id, name: "Apple", previousBalance: 0 } });

  const emergencyFund = await prisma.goal.create({
    data: { userId: user.id, name: "Emergency Fund", targetAmount: 10000, targetDate: new Date("2026-12-31") },
  });
  const vacation = await prisma.goal.create({
    data: { userId: user.id, name: "Vacation", targetAmount: 2000, targetDate: new Date("2026-12-18") },
  });
  const home = await prisma.goal.create({
    data: { userId: user.id, name: "Home", targetAmount: 500, targetDate: new Date("2026-08-31"), accomplished: true },
  });
  const education = await prisma.goal.create({
    data: { userId: user.id, name: "Education", targetAmount: 3000, targetDate: new Date("2027-08-18") },
  });

  const tx = (data: {
    goalId: string;
    accountId: string;
    date: string;
    description: string;
    amount: number;
    type: "DEPOSIT" | "WITHDRAWAL";
    reduceGoalAmount?: boolean;
  }) =>
    prisma.transaction.create({
      data: {
        userId: user.id,
        goalId: data.goalId,
        accountId: data.accountId,
        date: new Date(data.date),
        description: data.description,
        amount: data.amount,
        type: data.type,
        reduceGoalAmount: data.reduceGoalAmount ?? null,
      },
    });

  await tx({ goalId: emergencyFund.id, accountId: amex.id, date: "2026-01-10", description: "Initial transfer", amount: 3400, type: "DEPOSIT" });
  await tx({ goalId: emergencyFund.id, accountId: apple.id, date: "2026-01-10", description: "Initial transfer", amount: 2000, type: "DEPOSIT" });
  await tx({ goalId: vacation.id, accountId: amex.id, date: "2026-01-10", description: "Initial transfer", amount: 980, type: "DEPOSIT" });
  await tx({ goalId: education.id, accountId: amex.id, date: "2026-01-10", description: "Initial transfer", amount: 1950, type: "DEPOSIT" });
  await tx({ goalId: home.id, accountId: apple.id, date: "2026-01-10", description: "Initial transfer", amount: 500, type: "DEPOSIT" });

  await tx({ goalId: vacation.id, accountId: amex.id, date: "2026-07-28", description: "Deposit allocation", amount: 120, type: "DEPOSIT" });

  // A reallocation: money moving from Education to Emergency Fund (paired withdrawal + deposit).
  await tx({ goalId: education.id, accountId: amex.id, date: "2026-08-05", description: "Reallocation to Emergency Fund", amount: 150, type: "WITHDRAWAL", reduceGoalAmount: true });
  await tx({ goalId: emergencyFund.id, accountId: amex.id, date: "2026-08-05", description: "Reallocation from Education", amount: 150, type: "DEPOSIT" });

  // A real tuition payment — spends money already counted as saved, so it doesn't reduce Education's progress.
  await tx({ goalId: education.id, accountId: amex.id, date: "2026-08-12", description: "Fall tuition payment", amount: 200, type: "WITHDRAWAL", reduceGoalAmount: false });

  await tx({ goalId: emergencyFund.id, accountId: amex.id, date: "2026-08-15", description: "Direct deposit", amount: 250, type: "DEPOSIT" });

  console.log(`Seeded goals, accounts, and transactions for ${email}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
