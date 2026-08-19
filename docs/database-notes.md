# Database & Hosting Notes

## Recommendation: Neon (Postgres), free tier

You already have a Neon account, and it's a good fit here — Postgres is a relational database, and this project's data (users → accounts → goals → transactions) is inherently relational. No need to look elsewhere to start.

## Will the free tier run out of space?

Almost certainly not, for this project. Here's the actual math:

- Neon's free tier gives **0.5 GB (500 MB)** of storage per project.
- A transaction row (date, user_id, goal_id, account_id, amount, type, a short description) is roughly **100–300 bytes** including indexes.
- 500 MB ÷ ~300 bytes ≈ **1.5+ million transaction rows** before hitting the limit.
- Even logging 20 transactions a day, every day, for years, is a few thousand rows a year — nowhere close.

The users, accounts, and goals tables are tiny by comparison (a handful of rows per user). Storage pressure in real apps almost always comes from large binary data — images, PDFs, file uploads, logs — none of which this project needs to store. As long as receipts/attachments are never stored as files in the database, 500 MB will last a very long time.

Neon also auto-suspends compute when the database is idle, so there's no cost risk from leaving it running — it just wakes up on the next request (with a brief cold-start delay).

## What would actually cause problems

Worth knowing so it's avoided from the start:

- **Storing images/files in the database** (e.g. receipt photos) — use file storage (S3, Cloudflare R2) instead if that's ever added, and just store a URL/reference in Postgres.
- **Logging every keystroke or request as a row** — only store meaningful events (an actual transaction), not UI noise.
- **Never deleting old data** — not a real concern at this scale, but if the app ever has thousands of users, revisit archiving old transactions.

None of these apply to the current MVP scope.

## Setup Checklist (when backend work starts)

1. Create a new Neon project for MoneyMingle (separate from any other project on the account, to keep the 0.5 GB budget dedicated to this app).
2. Copy the connection string into `backend/.env` as `DATABASE_URL` — **never commit this file** (already covered by `.gitignore`).
3. Use Prisma (or a similar ORM) to define the schema from [`initial-thoughts.md`](initial-thoughts.md) and run migrations against Neon directly — no separate local Postgres install needed.
4. Keep one branch/environment for now (Neon supports database branching later if a staging environment becomes useful).

## Alternatives considered

- **Supabase** — also a solid free Postgres option with built-in auth; not chosen here since you already have Neon and the plan is to build auth by hand.
- **SQLite (local file)** — fine for a throwaway prototype, but doesn't support multiple users hitting a hosted app, so not suitable once this is a real deployed website.

Sticking with Neon avoids managing yet another account/service and keeps costs at zero until the app is far bigger than a personal tracker.
