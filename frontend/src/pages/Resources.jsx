import { useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import Panel from "../components/Panel";
import { STATUS_STYLE } from "../lib/format";

const AVAILABLE = new Set(["Available", "On duty", "Standby"]);

function statusClass(status) {
  if (AVAILABLE.has(status)) return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30";
  if (status === "Maintenance") return "bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30";
  if (status === "Reserved") return "bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30";
  return STATUS_STYLE[status] || "bg-slate-700/60 text-slate-200";
}

export default function Resources() {
  const [items, setItems] = useState([]);
  const [type, setType] = useState("All");

  useEffect(() => { api.get("/resources").then((r) => setItems(r.data)); }, []);

  const types = useMemo(() => ["All", ...new Set(items.map((i) => i.resource_type))], [items]);
  const summary = useMemo(() => {
    const out = {};
    items.forEach((i) => {
      out[i.resource_type] ||= { total: 0, available: 0 };
      out[i.resource_type].total += 1;
      out[i.resource_type].available += AVAILABLE.has(i.status) ? 1 : 0;
    });
    return out;
  }, [items]);
  const shown = type === "All" ? items : items.filter((i) => i.resource_type === type);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Capacity</div>
        <h2 className="mt-1 text-3xl font-bold">Staff & crew</h2>
        <p className="mt-2 text-sm text-slate-400">Available ground staff and crew, with gates and their current state.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(summary).map(([name, s]) => {
          const pct = Math.round((s.available / s.total) * 100);
          return (
            <div key={name} className="panel fade-up p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-200">{name}</span>
                <span className="text-slate-400">{s.available}/{s.total} available</span>
              </div>
              <div className="progress mt-4"><span className="bg-gradient-to-r from-emerald-300 to-cyan-400" style={{ width: `${pct}%` }} /></div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {types.map((t) => (
          <button key={t} onClick={() => setType(t)} className={`rounded-full px-4 py-1.5 text-xs font-semibold ${type === t ? "bg-cyan-400 text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>{t}</button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((i) => (
          <Panel key={i.id} className="!p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/30">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">{i.resource_type} · {i.airport}</span>
              <span className={`badge ${statusClass(i.status)}`}>{i.status}</span>
            </div>
            <h3 className="mt-3 text-lg font-semibold text-slate-100">{i.name}</h3>
            <p className="mt-1 text-sm text-slate-400">{i.location}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
