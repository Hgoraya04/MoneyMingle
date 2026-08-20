import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/api";

export function NewAccountPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [previousBalance, setPreviousBalance] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/accounts", { name, previousBalance: parseFloat(previousBalance) || 0 });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mm-view mm-formwrap">
      <h2 style={{ fontSize: 19, margin: "18px 0 16px" }}>Add account</h2>

      <form onSubmit={handleSubmit}>
        {error && <p className="mm-formerror">{error}</p>}

        <div className="mm-field">
          <label htmlFor="account-name">Name</label>
          <input id="account-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="AMEX" required />
        </div>
        <div className="mm-field">
          <label htmlFor="account-balance">Starting balance</label>
          <input
            id="account-balance"
            type="number"
            step="0.01"
            value={previousBalance}
            onChange={(e) => setPreviousBalance(e.target.value)}
          />
        </div>

        <div className="mm-footer" style={{ justifyContent: "flex-start" }}>
          <button type="button" className="mm-cancelbtn" onClick={() => navigate("/")}>
            Cancel
          </button>
          <button type="submit" className="mm-submitbtn" disabled={submitting}>
            {submitting ? "Saving…" : "Add account"}
          </button>
        </div>
      </form>
    </div>
  );
}
