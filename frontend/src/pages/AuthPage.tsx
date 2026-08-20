import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { ApiError } from "../lib/api";

export function AuthPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(name, email, password);
      }
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mm-shell">
      <div className="mm-content mm-view">
        <div className="mm-auth-hero">
          <div className="blob" aria-hidden="true" />
          <h1>{mode === "signin" ? "Welcome back" : "Start saving with a plan"}</h1>
          <p>
            {mode === "signin"
              ? "Sign in to see where your savings stand."
              : "Set up your goals and accounts, and you're tracking."}
          </p>
        </div>

        <div className="mm-authswitch">
          <button className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")} type="button">
            Sign in
          </button>
          <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")} type="button">
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <p className="mm-formerror">{error}</p>}

          {mode === "signup" && (
            <div className="mm-field">
              <label htmlFor="name">Name</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div className="mm-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
            />
          </div>
          <div className="mm-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
              minLength={mode === "signup" ? 8 : undefined}
              required
            />
          </div>
          <button className="mm-primary" type="submit" disabled={submitting}>
            {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mm-authfoot">
          {mode === "signin" ? (
            <>
              New here?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMode("signup");
                }}
              >
                Create an account
              </a>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMode("signin");
                }}
              >
                Sign in
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
