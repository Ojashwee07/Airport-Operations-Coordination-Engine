import { useEffect, useState } from "react";
import api from "../lib/api";
import Panel from "../components/Panel";

const TYPES = ["", "permission", "alert", "workflow"];

export default function Audit() {
  const [logs, setLogs] = useState([]);
  const [type, setType] = useState("");

  useEffect(() => {
    api.get("/audit-logs", { params: { entity_type: type, limit: 100 } }).then((r) => setLogs(r.data));
  }, [type]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Accountability</div>
        <h2 className="mt-1 text-3xl font-bold">Audit trail</h2>
        <p className="mt-2 text-sm text-slate-400">Every request, decision, alert resolution and workflow run is recorded with who did it.</p>
      </div>

      <Panel
        title={`${logs.length} entries`}
        action={
          <div className="flex gap-1.5">
            {TYPES.map((t) => (
              <button key={t || "all"} onClick={() => setType(t)} className={`rounded-full px-3 py-1 text-xs font-semibold ${type === t ? "bg-cyan-400 text-slate-950" : "bg-white/5 text-slate-300"}`}>
                {t || "All"}
              </button>
            ))}
          </div>
        }
      >
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-950/70 text-xs uppercase tracking-wider text-slate-500">
              <tr>{["Time", "Actor", "Action", "Entity", "Details"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {logs.length === 0 && <tr><td className="px-4 py-6 text-slate-500" colSpan={5}>No audit entries yet.</td></tr>}
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-white/5">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-300">{l.actor}</td>
                  <td className="px-4 py-3 font-medium text-slate-100">{l.action}</td>
                  <td className="px-4 py-3 text-slate-400">{l.entity_type} #{l.entity_id}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
