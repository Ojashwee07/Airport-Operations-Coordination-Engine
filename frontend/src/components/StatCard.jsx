const ACCENTS = {
  cyan: { bar: "from-cyan-400 to-sky-500", text: "text-cyan-300" },
  amber: { bar: "from-amber-300 to-orange-500", text: "text-amber-300" },
  rose: { bar: "from-rose-400 to-pink-600", text: "text-rose-300" },
  violet: { bar: "from-violet-400 to-fuchsia-500", text: "text-violet-300" },
  emerald: { bar: "from-emerald-300 to-teal-500", text: "text-emerald-300" },
};

export default function StatCard({ label, value, hint, icon, accent = "cyan" }) {
  const style = ACCENTS[accent] || ACCENTS.cyan;
  return (
    <div className="panel fade-up relative overflow-hidden p-5 transition hover:-translate-y-0.5">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${style.bar}`} />
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <span className="text-lg" aria-hidden>{icon}</span>
      </div>
      <div className={`mt-3 text-3xl font-bold tabular-nums ${style.text}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
