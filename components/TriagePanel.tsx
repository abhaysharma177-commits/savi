import type { Triage } from "@/types";
import { UrgencyBadge } from "./ui/UrgencyBadge";
import { IconArrowRight, IconUsers } from "./ui/icons";

export function TriagePanel({ triage }: { triage: Triage }) {
  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconUsers className="h-4 w-4 text-clinical-soft" />
          <h2 className="text-sm font-semibold text-ink">Triage & routing</h2>
        </div>
        <UrgencyBadge urgency={triage.urgency} />
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-ink-muted">Routed to</span>
        <IconArrowRight className="h-4 w-4 text-ink-faint" />
        <span className="font-semibold text-ink">
          {triage.recommended_specialty || "General Practice"}
        </span>
      </div>

      {triage.routing_rationale && (
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          {triage.routing_rationale}
        </p>
      )}

      {triage.key_risk_factors.length > 0 && (
        <div className="mt-4">
          <span className="section-label">Risk factors driving this</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {triage.key_risk_factors.map((f, i) => (
              <span key={i} className="chip">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
