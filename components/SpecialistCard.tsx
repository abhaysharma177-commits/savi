"use client";

import { useState } from "react";
import type { ReviewSlot } from "./reviewState";
import { CountUp } from "./motion/CountUp";
import { IconAlert, IconCheck, IconSpinner } from "./ui/icons";

export function SpecialistCard({ slot }: { slot: ReviewSlot }) {
  const { meta, status, review, error } = slot;
  const [open, setOpen] = useState(false);
  const complete = status === "complete" && !!review;

  return (
    <div
      className={`card card-hover p-5 ${complete ? "animate-fade-up" : ""} ${
        status === "reviewing" ? "border-clinical/40" : ""
      }`}
      style={complete ? { borderColor: `${meta.hue}66` } : undefined}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span
          className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-bold"
          style={{ borderColor: meta.hue, color: meta.hue }}
        >
          {meta.initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-ink">
              {meta.name}
            </h3>
            <StatusPip status={status} hue={meta.hue} />
          </div>
          <p className="truncate text-xs text-ink-muted">{meta.specialty}</p>
          <p className="mt-0.5 truncate text-[11px] italic text-ink-faint">
            {meta.tagline}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="mt-4">
        {status === "pending" && (
          <p className="text-xs text-ink-faint">Awaiting the case file…</p>
        )}

        {status === "reviewing" && (
          <div className="space-y-2">
            <div className="h-3 w-3/4 animate-pulse-soft rounded bg-surface-2" />
            <div className="h-3 w-1/2 animate-pulse-soft rounded bg-surface-2" />
            <p className="pt-1 text-xs text-clinical-soft">
              Reviewing independently…
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger-soft">
            <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error || "This reviewer could not complete."}</span>
          </div>
        )}

        {complete && review && (
          <div className="space-y-3">
            <div>
              <span className="section-label">Primary impression</span>
              <p className="mt-1 text-[15px] font-semibold leading-snug text-ink">
                {review.primary_diagnosis || "No single leading diagnosis"}
              </p>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-ink-faint">Confidence</span>
                <span className="mono text-ink-muted">
                  <CountUp value={review.confidence} suffix="%" />
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${review.confidence}%`,
                    backgroundColor: meta.hue,
                  }}
                />
              </div>
            </div>

            {review.clinical_reasoning && (
              <p className="text-xs leading-relaxed text-ink-muted">
                {review.clinical_reasoning}
              </p>
            )}

            {review.red_flags_identified.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {review.red_flags_identified.map((flag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full border border-danger/30 bg-danger/10 px-2 py-0.5 text-[11px] text-danger-soft"
                  >
                    <IconAlert className="h-3 w-3" />
                    {flag}
                  </span>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="text-xs font-medium text-clinical-soft hover:text-clinical"
            >
              {open ? "Hide detail" : "Show differentials & questions"}
            </button>

            {open && (
              <div className="space-y-3 border-t border-line pt-3">
                {review.differential_diagnoses.length > 0 && (
                  <div>
                    <span className="section-label">Differential diagnoses</span>
                    <ul className="mt-1.5 space-y-1.5">
                      {review.differential_diagnoses.map((d, i) => (
                        <li key={i} className="text-xs text-ink-muted">
                          <span className="text-ink">{d.diagnosis}</span>
                          <span className="mono ml-1 text-ink-faint">
                            · {Math.round(d.probability)}%
                          </span>
                          {d.key_feature ? (
                            <span className="block text-[11px] text-ink-faint">
                              {d.key_feature}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {review.what_others_might_miss && (
                  <div>
                    <span className="section-label">
                      What a generalist might miss
                    </span>
                    <p className="mt-1 text-xs italic text-ink-muted">
                      {review.what_others_might_miss}
                    </p>
                  </div>
                )}

                {review.recommended_investigations.length > 0 && (
                  <div>
                    <span className="section-label">Would order</span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {review.recommended_investigations.map((t, i) => (
                        <span key={i} className="chip">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {review.questions_for_patient.length > 0 && (
                  <div>
                    <span className="section-label">Would ask you</span>
                    <ul className="mt-1.5 space-y-1">
                      {review.questions_for_patient.map((q, i) => (
                        <li key={i} className="text-xs text-ink-muted">
                          “{q}”
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPip({
  status,
  hue,
}: {
  status: ReviewSlot["status"];
  hue: string;
}) {
  if (status === "complete") {
    return (
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full"
        style={{ backgroundColor: `${hue}22`, color: hue }}
      >
        <IconCheck className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (status === "reviewing") {
    return <IconSpinner className="h-4 w-4 text-clinical-soft" />;
  }
  if (status === "error") {
    return <IconAlert className="h-4 w-4 text-danger-soft" />;
  }
  return <span className="h-2 w-2 rounded-full bg-line" />;
}
