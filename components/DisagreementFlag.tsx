import type { Disagreement } from "@/types";

/**
 * The signature UI element: where the specialists diverge, and why it matters.
 * A calibrated disagreement is more honest, and safer, than false certainty.
 */
export function DisagreementFlag({
  disagreement,
}: {
  disagreement: Disagreement;
}) {
  return (
    <div className="print-block rounded-r-xl border-l-4 border-caution bg-caution/[0.07] p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="mono text-[11px] font-semibold uppercase tracking-[0.18em] text-caution-soft print-keep-amber">
          Specialist disagreement
        </span>
      </div>

      <p className="mb-3 font-medium text-ink">{disagreement.point}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface-2/50 p-3">
          <span className="section-label">Majority view</span>
          <p className="mt-1.5 text-sm text-ink-muted">
            {disagreement.majority_view}
          </p>
        </div>
        <div className="rounded-lg border border-caution/30 bg-caution/[0.06] p-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-caution-soft print-keep-amber">
            Minority view
          </span>
          <p className="mt-1.5 text-sm text-ink">{disagreement.minority_view}</p>
        </div>
      </div>

      {disagreement.why_it_matters ? (
        <p className="mt-3 text-xs italic text-ink-faint">
          <span className="font-semibold not-italic text-ink-muted">
            Why it matters:{" "}
          </span>
          {disagreement.why_it_matters}
        </p>
      ) : null}
    </div>
  );
}
