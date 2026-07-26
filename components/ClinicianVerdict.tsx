import type { ClinicianReviewRecord } from "@/types";
import { IconAlert, IconCheck, IconShield } from "./ui/icons";

const DECISION: Record<
  ClinicianReviewRecord["decision"],
  { label: string; cls: string; tint: string; icon: typeof IconCheck }
> = {
  endorsed: {
    label: "Endorsed the AI assessment",
    cls: "border-agree/40 bg-agree/[0.06]",
    tint: "text-agree-soft",
    icon: IconCheck,
  },
  amended: {
    label: "Amended the AI assessment",
    cls: "border-clinical/40 bg-clinical/[0.06]",
    tint: "text-clinical-soft",
    icon: IconShield,
  },
  escalated: {
    label: "Escalated for urgent assessment",
    cls: "border-danger/40 bg-danger/[0.06]",
    tint: "text-danger-soft",
    icon: IconAlert,
  },
};

/**
 * The human verdict, the authoritative layer. When a clinician amends, their
 * diagnosis leads; the AI panel becomes supporting evidence beneath it.
 */
export function ClinicianVerdict({ review }: { review: ClinicianReviewRecord }) {
  const d = DECISION[review.decision] ?? DECISION.endorsed;
  const Icon = d.icon;
  const c = review.clinician;
  const reviewed = new Date(review.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className={`card p-6 sm:p-7 ${d.cls}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${d.tint}`} />
        <h2 className="text-sm font-semibold text-ink">Clinician verdict</h2>
      </div>

      <p className="mt-3 text-lg font-semibold text-ink">{d.label}</p>

      {review.decision === "amended" && review.amended_diagnosis && (
        <div className="mt-4">
          <span className="section-label">Clinician&apos;s diagnosis</span>
          <p className="mt-1 text-xl font-semibold text-ink">
            {review.amended_diagnosis}
          </p>
        </div>
      )}

      {review.decision === "amended" && review.amended_summary && (
        <p className="mt-3 text-[15px] leading-relaxed text-ink">
          {review.amended_summary}
        </p>
      )}

      {review.note && (
        <blockquote className="mt-4 border-l-2 border-line pl-4 text-sm italic text-ink-muted">
          {review.note}
        </blockquote>
      )}

      {/* Verified clinician identity */}
      <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-agree/40 bg-agree/10 text-xs font-bold text-agree-soft">
          {c.name
            .split(" ")
            .slice(-2)
            .map((p) => p[0])
            .join("")}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-ink">{c.name}</p>
            {c.verified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-agree-soft">
                <IconShield className="h-3 w-3" />
                verified
              </span>
            )}
          </div>
          <p className="text-xs text-ink-muted">
            {c.specialty} · {c.credentials} · {c.registration}
          </p>
          <p className="mono mt-0.5 text-[11px] text-ink-faint">
            {review.safety_confirmed ? "Safety-netting confirmed · " : ""}
            reviewed {reviewed}
          </p>
        </div>
      </div>
    </div>
  );
}
