import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/api";

export function NewGoalPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/goals", {
        name,
        targetAmount: parseFloat(targetAmount),
        ...(targetDate ? { targetDate } : {}),
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mm-view mm-formwrap">
      <h2 style={{ fontSize: "var(--mm-h2)", margin: "18px 0 16px" }}>Add goal</h2>

      <form onSubmit={handleSubmit}>
        {error && <p className="mm-formerror">{error}</p>}

        <div className="mm-field">
          <label htmlFor="goal-name">Name</label>
          <input id="goal-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Emergency Fund" required />
        </div>
        <div className="mm-field">
          <label htmlFor="goal-amount">Target amount</label>
          <input
            id="goal-amount"
            type="number"
            min="0.01"
            step="0.01"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="10000"
            required
          />
        </div>
        <div className="mm-field">
          <label htmlFor="goal-date">Target date (optional)</label>
          <input id="goal-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </div>

        <div className="mm-footer" style={{ justifyContent: "flex-start" }}>
          <button type="button" className="mm-cancelbtn" onClick={() => navigate("/")}>
            Cancel
          </button>
          <button type="submit" className="mm-submitbtn" disabled={submitting}>
            {submitting ? "Saving…" : "Add goal"}
          </button>
        </div>
      </form>
    </div>
  );
}
