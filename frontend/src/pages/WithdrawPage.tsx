import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { money } from "../lib/format";
import type { AccountSummary, Dashboard, GoalSummary } from "../lib/types";

type Line = { goalId: string; amount: string; reduceGoalAmount: boolean | null };

// Local calendar date, not UTC — toISOString() can land on the wrong day
// near midnight depending on the viewer's timezone.
function todayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function WithdrawPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetGoalId = searchParams.get("goalId");

  const [goals, setGoals] = useState<GoalSummary[]>([]);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [lineErrors, setLineErrors] = useState<Record<number, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    api.get<Dashboard>("/dashboard").then((dash) => {
      setGoals(dash.goals);
      setAccounts(dash.accounts);
      setAccountId(dash.accounts[0]?.id ?? "");

      const preset = dash.goals.find((g) => g.id === presetGoalId);
      const firstGoal = preset ?? dash.goals[0];
      setLines(
        firstGoal
          ? [
              {
                goalId: firstGoal.id,
                amount: preset ? preset.savedSoFar : "",
                reduceGoalAmount: preset ? false : null,
              },
            ]
          : []
      );
      setLoaded(true);
    });
  }, [presetGoalId]);

  function available(goalId: string): number {
    return parseFloat(goals.find((g) => g.id === goalId)?.savedSoFar ?? "0");
  }

  function goalName(goalId: string): string {
    return goals.find((g) => g.id === goalId)?.name ?? "";
  }

  function usedGoalIds(exceptIndex: number): string[] {
    return lines.filter((_, i) => i !== exceptIndex).map((l) => l.goalId);
  }

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
    setLineErrors((prev) => ({ ...prev, [index]: "" }));
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function addLine() {
    const used = lines.map((l) => l.goalId);
    const next = goals.find((g) => !used.includes(g.id));
    if (next) setLines((prev) => [...prev, { goalId: next.id, amount: "", reduceGoalAmount: null }]);
  }

  function toggleAdvanced() {
    if (advancedOpen) {
      setLines((prev) => prev.slice(0, 1));
      setAdvancedOpen(false);
    } else {
      if (lines.length < 2) addLine();
      setAdvancedOpen(true);
    }
  }

  const total = lines.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);

  async function handleSubmit() {
    const errors: Record<number, string> = {};
    lines.forEach((line, i) => {
      const amt = parseFloat(line.amount) || 0;
      if (amt <= 0) errors[i] = "Enter an amount greater than zero.";
      else if (amt > available(line.goalId)) errors[i] = `Only ${money(available(line.goalId))} available in ${goalName(line.goalId)}.`;
      else if (line.reduceGoalAmount === null) errors[i] = `Choose Yes or No for ${goalName(line.goalId)}.`;
    });
    if (Object.keys(errors).length > 0) {
      setLineErrors(errors);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await api.post("/transactions/withdrawal", {
        accountId,
        date,
        description,
        lines: lines.map((l) => ({
          goalId: l.goalId,
          amount: parseFloat(l.amount),
          reduceGoalAmount: l.reduceGoalAmount,
        })),
      });
      const summary = lines
        .map((l) =>
          l.reduceGoalAmount
            ? `${goalName(l.goalId)} reduced to ${money(available(l.goalId) - (parseFloat(l.amount) || 0))}`
            : `${goalName(l.goalId)} stays at ${money(available(l.goalId))}`
        )
        .join(". ");
      setDone(`Logged — ${summary}.`);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!loaded) return <p className="mm-loading">Loading…</p>;
  if (goals.length === 0 || accounts.length === 0) {
    return <p className="mm-empty">You need at least one goal and one account before logging a withdrawal.</p>;
  }

  return (
    <div className="mm-view mm-formwrap">
      <h2 style={{ fontSize: "var(--mm-h2)", margin: "18px 0 16px" }}>Log withdrawal</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <div className="mm-field" style={{ flex: 1, marginBottom: 0 }}>
          <label htmlFor="account">Account</label>
          <select id="account" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mm-field" style={{ flex: 1, marginBottom: 0 }}>
          <label htmlFor="date">Date</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <div className="mm-field">
        <label htmlFor="description">Description</label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Fall tuition installment"
        />
      </div>

      <p className="mm-sectionlabel" style={{ marginTop: 16 }}>
        Withdraw from
      </p>

      {lines.map((line, index) => (
        <div className="mm-line" key={index}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: "var(--mm-text2)", display: "block", marginBottom: 3 }}>Goal</label>
              <select value={line.goalId} onChange={(e) => updateLine(index, { goalId: e.target.value, reduceGoalAmount: null })}>
                {goals
                  .filter((g) => g.id === line.goalId || !usedGoalIds(index).includes(g.id))
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: "var(--mm-text2)", display: "block", marginBottom: 3 }}>Amount</label>
              <input type="number" value={line.amount} onChange={(e) => updateLine(index, { amount: e.target.value })} />
            </div>
            {index > 0 && (
              <button type="button" className="mm-remove" aria-label="Remove goal" onClick={() => removeLine(index)}>
                <svg className="icon">
                  <use href="#i-x" />
                </svg>
              </button>
            )}
          </div>
          <p style={{ fontSize: 11, color: "var(--mm-muted)", margin: "5px 0 8px" }}>
            {money(available(line.goalId))} available in {goalName(line.goalId)}
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              className={"mm-seg" + (line.reduceGoalAmount === true ? " on-yes" : "")}
              onClick={() => updateLine(index, { reduceGoalAmount: true })}
            >
              <svg className="icon" style={{ width: 12, height: 12 }}>
                <use href="#i-arrow-down" />
              </svg>{" "}
              Yes, reduce
            </button>
            <button
              type="button"
              className={"mm-seg" + (line.reduceGoalAmount === false ? " on-no" : "")}
              onClick={() => updateLine(index, { reduceGoalAmount: false })}
            >
              <svg className="icon" style={{ width: 12, height: 12 }}>
                <use href="#i-shield" />
              </svg>{" "}
              No, keep
            </button>
          </div>
          {lineErrors[index] && <p style={{ display: "block", color: "var(--mm-blush-deep)", fontSize: 11, margin: "6px 0 0" }}>{lineErrors[index]}</p>}
        </div>
      ))}

      {advancedOpen && lines.length < goals.length && (
        <button type="button" className="mm-link" onClick={addLine}>
          <svg className="icon">
            <use href="#i-plus" />
          </svg>
          Add another goal
        </button>
      )}
      <button type="button" className="mm-link" onClick={toggleAdvanced}>
        <svg className="icon">
          <use href="#i-sliders" />
        </svg>
        {advancedOpen ? "Hide additional options" : "Additional options — split across more than one goal"}
      </button>

      {lines.length > 1 && (
        <div className="mm-totalbox">
          <strong style={{ color: "var(--mm-text)" }}>Total withdrawal: {money(total)}</strong>
          <br />
          {lines.map((l) => `${goalName(l.goalId)} ${money(parseFloat(l.amount) || 0)}`).join(" + ")}
        </div>
      )}

      {formError && <p className="mm-formerror">{formError}</p>}

      <div className="mm-footer">
        {done ? (
          <p style={{ fontSize: 13, color: "var(--mm-mint-deep)", margin: 0, display: "flex", alignItems: "flex-start", gap: 6 }}>
            <svg className="icon" style={{ stroke: "var(--mm-mint-deep)", marginTop: 2 }}>
              <use href="#i-check" />
            </svg>
            <span>
              {done} <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}>Back to dashboard</a>
            </span>
          </p>
        ) : (
          <>
            <button type="button" className="mm-cancelbtn" onClick={() => navigate("/")}>
              Cancel
            </button>
            <button type="button" className="mm-submitbtn" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Logging…" : "Log withdrawal"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
