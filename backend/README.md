# Backend

Express + TypeScript API backed by Postgres (Neon) via Prisma.

## Setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL (from Neon) and JWT_SECRET
npm run prisma:migrate # creates the tables in your database
npm run dev             # http://localhost:4000
```

## Structure

```
prisma/schema.prisma   User, Account, Goal, Transaction models
src/
  index.ts             Express app + route wiring
  lib/
    prisma.ts           Prisma client
    auth.ts              password hashing, JWT sign/verify
    calculations.ts     saved-so-far, account balances, dashboard aggregation
    asyncHandler.ts      wraps routes so thrown errors reach the error handler
  middleware/
    requireAuth.ts       reads the Bearer token, rejects if missing/invalid
  routes/
    auth.ts               POST /register, /login, GET /me
    accounts.ts            GET/POST /, PATCH/DELETE /:id
    goals.ts                GET/POST /, PATCH/DELETE /:id
    transactions.ts        GET /, POST /deposit, /withdrawal, /reallocate
    dashboard.ts            GET / — everything the dashboard needs in one call
```

## The withdrawal rule

Every withdrawal line carries `reduceGoalAmount: boolean`. A goal's saved-so-far
only drops when that's `true`. See [`docs/initial-thoughts.md`](../docs/initial-thoughts.md#withdrawal-logic-reduce-vs-keep)
for the full reasoning, and `lib/calculations.ts` for the implementation.

`POST /api/transactions/withdrawal` takes a `lines` array so a single
withdrawal can be split across more than one goal when one goal doesn't have
enough saved — the server checks each line against that goal's current
saved-so-far and rejects the request if any line asks for more than is there.

## Auth

No third-party auth vendor — plain email/password. Passwords are hashed with
bcrypt; a successful login/register returns a JWT that the frontend sends back
as `Authorization: Bearer <token>` on every request after that.
