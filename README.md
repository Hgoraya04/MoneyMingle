# MoneyMingle

A personal savings tracker web app — turning a Google Sheets workflow into a real product with accounts, goals, transaction history, and a visual dashboard.

> **Status:** Planning / pre-development. No application code has been written yet — this repository currently contains project scaffolding and documentation only.

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Planned Tech Stack](#planned-tech-stack)
- [Project Structure](#project-structure)
- [Database & Hosting](#database--hosting)
- [Roadmap](#roadmap)
- [Documentation](#documentation)

## Overview

MoneyMingle started as a Google Sheets spreadsheet used to track savings goals (Emergency Fund, Vacation, Home, etc.) across multiple accounts, with formulas doing the math and macros logging transactions. This project rebuilds that same idea as a proper web application:

- Users log in and see **their own** data — nobody else's.
- Goals, accounts, and transactions live in a real database instead of spreadsheet cells.
- The math the spreadsheet did with `SUMIFS` and helper columns is done in application code.
- The dashboard becomes the centerpiece: a clean, visual way to see progress at a glance.

A native/mobile app is a possible future direction once the web version is solid. No AI features are planned — this is a straightforward CRUD + dashboard application, which keeps the build simpler than an AI-driven project.

## Core Features

Derived directly from how the spreadsheet works today (see [full documentation](docs/Spreadsheet%20Documentation%20Updated.pdf)):

| Feature | Description |
|---|---|
| **Multi-goal tracking** | Track several savings goals at once (e.g. Emergency Fund, Vacation, Home), each with a target amount and target date. |
| **Multi-account management** | Track balances across multiple accounts/wallets and know exactly which goal each dollar is assigned to. |
| **Automated progress metrics** | Percent complete, amount remaining, and the monthly contribution needed to hit each deadline — calculated automatically. |
| **Visual dashboard** | Progress bars and a stacked chart showing how savings are distributed across accounts and goals. |
| **Transaction log** | Every deposit, withdrawal, and reallocation recorded with a date, description, account, and amount. |
| **Reallocation** | Move funds between goals or accounts with a balanced pair of transactions (withdrawal + deposit), just like the spreadsheet's reallocation macro. |
| **User accounts** | Each user logs in and only ever sees their own goals, accounts, and history. |

## Planned Tech Stack

These are starting defaults, not locked-in decisions — flag anything you'd rather do differently.

- **Frontend:** React (Vite) + TypeScript
- **Backend:** Node.js + Express, REST API
- **Database:** PostgreSQL, hosted on [Neon](https://neon.tech) (serverless Postgres — see [Database & Hosting](#database--hosting))
- **ORM:** Prisma (typed models, migrations, keeps schema and code in sync)
- **Auth:** Email/password with hashed passwords (bcrypt) + JWT sessions, built by hand so every line is understandable — no third-party auth vendor for v1

## Project Structure

```
MoneyMingle/
├── frontend/     React application (dashboard, goals, accounts, transaction log UI)
├── backend/      Express API (auth, goals, accounts, transactions, calculations)
├── docs/         Project documentation, planning notes, and original spreadsheet reference
├── .gitignore
├── LICENSE
└── README.md
```

Each of `frontend/` and `backend/` currently just contains a short README describing what will live there — actual code comes next, once the structure and stack are confirmed.

## Database & Hosting

**Recommendation: use your existing Neon account.**

Neon is serverless Postgres — a real relational database, which fits this project well since goals, accounts, and transactions are naturally related tables. Its free tier includes ~0.5 GB of storage per project and generous compute hours, with the database auto-suspending when idle (so it costs nothing while nobody's using it).

For a personal savings tracker, running out of space on the free tier is very unlikely:

- A single transaction log row (date, goal, account, amount, type, description) is well under 1 KB.
- 0.5 GB of storage comfortably holds **hundreds of thousands of transactions** — years of daily use, even with many users.
- The tables here (users, accounts, goals, transactions) are small and text/number-heavy — no images, files, or large blobs planned, which is what actually eats up storage quickly.

## Roadmap

1. ~~Document the existing spreadsheet~~ ✅
2. Scaffold the repository (this step)
3. Design the database schema (users, accounts, goals, transactions)
4. Design the dashboard (this is the part you most want to get right — worth spending real time here before writing code)
5. Build the backend API
6. Build the frontend
7. Deploy (frontend + backend hosting TBD, database on Neon)
8. Stretch goal: mobile app

## Documentation

- [`docs/Spreadsheet Documentation Updated.pdf`](docs/Spreadsheet%20Documentation%20Updated.pdf) — cleaned-up, professionally formatted documentation of how the original spreadsheet works
- [`docs/initial-thoughts.md`](docs/initial-thoughts.md) — early product thinking and data model sketch
- [`docs/source-material/`](docs/source-material/) — original spreadsheet documentation and reference material
