import { Link, NavLink } from "react-router-dom";
import { useTheme } from "../lib/ThemeContext";
import { useAuth } from "../lib/AuthContext";

const TABS = [
  { to: "/", label: "Dashboard", icon: "i-home" },
  { to: "/withdraw", label: "Withdraw", icon: "i-arrow-down" },
];

export function TopBar() {
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <>
      <div className="mm-topbar">
        <div className="mm-topbar-left">
          <Link to="/" className="mm-brandmark">
            <span className="mark">
              <svg className="icon" style={{ width: 16, height: 16 }}>
                <use href="#i-wallet" />
              </svg>
            </span>
            <span>MoneyMingle</span>
          </Link>

          <nav className="mm-desktopnav" aria-label="Sections">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === "/"}
                className={({ isActive }) => "mm-navlink" + (isActive ? " active" : "")}
              >
                <svg className="icon">
                  <use href={`#${tab.icon}`} />
                </svg>
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mm-topbar-actions">
          <button className="mm-themebtn" aria-label="Toggle dark mode" onClick={toggle}>
            <svg className="icon" style={{ stroke: "var(--mm-text2)" }}>
              <use href={theme === "dark" ? "#i-sun" : "#i-moon"} />
            </svg>
          </button>
          <div className="mm-usermenu">
            <span className="mm-avatar">{initial}</span>
            <span className="mm-username">{user?.name}</span>
          </div>
          <button className="mm-signoutbtn" onClick={signOut}>
            <svg className="icon" style={{ width: 14, height: 14 }}>
              <use href="#i-logout" />
            </svg>
            Sign out
          </button>
        </div>
      </div>

      <nav className="mm-tabs" aria-label="Sections">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/"}
            className={({ isActive }) => "mm-tab" + (isActive ? " active" : "")}
          >
            <svg className="icon">
              <use href={`#${tab.icon}`} />
            </svg>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
