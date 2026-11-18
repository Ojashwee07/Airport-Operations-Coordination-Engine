import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { currentUser } from "../lib/api";
import { ROLE_LABEL } from "../lib/format";

const links = [
  ["/", "Command center", "◎"],
  ["/flights", "Flight monitor", "✈"],
  ["/schedule", "Runways & gates", "▦"],
  ["/approvals", "Approval center", "✔"],
  ["/resources", "Staff & crew", "◆"],
  ["/agents", "AI agents", "✦"],
  ["/audit", "Audit trail", "≡"],
];

export default function Layout() {
  const navigate = useNavigate();
  const user = currentUser();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  function signOut() {
    localStorage.removeItem("airport_token");
    localStorage.removeItem("airport_user");
    navigate("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 font-black text-slate-950">A</div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-400">AOCE</div>
              <h1 className="text-sm font-semibold text-slate-100 sm:text-base">Airport Operations Coordination Engine</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <div className="font-mono text-sm tabular-nums text-slate-200">{now.toLocaleTimeString()}</div>
              <div className="flex items-center justify-end gap-1.5 text-[11px] text-slate-500"><span className="live-dot" /> Demo data · live clock</div>
            </div>
            <div className="hidden text-right md:block">
              <div className="text-sm font-medium text-slate-200">{user?.full_name || "Operator"}</div>
              <div className="text-[11px] text-cyan-300">{ROLE_LABEL[user?.role] || "Operator"}</div>
            </div>
            <button className="btn btn-ghost !px-3 !py-2 text-xs" onClick={signOut}>Sign out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6 lg:flex-row">
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-24 lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-visible">
          {links.map(([to, label, icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                  isActive ? "bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/30" : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <span className="w-4 text-center">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
