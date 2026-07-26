"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  Scale,
  ClipboardList,
  AlertTriangle,
  ShieldCheck,
  Printer,
  Plus,
  Stethoscope,
  Loader2,
} from "lucide-react";
import type {
  CaseRecord,
  ClinicianReviewRecord,
  Consensus,
  RedTeam,
  Review,
} from "@/types";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { Logo } from "@/components/brand/Logo";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function msg(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong.";
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

interface Bundle {
  case: CaseRecord;
  reviews: Review[];
  consensus: Consensus | null;
  red_team: RedTeam | null;
  clinician_review: ClinicianReviewRecord | null;
}

export default function SummaryPage({ params }: { params: { id: string } }) {
  const caseId = params.id;
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "missing" | "error">(
    "loading"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/summary/${caseId}`);
        const json = (await res.json()) as Bundle & { error?: string };
        if (!res.ok || !json.case) throw new Error(json.error || "Case not found.");
        if (cancelled) return;
        setBundle(json);
        setPhase(json.consensus ? "ready" : "missing");
      } catch (e) {
        if (!cancelled) {
          setError(msg(e));
          setPhase("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  const c = bundle?.consensus ?? null;
  const review = bundle?.clinician_review ?? null;
  const verified = Boolean(review);
  const created = bundle
    ? new Date(bundle.case.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  const amended = review?.decision === "amended" && review.amended_diagnosis.trim();
  const headline = amended
    ? review!.amended_diagnosis
    : c?.consensus_diagnosis || "Assessment";
  const topProb = c?.probability_distribution?.[0]?.probability ?? 0;
  const plain =
    (review?.amended_summary?.trim() || c?.patient_note?.trim() || c?.gp_summary?.trim()) ??
    "";
  const disagreements = c?.key_disagreements ?? [];

  return (
    <div className="min-h-screen bg-base text-foreground">
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-6">
      <header className="no-print mb-8 flex flex-wrap items-center justify-between gap-3">
        <Logo />
        <div className="flex items-center gap-2">
          {phase === "ready" && (
            <Button variant="ghost" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Save PDF
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">
              <Plus className="h-4 w-4" />
              New case
            </Link>
          </Button>
        </div>
      </header>

      {phase === "loading" && (
        <div className="flex items-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your result…
        </div>
      )}

      {phase === "error" && (
        <Card className="mx-auto max-w-lg p-8 text-center">
          <p className="text-foreground">{error}</p>
          <Button asChild className="mt-6">
            <Link href="/dashboard">Start a new case</Link>
          </Button>
        </Card>
      )}

      {phase === "missing" && (
        <Card className="mx-auto max-w-lg p-8 text-center">
          <p className="text-foreground">This case is still being reviewed.</p>
          <Button asChild className="mt-6">
            <Link href={`/case/${caseId}`}>See the review</Link>
          </Button>
        </Card>
      )}

      {phase === "ready" && bundle && c && (
        <div className="printable space-y-5">
          {/* Provenance line */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {verified ? (
              <Badge className="border-agree/40 bg-agree/10 text-agree-soft">
                <ShieldCheck className="h-3.5 w-3.5" />
                Signed by {review!.clinician.name}
              </Badge>
            ) : (
              <Badge className="border-caution/40 bg-caution/10 text-caution-soft">
                <Loader2 className="h-3.5 w-3.5" />
                With a specialist
              </Badge>
            )}
            <span className="mono text-xs text-ink-faint">
              {caseId.slice(0, 8)} · {created}
            </span>
          </div>

          {/* Urgent actions first, if any */}
          {c.urgent_actions.length > 0 && (
            <Card className="border-danger/40 bg-danger/[0.06] p-5">
              <div className="flex items-center gap-2 text-danger-soft">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-semibold">Do this soon</span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {c.urgent_actions.map((a, i) => (
                  <li key={i} className="text-sm text-foreground">
                    {a}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* The answer */}
          <Card className="p-6 sm:p-8">
            <span className="section-label">The most likely explanation</span>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {headline}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge className="border-clinical/40 bg-clinical/10 text-clinical-soft">
                {clampPct(topProb)}% confidence
              </Badge>
              {amended && (
                <Badge variant="secondary">Adjusted by the specialist</Badge>
              )}
            </div>
            {plain && (
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                {plain}
              </p>
            )}
          </Card>

          {/* Agree / Disagree */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-center gap-2 text-agree-soft">
                <Check className="h-4 w-4" />
                <h2 className="text-sm font-semibold text-foreground">
                  Where they agreed
                </h2>
              </div>
              <ul className="mt-3 space-y-2.5">
                {c.key_agreements.length > 0 ? (
                  c.key_agreements.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-agree-soft" />
                      {a}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-muted-foreground">
                    The specialists were broadly aligned.
                  </li>
                )}
              </ul>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 text-caution-soft">
                <Scale className="h-4 w-4" />
                <h2 className="text-sm font-semibold text-foreground">
                  Where they differed
                </h2>
              </div>
              {disagreements.length > 0 ? (
                <div className="mt-3 space-y-4">
                  {disagreements.map((d, i) => (
                    <div key={i}>
                      <p className="text-sm font-medium text-foreground">{d.point}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <span className="text-foreground">Most:</span> {d.majority_view}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <span className="text-foreground">One flagged:</span>{" "}
                        {d.minority_view}
                      </p>
                      {d.why_it_matters && (
                        <p className="mt-1 text-xs italic text-ink-faint">
                          {d.why_it_matters}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No major disagreement, the specialists reached a clear view.
                </p>
              )}
            </Card>
          </div>

          {/* What to do next */}
          {(c.recommended_investigations.length > 0 || c.safety_netting.length > 0) && (
            <Card className="p-5">
              <div className="flex items-center gap-2 text-clinical-soft">
                <ClipboardList className="h-4 w-4" />
                <h2 className="text-sm font-semibold text-foreground">What to do next</h2>
              </div>
              {c.gp_summary?.trim() && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {c.gp_summary}
                </p>
              )}
              {c.recommended_investigations.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-foreground">Worth asking about</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.recommended_investigations.map((t, i) => (
                      <Badge key={i} variant="secondary">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {c.safety_netting.length > 0 && (
                <div className="mt-4 rounded-lg border border-caution/25 bg-caution/[0.05] p-3">
                  <p className="text-xs font-medium text-caution-soft">
                    Get seen urgently if
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {c.safety_netting.map((s, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {/* Signed by the specialist */}
          {review && (
            <Card className="border-agree/30 bg-agree/[0.04] p-5">
              <div className="flex items-center gap-2 text-agree-soft">
                <ShieldCheck className="h-4 w-4" />
                <h2 className="text-sm font-semibold text-foreground">
                  Reviewed and signed
                </h2>
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">
                {review.clinician.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {review.clinician.specialty} · {review.clinician.credentials} ·{" "}
                {review.clinician.registration}
              </p>
              {review.note?.trim() && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {review.note}
                </p>
              )}
            </Card>
          )}

          {/* Who reviewed it */}
          {bundle.reviews.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Stethoscope className="h-4 w-4" />
                <h2 className="text-sm font-semibold text-foreground">
                  {bundle.reviews.length} specialists reviewed your case
                </h2>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {bundle.reviews.map((r) => (
                  <div
                    key={r.specialist_id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 p-3"
                  >
                    <span className="truncate text-xs text-foreground">
                      {r.specialty}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {r.primary_diagnosis}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Disclaimer />
        </div>
      )}
    </main>
    </div>
  );
}
