export default function Panel({ title, subtitle, action, children, className = "", glow = false }) {
  return (
    <section className={`panel fade-up p-5 ${glow ? "panel-glow" : ""} ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-100">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
