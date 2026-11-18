import { useEffect, useState } from "react";
import api from "../lib/api";
import Panel from "../components/Panel";
import { hhmm } from "../lib/format";
import { StatusBadge } from "../components/Badge";

const AIRPORTS = ["DEL", "BOM"];

export default function Schedule() {
  const [airport, setAirport] = useState("DEL");
  const [schedule, setSchedule] = useState(null);
  const [gates, setGates] = useState(null);
  const [at, setAt] = useState("2026-10-13 18:30");

  useEffect(() => {
    api.get("/runways/schedule", { params: { airport } }).then((r) => setSchedule(r.data));
  }, [airport]);

  useEffect(() => {
    api.get("/gates", { params: { airport, at } }).then((r) => setGates(r.data)).catch(() => setGates(null));
  }, [airport, at]);

  const runwayEntries = schedule ? Object.entries(schedule.runways) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Capacity</div>
          <h2 className="mt-1 text-3xl font-bold">Runways & gates</h2>
          <p className="mt-2 text-sm text-slate-400">Separation and turnaround rules are checked on every view.</p>
        </div>
        <div className="flex gap-2">
          {AIRPORTS.map((code) => (
            <button key={code} onClick={() => setAirport(code)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${airport === code ? "bg-cyan-400 text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
              {code}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {runwayEntries.length === 0 && <Panel title="No scheduled movements" subtitle="Nothing assigned to runways at this airport." />}
        {runwayEntries.map(([runway, items]) => {
          const conflicting = schedule.conflicts.some((c) => c.resource === runway);
          return (
            <Panel key={runway} title={`Runway ${runway}`} subtitle={`${items.length} movements · 3 min separation rule`} glow={conflicting}
              action={conflicting && <span className="badge bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30">Separation conflict</span>}>
              <ol className="relative space-y-3 border-l border-slate-700/70 pl-5">
                {items.map((item, i) => (
                  <li key={item.flight_number} className="relative">
                    <span className="absolute -left-[25px] top-2 h-2.5 w-2.5 rounded-full bg-cyan-400" />
                    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3">
                      <div>
                        <div className="font-semibold text-slate-100">{item.flight_number}</div>
                        <div className="text-xs text-slate-500">{hhmm(item.scheduled_time)} · slot {i + 1}</div>
                      </div>
                      <StatusBadge value={item.status} />
                    </div>
                  </li>
                ))}
              </ol>
            </Panel>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Separation conflicts" subtitle="Movements closer than the required gap">
          {schedule?.conflicts.length === 0 && <p className="text-sm text-emerald-300">No runway separation conflicts.</p>}
          <div className="space-y-3">
            {schedule?.conflicts.map((c, i) => (
              <div key={i} className="rounded-xl border border-rose-400/20 bg-rose-500/5 p-4 text-sm">
                <div className="font-semibold text-rose-200">{c.flights.join(" & ")} on {c.resource}</div>
                <div className="mt-1 text-xs text-slate-400">{c.gap_minutes} min apart · {c.required_minutes} min required</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Gate availability"
          subtitle="Free gates at the chosen time, after a 45 minute turnaround"
          action={<input type="text" className="input !w-44 !py-1.5 text-xs" value={at} onChange={(e) => setAt(e.target.value)} placeholder="YYYY-MM-DD HH:MM" />}
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {gates?.free_gates.length === 0 && <span className="text-sm text-slate-500">No free gates at {at}.</span>}
            {gates?.free_gates.map((g) => (
              <span key={g} className="badge bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">Gate {g}</span>
            ))}
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gate double-bookings</div>
          <div className="mt-2 space-y-2">
            {gates?.conflicts.length === 0 && <p className="text-sm text-emerald-300">No gate conflicts.</p>}
            {gates?.conflicts.map((c, i) => (
              <div key={i} className="rounded-xl border border-amber-400/20 bg-amber-500/5 p-3 text-sm">
                <span className="font-semibold text-amber-200">Gate {c.resource}</span>
                <span className="text-slate-400"> · {c.flights.join(" & ")} · {c.gap_minutes} min apart</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
