# Initial Thoughts & Ideas

Converting my own personal savings tracking spreadsheet to a working website to be used by everyone.

## The Core Idea

The spreadsheet already proves the concept: track savings goals, track the accounts money actually sits in, log every deposit/withdrawal/reallocation, and let formulas do the math. The app version needs to do the same three jobs, just with a real database and a login instead of a shared spreadsheet:

1. **Goals** — what you're saving for, how much, and by when.
2. **Accounts** — where the money physically lives.
3. **Transactions** — the ledger that ties the two together and drives every number on the dashboard.

## Data Model Sketch

- **User** — id, email, hashed password, created_at
- **Account** — id, user_id, name (e.g. "AMEX", "Apple"), previous_balance, current_balance
- **Goal** — id, user_id, name, target_amount, target_date, accomplished (boolean)
- **Transaction** — id, user_id, goal_id, account_id, date, description, amount, type (deposit / withdrawal)

Everything the spreadsheet calculates with formulas — saved-so-far, remaining, % complete, monthly target, current account balance — becomes a query or a computed value instead of a cell formula. None of it needs to be stored redundantly; it can be derived from the Transaction table whenever the dashboard loads.

Reallocations (moving money between goals or accounts) stay as **two linked transactions** — a withdrawal and a deposit — exactly like the spreadsheet's macro does it. That keeps the ledger balanced and avoids needing a separate "transfer" concept.

## Dashboard

This is explicitly the piece to spend the most design time on before writing code. Some starting questions to think through:

- What's the *first thing* someone should see — total progress across all goals, or per-goal detail?
- Does the stacked account/goal chart from the spreadsheet carry over as-is, or is there something clearer for a web UI (e.g. per-goal progress rings, a timeline)?
- How much of the "zero-based budgeting" feel (every dollar assigned somewhere) should the UI enforce vs. just report?
- Mobile-friendly from day one, since a future app will reuse the same design language.


## MVP Scope (Web)

- Sign up / log in
- Create/edit/delete goals and accounts
- Log a transaction (deposit, withdrawal, reallocation)
- Dashboard showing progress per goal + account balances
- Transaction history, filterable by goal/account

**Not** in scope for v1: notifications/reminders, bank account syncing (Plaid, etc.), budgeting beyond savings goals, multi-currency. These are reasonable "later" ideas, not MVP.

## Open Questions

- Should target dates support recurring goals (e.g. "Education - Fall" repeating every year), or is that a manual re-create each time?
- Any interest in shared/family goals (multiple users on one goal), or is this strictly single-user per account?
- Deployment target for frontend/backend hosting (Vercel, Render, Railway, Fly.io) — not decided yet, database (Neon) is the only piece already chosen.

## Reference

Full breakdown of how the original spreadsheet works: [`Spreadsheet Documentation Updated.pdf`](Spreadsheet%20Documentation%20Updated.pdf).
