import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { money } from "../lib/format";
import type { AccountSummary, Dashboard, GoalSummary } from "../lib/types";

function todayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function TransferPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetFromGoalId = searchParams.get("fromGoalId");

  const [goals, setGoals] = useState<GoalSummary[]>([]);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [fromGoalId, setFromGoalId] = useState("");
  const [toGoalId, setToGoalId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    api.get<Dashboard>("/dashboard").then((dash) => {
      setGoals(dash.goals);
      setAccounts(dash.accounts);
      setAccountId(dash.accounts[0]?.id ?? "");

      const from = dash.goals.find((g) => g.id === presetFromGoalId) ?? dash.goals[0];
      const to = dash.goals.find((g) => g.id !== from?.id);
      setFromGoalId(from?.id ?? "");
      setToGoalId(to?.id ?? "");
      setLoaded(true);
    });
  }, [presetFromGoalId]);

  function available(goalId: string): number {
    return parseFloat(goals.find((g) => g.id === goalId)?.savedSoFar ?? "0");
  }

  function goalName(goalId: string): string {
    return goals.find((g) => g.id === goalId)?.name ?? "";
  }

  async function handleSubmit() {
    setError(null);

    const amt = parseFloat(amount) || 0;
    if (fromGoalId === toGoalId) {
      setError("Choose two different goals to transfer between.");
      return;
    }
    if (amt <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (amt > available(fromGoalId)) {
      setError(`Only ${money(available(fromGoalId))} available in ${goalName(fromGoalId)}.`);
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/transactions/reallocate", {
        fromGoalId,
        toGoalId,
        accountId,
        amount: amt,
        date,
        description,
      });
      setDone(
        `Logged — ${goalName(fromGoalId)} reduced to ${money(available(fromGoalId) - amt)}, ${goalName(toGoalId)} increased to ${money(
          available(toGoalId) + amt
        )}.`
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!loaded) return <p className="mm-loading">Loading…</p>;
  if (goals.length < 2 || accounts.length === 0) {
    return <p className="mm-empty">You need at least two goals and one account before transferring funds.</p>;
  }

  return (
    <div className="mm-view mm-formwrap">
      <h2 style={{ fontSize: "var(--mm-h2)", margin: "18px 0 16px" }}>Transfer to another goal</h2>

      <div className="mm-field">
        <label htmlFor="from-goal">From goal</label>
        <select id="from-goal" value={fromGoalId} onChange={(e) => setFromGoalId(e.target.value)}>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <p style={{ fontSize: 11, color: "var(--mm-muted)", margin: "5px 0 0" }}>
          {money(available(fromGoalId))} available in {goalName(fromGoalId)}
        </p>
      </div>

      <div className="mm-field">
        <label htmlFor="to-goal">To goal</label>
        <select id="to-goal" value={toGoalId} onChange={(e) => setToGoalId(e.target.value)}>
          {goals
            .filter((g) => g.id !== fromGoalId)
            .map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
        </select>
      </div>

      <div className="mm-field">
        <label htmlFor="transfer-amount">Amount</label>
        <input id="transfer-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <div className="mm-field" style={{ flex: 1 }}>
          <label htmlFor="transfer-account">Account</label>
          <select id="transfer-account" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mm-field" style={{ flex: 1 }}>
          <label htmlFor="transfer-date">Date</label>
          <input id="transfer-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="mm-field">
        <label htmlFor="transfer-description">Description (optional)</label>
        <input
          id="transfer-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="No longer need this for the trip"
        />
      </div>

      {error && <p className="mm-formerror">{error}</p>}

      <div className="mm-footer" style={{ justifyContent: "flex-start" }}>
        {done ? (
          <p style={{ fontSize: 13, color: "var(--mm-mint-deep)", margin: 0, display: "flex", alignItems: "flex-start", gap: 6 }}>
            <svg className="icon" style={{ stroke: "var(--mm-mint-deep)", marginTop: 2 }}>
              <use href="#i-check" />
            </svg>
            <span>
              {done}{" "}
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/");
                }}
              >
                Back to dashboard
              </a>
            </span>
          </p>
        ) : (
          <>
            <button type="button" className="mm-cancelbtn" onClick={() => navigate("/")}>
              Cancel
            </button>
            <button type="button" className="mm-submitbtn" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Transferring…" : "Transfer funds"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
