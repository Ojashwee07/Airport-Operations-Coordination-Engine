import { LEVEL_STYLE, REC_STYLE, STATUS_STYLE } from "../lib/format";

export function LevelBadge({ level }) {
  return <span className={`badge ${LEVEL_STYLE[level] || "bg-slate-800 text-slate-300"}`}>{level} risk</span>;
}

export function RecommendationBadge({ value }) {
  return <span className={`badge ${REC_STYLE[value] || "bg-slate-800 text-slate-300"}`}>{value}</span>;
}

export function StatusBadge({ value }) {
  return <span className={`badge ${STATUS_STYLE[value] || "bg-slate-800 text-slate-300"}`}>{value}</span>;
}
