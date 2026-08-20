import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { TopBar } from "./TopBar";

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <p className="mm-loading">Loading…</p>;
  if (!user) return <Navigate to="/signin" replace />;

  return (
    <div className="mm-shell">
      <TopBar />
      <div className="mm-content">
        <Outlet />
      </div>
    </div>
  );
}
