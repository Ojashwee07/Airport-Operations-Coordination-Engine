import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

const DEMO_ACCOUNTS = [
  ["ops@example.com", "Operations admin"],
  ["duty@example.com", "Duty officer"],
  ["manager@example.com", "Manager"],
  ["analyst@example.com", "Analyst"],
  ["ground@example.com", "Ground staff"],
];

export default function Login() {
  const [email, setEmail] = useState("ops@example.com");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("airport_token", data.access_token);
      localStorage.setItem("airport_user", JSON.stringify(data.user));
      navigate("/");
    } catch {
      setError("Login failed. Start the backend and check the demo credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="grid w-full max-w-4xl gap-6 md:grid-cols-5">
        <div className="panel-glow fade-up hidden flex-col justify-between rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-slate-900 to-cyan-950/50 p-8 md:col-span-2 md:flex">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-400">AOCE</div>
            <h2 className="mt-4 text-2xl font-bold"><span className="gradient-text">Coordinate every movement</span></h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">Flights, runways, gates, weather and crew in one control room. AI recommends. People decide.</p>
          </div>
          <div className="mt-8 text-xs text-slate-500">Synthetic demo data only. Not for real air traffic control.</div>
        </div>

        <form onSubmit={submit} className="panel fade-up w-full p-8 md:col-span-3">
          <h1 className="text-2xl font-bold">Operations control room</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in to coordinate airport operations.</p>

          {error && <div className="mt-5 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300">{error}</div>}

          <label className="mt-6 block text-sm text-slate-300">Email
            <input className="input mt-2" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="mt-4 block text-sm text-slate-300">Password
            <input type="password" className="input mt-2" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button className="btn btn-primary mt-6 w-full" disabled={loading}>{loading ? "Signing in…" : "Enter control room"}</button>

          <div className="mt-6 border-t border-white/5 pt-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Demo accounts (password demo123)</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {DEMO_ACCOUNTS.map(([mail, label]) => (
                <button type="button" key={mail} onClick={() => setEmail(mail)} className="rounded-lg border border-white/5 bg-slate-950/60 px-3 py-2 text-left text-xs hover:border-cyan-400/40">
                  <div className="font-semibold text-slate-200">{label}</div>
                  <div className="text-slate-500">{mail}</div>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
