import { useEffect, useState } from "react";
import api, { can } from "../lib/api";
import Panel from "../components/Panel";
import { LevelBadge } from "../components/Badge";

const AGENT_INFO = {
  Research: "Collects flights, weather feeds and runway data into shared state.",
  Analysis: "Scores delay risk per flight using airline history, live delay and weather.",
  Resource: "Checks runway separation and gate turnaround for conflicts.",
  Decision: "Drafts non-binding recommendations for a human to approve.",
};

const DOT = { Complete: "bg-emerald-400", Monitoring: "bg-sky-400", "Awaiting approval": "bg-amber-400", "Conflicts found": "bg-rose-400" };

export default function Agents() {
  const [data, setData] = useState(null);
  const [query, setQuery] = useState("");
  const [memory, setMemory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const load = () => api.get("/agents").then((r) => setData(r.data));
  useEffect(() => { load(); }, []);
  useEffect(() => {
    api.get("/memory", { params: { query, limit: 6 } }).then((r) => setMemory(r.data));
  }, [query]);

  async function run() {
    setBusy(true);
    try {
      const { data: result } = await api.post("/workflows/run");
      setNote(`Workflow saved to memory and audit log. ${result.summary}`);
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">LangGraph orchestration</div>
          <h2 className="mt-1 text-3xl font-bold">AI agent activity</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">Deterministic rules run first. Every consequential action waits for an operator's approval.</p>
        </div>
        {can("request") && <button className="btn btn-primary" onClick={run} disabled={busy}>{busy ? "Running…" : "Run & save workflow"}</button>}
      </div>

      {note && <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm text-cyan-200">{note}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(data?.agents || []).map((a) => (
          <div key={a.name} className="panel fade-up p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{a.name}</h3>
              <span className="flex items-center gap-2 text-xs text-slate-300">
                <span className={`h-2 w-2 rounded-full ${DOT[a.status] || "bg-slate-500"}`} />{a.status}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{AGENT_INFO[a.name]}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Recommendations" subtitle="Non-binding. Approve or reject in the Approval center.">
          <div className="space-y-3">
            {data?.recommendations.length === 0 && <p className="text-sm text-slate-500">Nothing to recommend right now.</p>}
            {data?.recommendations.map((r, i) => (
              <div key={i} className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-slate-950/50 p-4">
                <div>
                  <div className="font-semibold text-slate-100">{r.flight_number}</div>
                  <p className="mt-1 text-sm text-slate-400">{r.action}</p>
                </div>
                <LevelBadge level={r.level} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Agent memory" subtitle="Airport rules, past disruptions and decisions. Search to recall.">
          <input className="input mb-4" placeholder="Try: wind, separation, gate, delay…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="space-y-3">
            {memory.length === 0 && <p className="text-sm text-slate-500">No matching memory.</p>}
            {memory.map((m) => (
              <div key={m.id} className="rounded-xl border border-white/5 bg-slate-950/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-100">{m.title}</span>
                  <span className="badge bg-violet-500/15 text-violet-300">{m.kind}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{m.content}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Workflow trace" subtitle="Each agent appends to shared state in order">
        <ol className="relative space-y-3 border-l border-slate-700/70 pl-6">
          {data?.trace.map((step, i) => (
            <li key={i} className="fade-up text-sm text-slate-300">{step}</li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}
