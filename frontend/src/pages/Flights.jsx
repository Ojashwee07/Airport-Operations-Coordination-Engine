import { useEffect, useState } from "react";
import api from "../lib/api";
import Panel from "../components/Panel";
import { LevelBadge, StatusBadge } from "../components/Badge";
import { LEVEL_BAR, hhmm, pct } from "../lib/format";

const FILTERS = ["All", "Scheduled", "Boarding", "At risk", "Delayed"];

export default function Flights() {
  const [flights, setFlights] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = { search, status: status === "All" ? "" : status };
    api.get("/flights", { params }).then((r) => setFlights(r.data)).finally(() => setLoading(false));
  }, [search, status]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Operations</div>
        <h2 className="mt-1 text-3xl font-bold">Flight monitor</h2>
        <p className="mt-2 text-sm text-slate-400">Delay predictions combine airline history, live delay and weather at the hub.</p>
      </div>

      <Panel title={`${flights.length} flights`} subtitle="Filter by status or search by flight number">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            className="input md:max-w-xs"
            placeholder="Search flight number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setStatus(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  status === f ? "bg-cyan-400 text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-950/70 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                {["Flight", "Route", "Airport", "Runway", "Gate", "Time", "Status", "Predicted delay"].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td className="px-4 py-6 text-slate-500" colSpan={8}>Loading flights…</td></tr>}
              {!loading && flights.length === 0 && <tr><td className="px-4 py-6 text-slate-500" colSpan={8}>No flights match this filter.</td></tr>}
              {flights.map((f) => (
                <tr key={f.id} className="border-t border-white/5 transition hover:bg-white/[0.03]">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-100">{f.flight_number}</div>
                    <div className="text-xs text-slate-500">{f.airline}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-300">{f.origin} → {f.destination}</td>
                  <td className="px-4 py-4 text-slate-300">{f.airport}</td>
                  <td className="px-4 py-4 text-slate-300">{f.runway || "—"}</td>
                  <td className="px-4 py-4 text-slate-300">{f.gate || "—"}</td>
                  <td className="px-4 py-4 text-slate-300">{hhmm(f.scheduled_time)}</td>
                  <td className="px-4 py-4"><StatusBadge value={f.status} /></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="progress w-24">
                        <span className={`bg-gradient-to-r ${LEVEL_BAR[f.prediction.level]}`} style={{ width: pct(f.prediction.probability) }} />
                      </div>
                      <span className="tabular-nums text-slate-300">{pct(f.prediction.probability)}</span>
                      <LevelBadge level={f.prediction.level} />
                    </div>
                    <div className="mt-1 text-xs text-slate-500">~{f.prediction.expected_delay_minutes} min expected</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
