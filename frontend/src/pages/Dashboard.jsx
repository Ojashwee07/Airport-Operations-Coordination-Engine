import { useCallback, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api, { can } from "../lib/api";
import Panel from "../components/Panel";
import StatCard from "../components/StatCard";
import FlightMap from "../components/FlightMap";
import { LevelBadge } from "../components/Badge";
import { LEVEL_COLOR, pct } from "../lib/format";

const TOOLTIP_STYLE = { background: "#0f172a", border: "1px solid #334155", borderRadius: 10, color: "#e2e8f0" };

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(() => api.get("/dashboard").then((r) => setData(r.data)), []);
  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  async function runWorkflow() {
    setBusy(true);
    setMessage("");
    try {
      const { data: result } = await api.post("/workflows/run");
      setMessage(result.summary);
      await load();
    } catch {
      setMessage("Could not run the workflow. Check your role and that the backend is running.");
    } finally {
      setBusy(false);
    }
  }

  async function resolve(id) {
    await api.post(`/alerts/${id}/resolve`);
    load();
  }

  if (!data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="panel h-32 animate-pulse" />)}
      </div>
    );
  }

  const { stats, flights, runways, weather, alerts, runway_conflicts, gate_conflicts, risk_distribution, workflow } = data;
  const riskData = [
    { name: "High", value: risk_distribution.High, color: LEVEL_COLOR.High },
    { name: "Medium", value: risk_distribution.Medium, color: LEVEL_COLOR.Medium },
    { name: "Low", value: risk_distribution.Low, color: LEVEL_COLOR.Low },
  ];
  const runwayData = runways.map((r) => ({ name: `${r.airport} ${r.identifier}`, utilization: r.utilization_pct, flights: r.flight_count }));
  const conflictCount = runway_conflicts.length + gate_conflicts.length;

  return (
    <div className="space-y-6">
      <section className="panel-glow fade-up relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-slate-900 via-slate-900/80 to-cyan-950/40 p-6">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
              <span className="live-dot" /> Live control room · synthetic data
            </div>
            <h2 className="mt-2 text-3xl font-bold"><span className="gradient-text">{greeting()}, Operations Lead</span></h2>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              {stats.at_risk} flights need attention, {conflictCount} resource conflicts are open and{" "}
              {stats.pending_approvals} permission requests await a human decision.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {weather.map((w) => (
              <div key={w.airport} className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-xs">
                <div className="font-semibold text-slate-200">{w.airport} · {w.source}</div>
                <div className="mt-1 text-slate-400">
                  Wind {Math.round(w.wind_kmh)} km/h · Vis {Math.round(w.visibility_m / 100) / 10} km
                </div>
                <div className={`mt-1 font-medium ${w.risk >= 0.4 ? "text-amber-300" : "text-emerald-300"}`}>
                  Weather risk {pct(w.risk)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Flights monitored" value={stats.total_flights} hint={`${stats.delayed} delayed now`} icon="✈" accent="cyan" />
        <StatCard label="Flights at risk" value={stats.at_risk} hint={`${stats.high_risk} high risk`} icon="⚠" accent="amber" />
        <StatCard label="Open conflicts" value={conflictCount} hint={`${stats.runway_conflicts} runway · ${stats.gate_conflicts} gate`} icon="⛔" accent="rose" />
        <StatCard label="Pending approvals" value={stats.pending_approvals} hint={`Avg delay probability ${pct(stats.avg_delay_probability)}`} icon="✔" accent="violet" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel className="lg:col-span-3" title="Flight positions" subtitle="Marker colour shows predicted delay risk (heuristic-v1)">
          <FlightMap flights={flights} />
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
            {["High", "Medium", "Low"].map((level) => (
              <span key={level} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: LEVEL_COLOR[level] }} /> {level}
              </span>
            ))}
          </div>
        </Panel>

        <Panel className="lg:col-span-2" title="Delay risk mix" subtitle="Distribution across monitored flights">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">
                  {riskData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-2">
            {flights.map((f) => (
              <li key={f.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-200">{f.flight_number}</span>
                <span className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">~{f.prediction.expected_delay_minutes} min</span>
                  <LevelBadge level={f.prediction.level} />
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel className="lg:col-span-3" title="Runway utilization" subtitle="Share of the planned daily slots already used">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={runwayData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} unit="%" />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(34,211,238,0.06)" }} />
                <Bar dataKey="utilization" name="Utilization" fill="#22d3ee" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          className="lg:col-span-2"
          title="Disruption alerts"
          subtitle={`${alerts.length} unresolved`}
        >
          <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
            {alerts.length === 0 && <p className="text-sm text-slate-500">No open alerts. Nice work.</p>}
            {alerts.map((a) => (
              <div key={a.id} className="rounded-xl border border-white/5 bg-slate-950/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`badge ${a.severity === "High" ? "bg-rose-500/15 text-rose-300" : a.severity === "Medium" ? "bg-amber-500/15 text-amber-300" : "bg-sky-500/15 text-sky-300"}`}>{a.severity}</span>
                  <span className="truncate text-[11px] text-slate-500">{a.source}</span>
                </div>
                <div className="mt-2 text-sm font-medium text-slate-100">{a.title}</div>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{a.message}</p>
                {can("decide") && (
                  <button className="btn btn-ghost mt-3 !px-3 !py-1.5 text-xs" onClick={() => resolve(a.id)}>Mark resolved</button>
                )}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel
          className="lg:col-span-3"
          title="Agent workflow"
          subtitle="Research → Analysis → Resources → Decision"
          action={can("request") && (
            <button className="btn btn-primary !px-3 !py-2 text-xs" onClick={runWorkflow} disabled={busy}>
              {busy ? "Running…" : "Run workflow"}
            </button>
          )}
        >
          {message && <div className="mb-4 rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-3 text-sm text-cyan-200">{message}</div>}
          <ol className="relative space-y-4 border-l border-slate-700/70 pl-6">
            {workflow.trace.map((step, i) => (
              <li key={i} className="fade-up relative">
                <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400/20 ring-2 ring-cyan-400/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                </span>
                <p className="text-sm text-slate-300">{step}</p>
              </li>
            ))}
          </ol>
          <div className="mt-5 rounded-xl border border-white/5 bg-slate-950/50 p-4 text-sm text-slate-300">{workflow.summary}</div>
        </Panel>

        <Panel className="lg:col-span-2" title="Recommended actions" subtitle="Non-binding. Requires human approval.">
          <div className="space-y-3">
            {workflow.recommendations.length === 0 && <p className="text-sm text-slate-500">No actions needed right now.</p>}
            {workflow.recommendations.map((r, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-slate-950/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-100">{r.flight_number}</span>
                  <LevelBadge level={r.level} />
                </div>
                <p className="mt-1 text-xs text-slate-400">{r.action}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
