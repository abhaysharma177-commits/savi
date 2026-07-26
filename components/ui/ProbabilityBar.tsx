import { CountUp } from "@/components/motion/CountUp";

export function ProbabilityBar({
  label,
  percent,
  agreeing,
  total,
  rank,
}: {
  label: string;
  percent: number;
  agreeing?: number;
  total?: number;
  rank: number;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  const isTop = rank === 0;
  return (
    <div className="print-block">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span
          className={`truncate text-sm ${
            isTop ? "font-semibold text-ink" : "text-ink-muted"
          }`}
        >
          {label || "Unspecified"}
        </span>
        <span className="mono shrink-0 text-xs text-ink-muted">
          {typeof agreeing === "number" && typeof total === "number" && total > 0 ? (
            <span className="mr-2 text-ink-faint">
              {agreeing}/{total} agree
            </span>
          ) : null}
          <span className={isTop ? "text-clinical-soft" : ""}>
            <CountUp value={pct} suffix="%" />
          </span>
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className={`print-bar h-full rounded-full transition-[width] duration-700 ease-out ${
            isTop ? "bg-clinical" : "bg-clinical/40"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
