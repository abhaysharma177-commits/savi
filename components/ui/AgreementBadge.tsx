import type { AgreementLevel } from "@/types";

const MAP: Record<
  AgreementLevel,
  { label: string; cls: string; dot: string }
> = {
  strong: {
    label: "Strong consensus",
    cls: "border-agree/40 bg-agree/10 text-agree-soft",
    dot: "bg-agree",
  },
  moderate: {
    label: "Moderate consensus",
    cls: "border-clinical/40 bg-clinical/10 text-clinical-soft",
    dot: "bg-clinical",
  },
  weak: {
    label: "Weak consensus",
    cls: "border-caution/40 bg-caution/10 text-caution-soft",
    dot: "bg-caution",
  },
  none: {
    label: "No clear consensus",
    cls: "border-danger/40 bg-danger/10 text-danger-soft",
    dot: "bg-danger",
  },
};

export function AgreementBadge({ level }: { level: AgreementLevel }) {
  const m = MAP[level] ?? MAP.none;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${m.cls}`}
    >
      <span className={`h-2 w-2 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}
