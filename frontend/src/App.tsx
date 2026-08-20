import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext";
import { ThemeProvider } from "./lib/ThemeContext";
import { IconSprite } from "./components/IconSprite";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { WithdrawPage } from "./pages/WithdrawPage";
import { NewGoalPage } from "./pages/NewGoalPage";
import { NewAccountPage } from "./pages/NewAccountPage";
import { TransferPage } from "./pages/TransferPage";

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <IconSprite />
        <BrowserRouter>
          <Routes>
            <Route path="/signin" element={<AuthPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/withdraw" element={<WithdrawPage />} />
              <Route path="/goals/new" element={<NewGoalPage />} />
              <Route path="/accounts/new" element={<NewAccountPage />} />
              <Route path="/transfer" element={<TransferPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
