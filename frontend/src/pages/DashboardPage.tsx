import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { money, monthYear, shortDate } from "../lib/format";
import { GOAL_COLORS, type Dashboard, type Transaction } from "../lib/types";
import { useAuth } from "../lib/AuthContext";

export function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.get<Dashboard>("/dashboard"), api.get<{ transactions: Transaction[] }>("/transactions")])
      .then(([dash, txns]) => {
        setDashboard(dash);
        setTransactions(txns.transactions.slice(0, 6));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load your dashboard."));
  }, []);

  if (error) return <p className="mm-loading">{error}</p>;
  if (!dashboard) return <p className="mm-loading">Loading…</p>;

  const { goals, accounts, allocation } = dashboard;
  const goalColor = (index: number) => `var(${GOAL_COLORS[index % GOAL_COLORS.length]})`;

  const totalSaved = goals.reduce((sum, g) => sum + parseFloat(g.savedSoFar), 0);
  const totalTarget = goals.reduce((sum, g) => sum + parseFloat(g.targetAmount), 0);
  const totalRemaining = Math.max(0, totalTarget - totalSaved);
  const overallPercent = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  const maxAccountBalance = Math.max(1, ...accounts.map((a) => parseFloat(a.currentBalance)));
  const scaleMax = maxAccountBalance * 1.15;

  return (
    <div className="mm-view">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "18px 0 16px", flexWrap: "wrap", gap: 8 }}>
        <div>
          <p style={{ fontSize: 12.5, color: "var(--mm-text2)", margin: "0 0 2px" }}>Good to see you, {user?.name}</p>
          <h2 style={{ fontSize: "var(--mm-h2)" }}>Your savings overview</h2>
        </div>
        <Link to="/withdraw" className="mm-primary" style={{ width: "auto", padding: "0 14px", display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
          <svg className="icon" style={{ stroke: "var(--mm-on-brand)" }}>
            <use href="#i-plus" />
          </svg>
          Log withdrawal
        </Link>
      </div>

      <div className="mm-kpis">
        <div className="mm-kpi">
          <p className="label">Total saved</p>
          <p className="value tabular">{money(totalSaved)}</p>
        </div>
        <div className="mm-kpi">
          <p className="label">Remaining</p>
          <p className="value tabular">{money(totalRemaining)}</p>
        </div>
        <div className="mm-kpi">
          <p className="label">Overall progress</p>
          <p className="value tabular">{overallPercent}%</p>
        </div>
        <div className="mm-kpi">
          <p className="label">Active goals</p>
          <p className="value tabular">{goals.length}</p>
        </div>
      </div>

      <div className="mm-dashgrid">
      <div className="mm-dash-main">

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p className="mm-sectionlabel">Goals</p>
        <Link to="/goals/new" className="mm-link" style={{ marginBottom: 9, textDecoration: "none" }}>
          <svg className="icon">
            <use href="#i-plus" />
          </svg>
          Add goal
        </Link>
      </div>
      {goals.length === 0 && <p className="mm-empty">No goals yet.</p>}
      {goals.map((goal, i) => {
        const pct = Math.round(goal.percentComplete);
        const color = goalColor(i);
        const canWithdraw = parseFloat(goal.availableToWithdraw) > 0.004;
        return (
          <div className="mm-goal" key={goal.id}>
            <div className="mm-goal-top">
              <div className="mm-goal-name">
                <span className="mm-dot" style={{ background: color }} />
                {goal.name}
              </div>
              {goal.accomplished ? (
                <span className="mm-badge" style={{ background: "var(--mm-mint-soft)", color: "var(--mm-mint-deep)" }}>
                  <svg className="icon" style={{ width: 12, height: 12 }}>
                    <use href="#i-check" />
                  </svg>
                  Goal reached
                </span>
              ) : (
                <span className="mm-goal-pct">{pct}% complete</span>
              )}
            </div>
            <div className="mm-track">
              <div className="mm-fill" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
            </div>
            <div className="mm-goal-stats">
              <div>
                <p className="mm-goal-stat-label">Saved so far</p>
                <p className="mm-goal-stat-value tabular">
                  {money(goal.savedSoFar)}
                  <span className="mm-goal-stat-of"> of {money(goal.targetAmount)}</span>
                </p>
              </div>
              <div>
                <p className="mm-goal-stat-label">Withdrawn</p>
                <p className="mm-goal-stat-value tabular">{money(goal.totalWithdrawn)}</p>
              </div>
              <div>
                <p className="mm-goal-stat-label">Left to withdraw</p>
                <p className="mm-goal-stat-value tabular">{money(goal.availableToWithdraw)}</p>
              </div>
            </div>
            <div className="mm-goal-meta" style={{ marginBottom: 10 }}>
              <span>
                {goal.targetDate && monthYear(goal.targetDate)}
                {goal.monthlyTarget && parseFloat(goal.monthlyTarget) > 0 && ` · ${money(goal.monthlyTarget)}/mo`}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {canWithdraw ? (
                <Link to={`/withdraw?goalId=${goal.id}`} className="mm-ghostbtn" style={{ width: "fit-content", textDecoration: "none" }}>
                  <svg className="icon" style={{ width: 13, height: 13 }}>
                    <use href="#i-arrow-down" />
                  </svg>
                  Withdraw funds
                </Link>
              ) : (
                <button type="button" className="mm-ghostbtn" disabled title="No more available to withdraw" style={{ width: "fit-content" }}>
                  <svg className="icon" style={{ width: 13, height: 13 }}>
                    <use href="#i-arrow-down" />
                  </svg>
                  Withdraw funds
                </button>
              )}
              {goals.length > 1 &&
                (canWithdraw ? (
                  <Link to={`/transfer?fromGoalId=${goal.id}`} className="mm-ghostbtn" style={{ width: "fit-content", textDecoration: "none" }}>
                    <svg className="icon" style={{ width: 13, height: 13 }}>
                      <use href="#i-exchange" />
                    </svg>
                    Transfer to another goal
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="mm-ghostbtn"
                    disabled
                    title="No more available to withdraw"
                    style={{ width: "fit-content" }}
                  >
                    <svg className="icon" style={{ width: 13, height: 13 }}>
                      <use href="#i-exchange" />
                    </svg>
                    Transfer to another goal
                  </button>
                ))}
            </div>
          </div>
        );
      })}

      </div>

      <div className="mm-dash-side">

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p className="mm-sectionlabel">Accounts</p>
        <Link to="/accounts/new" className="mm-link" style={{ marginBottom: 9, textDecoration: "none" }}>
          <svg className="icon">
            <use href="#i-plus" />
          </svg>
          Add
        </Link>
      </div>
      {accounts.length === 0 && <p className="mm-empty">No accounts yet.</p>}
      <div className="mm-accounts">
        {accounts.map((account) => (
          <div className="mm-account" key={account.id}>
            <div className="mm-account-left">
              <svg className="icon">
                <use href="#i-card" />
              </svg>
              {account.name}
            </div>
            <span className="tabular" style={{ fontWeight: 500 }}>
              {money(account.currentBalance)}
            </span>
          </div>
        ))}
      </div>

      {accounts.length > 0 && goals.length > 0 && (
        <>
          <p className="mm-sectionlabel" style={{ marginTop: 20 }}>
            Allocation by account
          </p>
          {accounts.map((account) => {
            const cells = allocation.filter((cell) => cell.accountId === account.id);
            return (
              <div className="mm-chart-row" key={account.id}>
                <span className="mm-chart-label">{account.name}</span>
                <div className="mm-chart-track">
                  {cells.map((cell) => {
                    const goalIndex = goals.findIndex((g) => g.id === cell.goalId);
                    const width = (parseFloat(cell.amount) / scaleMax) * 100;
                    return (
                      <div
                        key={cell.goalId}
                        className="mm-chart-seg"
                        style={{ width: `${width}%`, background: goalColor(goalIndex) }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div className="mm-legend" style={{ marginTop: 4 }}>
            {goals.map((goal, i) => (
              <span key={goal.id}>
                <i style={{ background: goalColor(i) }} />
                {goal.name}
              </span>
            ))}
          </div>
        </>
      )}

      </div>

      <div className="mm-dash-full">
      <p className="mm-sectionlabel">Recent transactions</p>
      {transactions.length === 0 ? (
        <p className="mm-empty">No transactions logged yet.</p>
      ) : (
        <div className="mm-txn">
          {transactions.map((txn) => {
            const isDeposit = txn.type === "DEPOSIT";
            const color = isDeposit ? "var(--mm-mint-deep)" : "var(--mm-blush-deep)";
            return (
              <div className="mm-txn-row" key={txn.id}>
                <div className="mm-txn-left">
                  <svg className="icon" style={{ color }}>
                    <use href={isDeposit ? "#i-arrow-up" : "#i-arrow-down"} />
                  </svg>
                  <div>
                    <p className="mm-txn-desc">{txn.description}</p>
                    <p className="mm-txn-sub">
                      {txn.goal.name} · {txn.account.name}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="mm-txn-amt tabular" style={{ color }}>
                    {isDeposit ? "+" : "−"}
                    {money(txn.amount)}
                  </p>
                  <p className="mm-txn-date">{shortDate(txn.date)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      </div>
    </div>
  );
}
