import type { RedTeam } from "@/types";
import { CountUp } from "./motion/CountUp";
import { IconAlert, IconShield } from "./ui/icons";

/**
 * The AI's own adversarial safety check, it argues against the consensus and
 * names what could be missed. Surfacing this (rather than hiding it) is the
 * point: calibrated doubt beats false certainty.
 */
export function RedTeamPanel({ redTeam }: { redTeam: RedTeam }) {
  const confidence = Math.max(0, Math.min(100, Math.round(redTeam.confidence_in_consensus)));
  return (
    <div className="card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconShield className="h-4 w-4 text-clinical-soft" />
          <h2 className="text-sm font-semibold text-ink">Red-team safety check</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span>Confidence in consensus</span>
          <span className="mono text-ink">
            <CountUp value={confidence} suffix="%" />
          </span>
        </div>
      </div>

      {redTeam.recommendation && (
        <p className="mb-4 rounded-lg border border-clinical/25 bg-clinical/[0.05] p-3 text-sm text-ink">
          {redTeam.recommendation}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {redTeam.overlooked_possibilities.length > 0 && (
          <div>
            <span className="section-label">Could be overlooked</span>
            <ul className="mt-2 space-y-1.5">
              {redTeam.overlooked_possibilities.map((o, i) => (
                <li key={i} className="flex gap-2 text-sm text-ink-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-clinical" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {redTeam.challenges.length > 0 && (
          <div>
            <span className="section-label">Challenges to the consensus</span>
            <ul className="mt-2 space-y-2.5">
              {redTeam.challenges.map((c, i) => (
                <li key={i} className="text-sm">
                  <span className="text-ink-muted line-through decoration-ink-faint/60">
                    {c.claim}
                  </span>
                  <span className="mt-0.5 block text-ink">{c.challenge}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {redTeam.safety_concerns.length > 0 && (
        <div className="mt-5 rounded-lg border border-caution/30 bg-caution/[0.06] p-3">
          <div className="mb-2 flex items-center gap-1.5 text-caution-soft">
            <IconAlert className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Safety concerns
            </span>
          </div>
          <ul className="space-y-1.5">
            {redTeam.safety_concerns.map((s, i) => (
              <li key={i} className="text-sm text-ink">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
