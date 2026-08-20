import { NavLink } from "react-router-dom";
import { useTheme } from "../lib/ThemeContext";

const TABS = [
  { to: "/", label: "Dashboard", icon: "i-home" },
  { to: "/withdraw", label: "Withdraw", icon: "i-arrow-down" },
];

export function TopBar() {
  const { theme, toggle } = useTheme();

  return (
    <>
      <div className="mm-topbar">
        <div className="mm-brandmark">
          <span className="mark">
            <svg className="icon" style={{ width: 15, height: 15 }}>
              <use href="#i-wallet" />
            </svg>
          </span>
          <span>MoneyMingle</span>
        </div>
        <button className="mm-themebtn" aria-label="Toggle dark mode" onClick={toggle}>
          <svg className="icon" style={{ stroke: "var(--mm-text2)" }}>
            <use href={theme === "dark" ? "#i-sun" : "#i-moon"} />
          </svg>
        </button>
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
