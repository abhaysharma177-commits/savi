"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Check,
  Scale,
  Layers,
  UserRound,
} from "lucide-react";
import type {
  CaseRecord,
  ClinicianReviewRecord,
  Consensus,
  RedTeam,
  Review,
} from "@/types";
import type { Opinion } from "@/lib/records";
import { CLINICIANS } from "@/lib/clinicians";
import { Logo } from "@/components/brand/Logo";
import { SignOutButton } from "@/components/auth/SignOutButton";

interface Bundle {
  case: CaseRecord;
  reviews: Review[];
  consensus: Consensus | null;
  red_team: RedTeam | null;
  clinician_review: ClinicianReviewRecord | null;
  opinions: Opinion[];
  doctor_consensus: Consensus | null;
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong.";
}

export default function ClinicianCasePage({ params }: { params: { id: string } }) {
  const caseId = params.id;
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const [clinicianId, setClinicianId] = useState(CLINICIANS[0].id);
  const [diagnosis, setDiagnosis] = useState("");
  const [assessment, setAssessment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/summary/${caseId}`);
      const json = (await res.json()) as Bundle & { error?: string };
      if (!res.ok || !json.case) throw new Error(json.error || "Case not found.");
      setBundle(json);
      setPhase("ready");
      return json;
    } catch (e) {
      setError(msg(e));
      setPhase("error");
      return null;
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitOpinion() {
    if (!diagnosis.trim() || !assessment.trim()) {
      setFormError("Add a diagnosis and a short assessment.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/opinion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, clinician_id: clinicianId, diagnosis, assessment }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Could not save your opinion.");
      setDiagnosis("");
      setAssessment("");
      const updated = await load();
      if (updated && updated.opinions.length >= 2) {
        await generateConsensus();
      }
    } catch (e) {
      setFormError(msg(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function generateConsensus() {
    setGenerating(true);
    setFormError(null);
    try {
      const res = await fetch("/api/doctor-consensus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Could not build the consensus.");
      await load();
    } catch (e) {
      setFormError(msg(e));
    } finally {
      setGenerating(false);
    }
  }

  const a = bundle?.case.structured_case?.anonymised_case ?? null;
  const opinions = bundle?.opinions ?? [];
  const dc = bundle?.doctor_consensus ?? null;

  return (
    <div className="min-h-screen bg-savi-cream font-sans text-savi-ink antialiased">
      <header className="sticky top-0 z-50 border-b border-savi-line/70 bg-savi-cream/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href="/clinician"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-savi-muted transition hover:text-savi-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            All cases
          </Link>
          <div className="flex items-center gap-4">
            <Logo href="/clinician" />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pb-24 pt-10 sm:px-8">
        {phase === "loading" && (
          <div className="flex items-center gap-3 py-24 text-savi-muted">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading the case…
          </div>
        )}
        {phase === "error" && (
          <div className="rounded-2xl border border-savi-line bg-savi-paper p-8 text-center">
            <p>{error}</p>
            <Link href="/clinician" className="mt-4 inline-block font-medium text-savi-accent">
              Back to all cases
            </Link>
          </div>
        )}

        {phase === "ready" && bundle && a && (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-start">
            {/* Case + opinions */}
            <div className="space-y-6">
              <div>
                <span className="text-sm font-medium text-savi-muted">The case</span>
                <h1 className="mt-1 font-serif text-3xl font-semibold leading-tight tracking-tight">
                  {a.presenting_complaint}
                </h1>
                {a.symptom_timeline && (
                  <p className="mt-3 text-savi-muted">{a.symptom_timeline}</p>
                )}
                {a.symptom_details.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {a.symptom_details.map((s, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-savi-line bg-savi-paper px-3 py-1 text-sm text-savi-ink/80"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {a.relevant_history && (
                    <div className="rounded-2xl border border-savi-line bg-savi-paper p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-savi-muted">History</p>
                      <p className="mt-1 text-sm text-savi-ink/90">{a.relevant_history}</p>
                    </div>
                  )}
                  {a.patient_demographics && (
                    <div className="rounded-2xl border border-savi-line bg-savi-paper p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-savi-muted">About</p>
                      <p className="mt-1 text-sm text-savi-ink/90">{a.patient_demographics}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor consensus */}
              {dc && (
                <div className="rounded-2xl border border-savi-trust/30 bg-savi-trust-soft p-5">
                  <div className="flex items-center gap-2 text-savi-trust">
                    <Scale className="h-4 w-4" />
                    <span className="text-sm font-semibold text-savi-ink">
                      Combined view of {opinions.length} doctors
                    </span>
                  </div>
                  <p className="mt-2 font-serif text-xl font-semibold">{dc.consensus_diagnosis}</p>
                  {dc.key_agreements.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {dc.key_agreements.map((k, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-savi-ink/80">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-savi-trust" />
                          {k}
                        </li>
                      ))}
                    </ul>
                  )}
                  {dc.key_disagreements.length > 0 && (
                    <div className="mt-3 border-t border-savi-trust/20 pt-3 text-sm text-savi-muted">
                      <span className="font-medium text-savi-ink">Where they differ: </span>
                      {dc.key_disagreements.map((d) => d.point).join("; ")}
                    </div>
                  )}
                </div>
              )}

              {/* Opinions so far */}
              <div>
                <h2 className="text-sm font-semibold">
                  Opinions so far ({opinions.length})
                </h2>
                {opinions.length === 0 ? (
                  <p className="mt-2 text-sm text-savi-muted">
                    No opinions yet. Be the first to weigh in.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {opinions.map((o) => (
                      <div key={o.id} className="rounded-2xl border border-savi-line bg-savi-paper p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold">{o.clinician.name}</span>
                          <span className="text-xs text-savi-muted">{o.clinician.specialty}</span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-savi-accent">{o.diagnosis}</p>
                        <p className="mt-1 text-sm text-savi-ink/80">{o.assessment}</p>
                      </div>
                    ))}
                  </div>
                )}
                {opinions.length >= 2 && (
                  <button
                    type="button"
                    onClick={generateConsensus}
                    disabled={generating}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-savi-ink/15 bg-savi-paper px-5 py-2.5 text-sm font-semibold text-savi-ink transition hover:border-savi-ink/30 disabled:opacity-50"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Combining opinions…
                      </>
                    ) : (
                      <>
                        <Layers className="h-4 w-4" />
                        {dc ? "Update the combined view" : "Combine into one answer"}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Add your opinion */}
            <div className="rounded-3xl border border-savi-line bg-savi-paper p-6 lg:sticky lg:top-24">
              <div className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-savi-accent" />
                <h2 className="text-lg font-semibold">Add your opinion</h2>
              </div>
              <p className="mt-1 text-sm text-savi-muted">
                Review the case and give your honest view.
              </p>

              <label className="mt-5 block text-sm font-medium">Reviewing as</label>
              <select
                value={clinicianId}
                onChange={(e) => setClinicianId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-savi-line bg-savi-cream/50 px-3 py-2.5 text-sm text-savi-ink focus:border-savi-accent/50 focus:outline-none"
              >
                {CLINICIANS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.specialty}
                  </option>
                ))}
              </select>

              <label className="mt-4 block text-sm font-medium">Your diagnosis</label>
              <input
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Primary hypothyroidism"
                className="mt-1.5 w-full rounded-xl border border-savi-line bg-savi-cream/50 px-3 py-2.5 text-sm text-savi-ink placeholder:text-savi-muted focus:border-savi-accent/50 focus:outline-none"
              />

              <label className="mt-4 block text-sm font-medium">Your assessment</label>
              <textarea
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                rows={5}
                placeholder="What you see, and what you'd do next."
                className="mt-1.5 w-full resize-y rounded-xl border border-savi-line bg-savi-cream/50 px-3 py-2.5 text-sm leading-relaxed text-savi-ink placeholder:text-savi-muted focus:border-savi-accent/50 focus:outline-none"
              />

              {formError && (
                <p className="mt-3 rounded-lg border border-savi-line bg-savi-accent-soft p-2.5 text-sm text-savi-ink">
                  {formError}
                </p>
              )}

              <button
                type="button"
                onClick={submitOpinion}
                disabled={submitting}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-savi-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-savi-accent-deep disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  "Submit my opinion"
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
