import type { Consensus } from "@/types";
import { AgreementBadge } from "./ui/AgreementBadge";
import { DisagreementFlag } from "./DisagreementFlag";
import { ProbabilityBar } from "./ui/ProbabilityBar";
import { UrgentBanner } from "./ui/UrgentBanner";
import { IconCheck, IconDocument, IconPulse } from "./ui/icons";

export function ConsensusPanel({
  consensus,
  specialistCount,
}: {
  consensus: Consensus;
  specialistCount: number;
}) {
  const distribution = [...consensus.probability_distribution].sort(
    (a, b) => b.probability - a.probability
  );

  return (
    <div className="space-y-6">
      {/* Headline diagnosis */}
      <div className="card p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="section-label">Consensus impression</span>
          <AgreementBadge level={consensus.agreement_level} />
        </div>
        <h1 className="mt-3 text-2xl font-semibold leading-tight text-ink sm:text-3xl">
          {consensus.consensus_diagnosis || "No clear consensus"}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Synthesised from {specialistCount} independent specialist review
          {specialistCount === 1 ? "" : "s"}, each produced blind to the others.
        </p>
      </div>

      {/* Urgent actions */}
      <UrgentBanner items={consensus.urgent_actions} />

      {/* Probability distribution */}
      {distribution.length > 0 && (
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <IconPulse className="h-4 w-4 text-clinical-soft" />
            <h2 className="text-sm font-semibold text-ink">
              Diagnostic probability
            </h2>
          </div>
          <div className="space-y-4">
            {distribution.map((d, i) => (
              <ProbabilityBar
                key={i}
                rank={i}
                label={d.diagnosis}
                percent={d.probability}
                agreeing={d.specialists_agreeing}
                total={specialistCount}
              />
            ))}
          </div>
        </div>
      )}

      {/* Agreements + disagreements */}
      <div className="grid gap-6 lg:grid-cols-2">
        {consensus.key_agreements.length > 0 && (
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2">
              <IconCheck className="h-4 w-4 text-agree-soft" />
              <h2 className="text-sm font-semibold text-ink">
                Where they agreed
              </h2>
            </div>
            <ul className="space-y-2.5">
              {consensus.key_agreements.map((a, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-ink-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-agree" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {consensus.key_disagreements.length > 0 && (
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-ink">
                Where they diverged
              </h2>
            </div>
            <div className="space-y-4">
              {consensus.key_disagreements.map((d, i) => (
                <DisagreementFlag key={i} disagreement={d} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* GP summary, the printable handout */}
      {consensus.gp_summary && (
        <div className="card border-clinical/30 bg-clinical/[0.05] p-6 sm:p-7">
          <div className="mb-3 flex items-center gap-2">
            <IconDocument className="h-4 w-4 text-clinical-soft print-keep-blue" />
            <h2 className="text-sm font-semibold text-ink print-keep-blue">
              For your GP
            </h2>
          </div>
          <p className="text-[15px] leading-relaxed text-ink">
            {consensus.gp_summary}
          </p>

          {consensus.patient_note && (
            <blockquote className="mt-5 border-l-2 border-clinical/50 pl-4 text-sm italic text-ink-muted">
              “{consensus.patient_note}”
              <span className="mt-1 block text-[11px] not-italic text-ink-faint">
                What to say when you walk in
              </span>
            </blockquote>
          )}
        </div>
      )}

      {/* Recommended investigations */}
      {consensus.recommended_investigations.length > 0 && (
        <div className="card p-6">
          <h2 className="mb-3 text-sm font-semibold text-ink">
            Investigations recommended by multiple specialists
          </h2>
          <div className="flex flex-wrap gap-2">
            {consensus.recommended_investigations.map((t, i) => (
              <span key={i} className="chip">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Safety netting */}
      {consensus.safety_netting.length > 0 && (
        <div className="rounded-2xl border border-caution/30 bg-caution/[0.06] p-6">
          <h2 className="mb-3 text-sm font-semibold text-caution-soft print-keep-amber">
            Seek urgent care if you develop
          </h2>
          <ul className="space-y-2">
            {consensus.safety_netting.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-ink">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-caution" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
