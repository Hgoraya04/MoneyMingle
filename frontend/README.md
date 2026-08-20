# Frontend

React (Vite) + TypeScript. Talks to the [backend](../backend) API.

## Setup

```bash
npm install
cp .env.example .env   # VITE_API_URL — defaults to http://localhost:4000/api, fine for local dev
npm run dev             # http://localhost:5173
```

Run this alongside the backend (`cd ../backend && npm run dev`) — both need to be
running for the app to work.

## Structure

```
src/
  main.tsx / App.tsx        entry point, router, providers
  index.css                  design tokens (light/dark) + all component styles
  lib/
    api.ts                    fetch wrapper, attaches the auth token
    AuthContext.tsx           current user, sign in/up/out
    ThemeContext.tsx          light/dark toggle, persisted to localStorage
    types.ts                   types matching the backend's JSON shapes
    format.ts                  money/date formatting helpers
  components/
    IconSprite.tsx             hand-drawn icon set (no icon font dependency)
    TopBar.tsx                  brand mark, tab nav, theme toggle
    ProtectedRoute.tsx          redirects to /signin if not logged in
  pages/
    AuthPage.tsx                sign in / create account (one page, toggled)
    DashboardPage.tsx           goals, accounts, allocation chart, transactions
    WithdrawPage.tsx            withdrawal form, including the goal-split flow
```

## Not built yet

- No screen to create/edit goals or accounts — for now that data has to exist
  in the database already (e.g. via `npx prisma studio` in `backend/`).
- "Transfer to another goal" isn't wired to a page yet, though the backend
  endpoint (`POST /api/transactions/reallocate`) already works.
