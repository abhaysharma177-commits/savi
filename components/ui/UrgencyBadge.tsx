import type { Urgency } from "@/types";

const MAP: Record<Urgency, { label: string; cls: string; dot: string }> = {
  routine: {
    label: "Routine",
    cls: "border-agree/40 bg-agree/10 text-agree-soft",
    dot: "bg-agree",
  },
  soon: {
    label: "See soon",
    cls: "border-clinical/40 bg-clinical/10 text-clinical-soft",
    dot: "bg-clinical",
  },
  urgent: {
    label: "Urgent",
    cls: "border-caution/40 bg-caution/10 text-caution-soft",
    dot: "bg-caution",
  },
  emergency: {
    label: "Emergency",
    cls: "border-danger/40 bg-danger/10 text-danger-soft",
    dot: "bg-danger",
  },
};

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const m = MAP[urgency] ?? MAP.routine;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${m.cls}`}
    >
      <span className={`h-2 w-2 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}
