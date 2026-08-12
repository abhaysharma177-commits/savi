"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Check,
  ClipboardList,
  Scale,
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
import { createClient } from "@/lib/supabaseBrowser";
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

type Stance = "agree" | "refine" | "disagree";

function msg(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong.";
}

const STANCE_LABEL: Record<Stance, string> = {
  agree: "I agree with Savi's assessment",
  refine: "I broadly agree, with refinements",
  disagree: "I disagree with Savi's assessment",
};

export default function ClinicianCasePage({ params }: { params: { id: string } }) {
  const caseId = params.id;
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  // The signed-in doctor reviews as themselves.
  const [doctor, setDoctor] = useState<{ id: string; name: string; specialty: string } | null>(null);

  const [stance, setStance] = useState<Stance | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [assessment, setAssessment] = useState("");
  const [requested, setRequested] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const aiTriedRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/summary/${caseId}`);
      const json = (await res.json()) as Bundle & { error?: string };
      if (!res.ok || !json.case) throw new Error(json.error || "Case not found.");
      setBundle(json);
      setPhase("ready");
    } catch (e) {
      setError(msg(e));
      setPhase("error");
    }
  }, [caseId]);

  // If a case has no AI read yet, run the panel so the doctor always sees one.
  const generateAiRead = useCallback(async () => {
    setAiGenerating(true);
    try {
      const r = await fetch("/api/run-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId }),
      });
      await r.text(); // drain the stream so the reviews finish
      await fetch("/api/synthesise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId }),
      });
      await load();
    } catch {
      /* leave the fallback message in place */
    } finally {
      setAiGenerating(false);
    }
  }, [caseId, load]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (bundle && !bundle.consensus && !aiTriedRef.current) {
      aiTriedRef.current = true;
      void generateAiRead();
    }
  }, [bundle, generateAiRead]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await createClient().auth.getUser();
        const u = data.user;
        if (!u) return;
        const meta = (u.user_metadata ?? {}) as { name?: string; specialty?: string };
        const fallbackName = u.email ? u.email.split("@")[0] : "You";
        setDoctor({
          id: u.id,
          name: meta.name?.trim() || fallbackName,
          specialty: meta.specialty?.trim() || "Specialist",
        });
      } catch {
        /* identity is best-effort; the review still works */
      }
    })();
  }, []);

  async function submitReview() {
    if (!diagnosis.trim() || !assessment.trim()) {
      setFormError("Add your diagnosis and a short assessment.");
      return;
    }
    if (!stance) {
      setFormError("Say whether you agree with Savi's assessment.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const composed = [
        STANCE_LABEL[stance] + ".",
        assessment.trim(),
        requested.trim() ? `Requested from the patient: ${requested.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      const res = await fetch("/api/opinion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          clinician_id: doctor?.id || "doctor",
          clinician: doctor
            ? { name: doctor.name, specialty: doctor.specialty }
            : undefined,
          diagnosis: diagnosis.trim(),
          assessment: composed,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Could not save your review.");

      // Once two or more doctors have weighed in, combine them automatically.
      const willHave = (bundle?.opinions.length ?? 0) + 1;
      if (willHave >= 2) {
        await fetch("/api/doctor-consensus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caseId }),
        }).catch(() => {});
      }

      setStance(null);
      setDiagnosis("");
      setAssessment("");
      setRequested("");
      setSubmitted(true);
      await load();
    } catch (e) {
      setFormError(msg(e));
    } finally {
      setSubmitting(false);
    }
  }

  const a = bundle?.case.structured_case?.anonymised_case ?? null;
  const ai = bundle?.consensus ?? null;
  const opinions = bundle?.opinions ?? [];
  const dc = bundle?.doctor_consensus ?? null;

  return (
    <div className="min-h-screen bg-savi-cream font-sans text-savi-ink antialiased">
      <header className="sticky top-0 z-50 border-b border-savi-line/70 bg-savi-cream/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
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

      <main className="mx-auto max-w-5xl px-5 pb-24 pt-10 sm:px-8">
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
          <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
            {/* Case + AI read + other opinions */}
            <div className="space-y-6">
              {/* The case */}
              <div>
                <span className="text-sm font-medium text-savi-muted">The case</span>
                <h1 className="mt-1 font-serif text-3xl font-semibold leading-tight tracking-tight">
                  {a.presenting_complaint}
                </h1>
                {a.symptom_timeline && (
                  <p className="mt-3 text-savi-muted">{a.symptom_timeline}</p>
                )}

                {bundle.case.raw_input?.trim() && (
                  <div className="mt-4 rounded-2xl border-l-2 border-savi-ink/25 bg-white px-4 py-3.5 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-savi-muted">
                      In the patient&apos;s own words
                    </p>
                    <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-savi-ink/90">
                      {bundle.case.raw_input}
                    </p>
                  </div>
                )}

                {a.symptom_details.length > 0 && (
                  <p className="mt-5 text-xs font-medium uppercase tracking-wide text-savi-muted">
                    Structured summary
                  </p>
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

                {a.intake_answers && a.intake_answers.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-savi-muted">
                      Follow-up questions
                    </p>
                    <div className="mt-2 space-y-2.5">
                      {a.intake_answers.map((qa, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-savi-line bg-white p-3"
                        >
                          <p className="text-sm font-medium text-savi-ink">{qa.question}</p>
                          <p className="mt-1 text-sm text-savi-ink/80">{qa.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Savi's AI read — shown first, framed as provisional */}
              <div className="rounded-2xl border border-savi-line bg-savi-paper p-5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Savi&apos;s first-pass read</span>
                  <span className="ml-auto rounded-full bg-savi-accent-soft px-2.5 py-0.5 text-xs font-medium text-savi-muted">
                    AI · provisional
                  </span>
                </div>
                {ai ? (
                  <>
                    <p className="mt-3 text-sm text-savi-muted">
                      Savi&apos;s panel thinks the most likely explanation is
                    </p>
                    <p className="mt-1 font-serif text-xl font-semibold">
                      {ai.consensus_diagnosis}
                    </p>
                    {ai.key_agreements?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-savi-muted">Why</p>
                        <ul className="mt-1.5 space-y-1.5">
                          {ai.key_agreements.slice(0, 3).map((k, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-savi-ink/80">
                              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-savi-trust" />
                              {k}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {ai.recommended_investigations?.length > 0 && (
                      <div className="mt-3 border-t border-savi-line pt-3">
                        <p className="flex items-center gap-1.5 text-xs font-medium text-savi-muted">
                          <ClipboardList className="h-3.5 w-3.5" /> Savi suggests checking
                        </p>
                        <p className="mt-1 text-sm text-savi-ink/80">
                          {ai.recommended_investigations.slice(0, 4).join(" · ")}
                        </p>
                      </div>
                    )}
                    <p className="mt-3 text-xs text-savi-muted">
                      A starting point, not a verdict. Your review is what counts.
                    </p>
                  </>
                ) : aiGenerating ? (
                  <div className="mt-3 flex items-center gap-2 text-sm text-savi-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Savi is reading the case…
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-savi-muted">
                    Savi&apos;s read isn&apos;t ready. Review from the patient&apos;s
                    words above.
                  </p>
                )}
              </div>

              {/* Combined doctor view */}
              {dc && opinions.length >= 2 && (
                <div className="rounded-2xl border border-savi-trust/30 bg-savi-trust-soft p-5">
                  <div className="flex items-center gap-2 text-savi-trust">
                    <Scale className="h-4 w-4" />
                    <span className="text-sm font-semibold text-savi-ink">
                      Combined view of {opinions.length} doctors
                    </span>
                  </div>
                  <p className="mt-2 font-serif text-lg font-semibold">{dc.consensus_diagnosis}</p>
                  {dc.key_disagreements?.length > 0 && (
                    <p className="mt-2 text-sm text-savi-muted">
                      <span className="font-medium text-savi-ink">Where they differ: </span>
                      {dc.key_disagreements.map((d) => d.point).join("; ")}
                    </p>
                  )}
                </div>
              )}

              {/* Doctors so far */}
              <div>
                <h2 className="text-sm font-semibold">
                  Doctor reviews so far ({opinions.length})
                </h2>
                {opinions.length === 0 ? (
                  <p className="mt-2 text-sm text-savi-muted">
                    No doctor has reviewed this yet. Yours will be the first.
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
                        <p className="mt-1 whitespace-pre-line text-sm text-savi-ink/80">{o.assessment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Your specialist review */}
            <div className="rounded-3xl border border-savi-line bg-savi-paper p-6 lg:sticky lg:top-24">
              <div className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-savi-accent" />
                <h2 className="text-lg font-semibold">Your review</h2>
              </div>
              <p className="mt-1 text-sm text-savi-muted">
                Reviewing as{" "}
                <span className="font-medium text-savi-ink">{doctor?.name ?? "you"}</span>
                {doctor?.specialty ? ` · ${doctor.specialty}` : ""}
              </p>

              {submitted && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-savi-trust/30 bg-savi-trust-soft p-3 text-sm text-savi-ink">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-savi-trust" />
                  Your review is in. Add another perspective or head back to the queue.
                </div>
              )}

              <label className="mt-5 block text-sm font-medium">
                Do you agree with Savi&apos;s read?
              </label>
              <div className="mt-2 grid gap-1.5">
                {(["agree", "refine", "disagree"] as Stance[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStance(s)}
                    className={`rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition ${
                      stance === s
                        ? "border-savi-ink bg-savi-ink text-white"
                        : "border-savi-line bg-savi-cream/40 text-savi-ink hover:border-savi-ink/25"
                    }`}
                  >
                    {STANCE_LABEL[s]}
                  </button>
                ))}
              </div>

              <label className="mt-4 block text-sm font-medium">Your diagnosis</label>
              <input
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Primary hypothyroidism"
                className="mt-1.5 w-full rounded-xl border border-savi-line bg-savi-cream/40 px-3 py-2.5 text-sm text-savi-ink placeholder:text-savi-muted focus:border-savi-accent/50 focus:outline-none"
              />

              <label className="mt-4 block text-sm font-medium">Your assessment</label>
              <textarea
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                rows={5}
                placeholder="What you see, your reasoning, and what you'd do next."
                className="mt-1.5 w-full resize-y rounded-xl border border-savi-line bg-savi-cream/40 px-3 py-2.5 text-sm leading-relaxed text-savi-ink placeholder:text-savi-muted focus:border-savi-accent/50 focus:outline-none"
              />

              <label className="mt-4 block text-sm font-medium">
                Request more from the patient{" "}
                <span className="font-normal text-savi-muted">(optional)</span>
              </label>
              <input
                value={requested}
                onChange={(e) => setRequested(e.target.value)}
                placeholder="e.g. a recent TSH result, or a photo of the rash"
                className="mt-1.5 w-full rounded-xl border border-savi-line bg-savi-cream/40 px-3 py-2.5 text-sm text-savi-ink placeholder:text-savi-muted focus:border-savi-accent/50 focus:outline-none"
              />

              {formError && (
                <p className="mt-3 rounded-lg border border-savi-line bg-savi-accent-soft p-2.5 text-sm text-savi-ink">
                  {formError}
                </p>
              )}

              <button
                type="button"
                onClick={submitReview}
                disabled={submitting}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-savi-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-savi-accent-deep disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  "Submit my review"
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
