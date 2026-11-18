import { useEffect, useState } from "react";
import api, { can } from "../lib/api";
import Panel from "../components/Panel";
import { RecommendationBadge, StatusBadge } from "../components/Badge";
import { shortTime } from "../lib/format";

const EMPTY_FORM = {
  airport: "DEL",
  pilot_name: "",
  call_sign: "",
  aircraft_type: "A320",
  request_type: "Takeoff",
  requested_at: "2026-10-13 18:30",
  flight_number: "",
  runway: "",
  gate: "",
  notes: "",
};

export default function Approvals() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [result, setResult] = useState(null);
  const [filter, setFilter] = useState("Pending");
  const [error, setError] = useState("");

  const load = () => api.get("/permissions").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = { ...form };
      Object.keys(payload).forEach((k) => { if (payload[k] === "") delete payload[k]; });
      const { data } = await api.post("/permissions", payload);
      setResult(data);
      setForm({ ...EMPTY_FORM, airport: form.airport, requested_at: form.requested_at });
      load();
    } catch (err) {
      setError(err.response?.data?.detail?.[0]?.msg || err.response?.data?.detail || "Could not create the request.");
    }
  }

  async function decide(id, action) {
    await api.post(`/permissions/${id}/decision`, { action });
    load();
  }

  const shown = items.filter((i) => (filter === "Pending" ? i.status === "Pending" : true));

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Human-in-the-loop</div>
        <h2 className="mt-1 text-3xl font-bold">Approval center</h2>
        <p className="mt-2 text-sm text-slate-400">The system recommends Grant, Hold or Delay. A duty officer makes the final call. This is advisory, not ATC clearance.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="New permission request" subtitle="Runway, gate and weather are checked automatically">
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-slate-400">Airport
              <select className="input mt-1" value={form.airport} onChange={(e) => setForm({ ...form, airport: e.target.value })}>
                <option value="DEL">DEL · Delhi</option>
                <option value="BOM">BOM · Mumbai</option>
              </select>
            </label>
            <label className="text-xs text-slate-400">Request type
              <select className="input mt-1" value={form.request_type} onChange={(e) => setForm({ ...form, request_type: e.target.value })}>
                {["Taxi clearance", "Takeoff", "Landing", "Pushback"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <input required className="input" placeholder="Pilot name" value={form.pilot_name} onChange={(e) => setForm({ ...form, pilot_name: e.target.value })} />
            <input required className="input" placeholder="Call sign (e.g. AI-999)" value={form.call_sign} onChange={(e) => setForm({ ...form, call_sign: e.target.value })} />
            <input required className="input" placeholder="Aircraft type" value={form.aircraft_type} onChange={(e) => setForm({ ...form, aircraft_type: e.target.value })} />
            <input required className="input" placeholder="YYYY-MM-DD HH:MM" value={form.requested_at} onChange={(e) => setForm({ ...form, requested_at: e.target.value })} />
            <input className="input" placeholder="Flight number (optional)" value={form.flight_number} onChange={(e) => setForm({ ...form, flight_number: e.target.value })} />
            <input className="input" placeholder="Runway (blank = auto)" value={form.runway} onChange={(e) => setForm({ ...form, runway: e.target.value })} />
            <input className="input" placeholder="Gate (optional)" value={form.gate} onChange={(e) => setForm({ ...form, gate: e.target.value })} />
            <input className="input" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            {error && <div className="sm:col-span-2 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300">{String(error)}</div>}
            <button className="btn btn-primary sm:col-span-2" disabled={!can("request")}>
              {can("request") ? "Submit request" : "Your role cannot submit requests"}
            </button>
          </form>

          {result && (
            <div className="fade-up mt-5 rounded-xl border border-white/10 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{result.call_sign} · recommendation</span>
                <RecommendationBadge value={result.recommendation} />
              </div>
              <div className="mt-2 text-xs text-slate-500">Risk score {Math.round(result.risk_score * 100)}% {result.suggested_runway && `· auto runway ${result.suggested_runway}`}</div>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {result.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
        </Panel>

        <Panel
          title="Decision queue"
          subtitle={`${items.filter((i) => i.status === "Pending").length} pending`}
          action={
            <div className="flex gap-1.5">
              {["Pending", "All"].map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === f ? "bg-cyan-400 text-slate-950" : "bg-white/5 text-slate-300"}`}>{f}</button>
              ))}
            </div>
          }
        >
          <div className="max-h-[38rem] space-y-3 overflow-y-auto pr-1">
            {shown.length === 0 && <p className="text-sm text-slate-500">No requests here yet.</p>}
            {shown.map((i) => (
              <div key={i.id} className="rounded-xl border border-white/5 bg-slate-950/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-100">{i.call_sign} · {i.pilot_name}</div>
                    <div className="text-xs text-slate-500">{i.airport} · {i.aircraft_type} · {i.request_type} · {i.requested_at}</div>
                  </div>
                  <RecommendationBadge value={i.recommendation} />
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span>Runway {i.runway || "—"}</span><span>·</span><span>Gate {i.gate || "—"}</span><span>·</span><span>Risk {Math.round(i.risk_score * 100)}%</span>
                </div>
                <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-slate-400">
                  {i.reasons.map((r, k) => <li key={k}>{r}</li>)}
                </ul>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge value={i.status} />
                  {i.decided_by && <span className="text-xs text-slate-500">by {i.decided_by} · {shortTime(i.decided_at)}</span>}
                  {i.status === "Pending" && can("decide") && (
                    <div className="ml-auto flex gap-2">
                      <button className="btn btn-primary !px-3 !py-1.5 text-xs" onClick={() => decide(i.id, "approve")}>Approve {i.recommendation}</button>
                      <button className="btn btn-danger !px-3 !py-1.5 text-xs" onClick={() => decide(i.id, "reject")}>Reject</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
