export const LEVEL_STYLE = {
  High: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30",
  Medium: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30",
  Low: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30",
};

export const LEVEL_COLOR = { High: "#fb7185", Medium: "#fbbf24", Low: "#34d399" };
export const LEVEL_BAR = { High: "from-rose-400 to-pink-600", Medium: "from-amber-300 to-orange-500", Low: "from-emerald-300 to-teal-500" };

export const REC_STYLE = {
  Grant: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30",
  Hold: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30",
  Delay: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30",
};

export const STATUS_STYLE = {
  Pending: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30",
  Approved: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30",
  Rejected: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30",
  Scheduled: "bg-slate-700/60 text-slate-200",
  Boarding: "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/30",
  "At risk": "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30",
  Delayed: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30",
};

export const ROLE_LABEL = {
  operations_admin: "Operations admin",
  manager: "Manager",
  duty_officer: "Duty officer",
  analyst: "Analyst",
  ground_staff: "Ground staff",
};

export const pct = (value) => `${Math.round((value || 0) * 100)}%`;
export const hhmm = (value) => (value || "").split(" ")[1] || value;
export const shortTime = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");
