"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CaseRecord, Review, StructureResult } from "@/types";
import { postSSE } from "@/lib/streamClient";
import { seedSlots, type ReviewSlot } from "@/components/reviewState";
import { SpecialistCard } from "@/components/SpecialistCard";
import { PentagonReviewers } from "@/components/PentagonReviewers";
import { CaseSummaryPanel } from "@/components/CaseSummaryPanel";
import { UrgentBanner } from "@/components/ui/UrgentBanner";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { Logo } from "@/components/brand/Logo";
import { IconArrowRight, IconSpinner } from "@/components/ui/icons";

function msg(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong.";
}

export default function CasePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const caseId = params.id;

  const [structured, setStructured] = useState<StructureResult | null>(null);
  const [documents, setDocuments] = useState<string[]>([]);
  const [slots, setSlots] = useState<ReviewSlot[]>(() => seedSlots());
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [synthLoading, setSynthLoading] = useState(false);
  const [synthError, setSynthError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const total = slots.length;
  const reviewedCount = slots.filter((s) => s.status === "complete").length;

  function patchSlot(id: string, patch: Partial<ReviewSlot>) {
    setSlots((prev) =>
      prev.map((s) => (s.meta.id === id ? { ...s, ...patch } : s))
    );
  }

  // Guarantee a terminal UI state: mark done and convert any slot still stuck on
  // "reviewing" into an error, so the review theatre never spins forever, even
  // if the stream closes without a "complete" frame.
  function settleReviews() {
    setDone(true);
    setSlots((prev) =>
      prev.map((s) =>
        s.status === "reviewing"
          ? { ...s, status: "error", error: "No response from this reviewer." }
          : s
      )
    );
  }

  function startReviews() {
    const controller = new AbortController();
    abortRef.current = controller;
    setStreamError(null);
    setDone(false);
    setSlots((prev) =>
      prev.map((s) => (s.status === "complete" ? s : { ...s, status: "reviewing" }))
    );
    postSSE(
      "/api/run-reviews",
      { caseId },
      (ev) => {
        const d = ev.data as any;
        switch (ev.event) {
          case "reviewing":
            patchSlot(d.specialistId, { status: "reviewing" });
            break;
          case "review":
            patchSlot((d.review as Review).specialist_id, {
              status: "complete",
              review: d.review as Review,
            });
            break;
          case "review_error":
            patchSlot(d.specialistId, { status: "error", error: d.message });
            break;
          case "complete":
            setDone(true);
            break;
          case "error":
            setStreamError(d?.message || "The review stream ended unexpectedly.");
            break;
        }
      },
      controller.signal
    )
      .catch((e) => {
        if (!controller.signal.aborted) setStreamError(msg(e));
      })
      .finally(() => {
        // Reached whether the stream completed, errored, or just closed.
        if (!controller.signal.aborted) settleReviews();
      });
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/case/${caseId}`);
        const json = (await res.json()) as {
          case?: CaseRecord;
          reviews?: Review[];
          error?: string;
        };
        if (!res.ok || !json.case) {
          throw new Error(json.error || "Case not found.");
        }
        if (cancelled) return;

        setStructured(json.case.structured_case);
        setDocuments(json.case.documents ?? []);
        const existing = json.reviews ?? [];
        if (existing.length > 0) {
          setSlots((prev) =>
            prev.map((s) => {
              const r = existing.find((e) => e.specialist_id === s.meta.id);
              return r ? { ...s, status: "complete", review: r } : s;
            })
          );
        }
        setPhase("ready");

        // Fresh case → run the five reviews. Any existing reviews (full or
        // partial) → show them and let the user synthesise, without re-running.
        if (existing.length === 0) {
          if (!startedRef.current) {
            startedRef.current = true;
            startReviews();
          }
        } else {
          setDone(true);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(msg(e));
          setPhase("error");
        }
      }
    })();
    return () => {
      cancelled = true;
      // Stop the in-flight stream on unmount; reset so a strict-mode remount
      // (or navigating back) can start a fresh run.
      abortRef.current?.abort();
      startedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  async function generateConsensus() {
    setSynthLoading(true);
    setSynthError(null);
    try {
      const res = await fetch("/api/synthesise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Could not generate consensus.");
      router.push(`/summary/${caseId}`);
    } catch (e) {
      setSynthError(msg(e));
      setSynthLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-base text-ink">
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      <header className="mb-8 flex items-center justify-between">
        <Logo />
        <Link href="/" className="btn-ghost text-xs no-print">
          New case
        </Link>
      </header>

      {phase === "loading" && (
        <div className="flex items-center gap-3 py-24 text-ink-muted">
          <IconSpinner className="h-5 w-5" />
          Loading your case…
        </div>
      )}

      {phase === "error" && (
        <div className="card mx-auto max-w-lg p-8 text-center">
          <p className="text-ink">{loadError}</p>
          <Link href="/" className="btn-primary mt-6 inline-flex">
            Start a new case
          </Link>
        </div>
      )}

      {phase === "ready" && (
        <div className="space-y-8">
          {structured && structured.urgent_flags.length > 0 && (
            <UrgentBanner
              items={structured.urgent_flags}
              title="Potential red flags detected, do not delay seeking care"
            />
          )}

          {/* Live review theatre */}
          <section className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="order-2 lg:order-1">
              <p className="section-label">Live second opinion</p>
              <h1 className="mt-2 text-2xl font-semibold leading-tight text-ink sm:text-3xl">
                Five specialists are reviewing your case
              </h1>
              <p className="mt-3 max-w-md text-sm text-ink-muted">
                Each works from the same anonymised file, independently and blind
                to the others, so agreement is real signal, and disagreement is
                worth your attention.
              </p>

              <div className="mt-6 max-w-sm">
                <div className="mb-2 flex items-center justify-between text-xs text-ink-muted">
                  <span className="mono">
                    {reviewedCount} of {total} reviewed
                  </span>
                  {!done && (
                    <span className="flex items-center gap-1.5 text-clinical-soft">
                      <IconSpinner className="h-3.5 w-3.5" /> in progress
                    </span>
                  )}
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
                  role="progressbar"
                  aria-label="Specialist review progress"
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={reviewedCount}
                >
                  <div
                    className="h-full rounded-full bg-clinical transition-[width] duration-500"
                    style={{ width: `${(reviewedCount / total) * 100}%` }}
                  />
                </div>
              </div>

              {streamError && (
                <p className="mt-4 max-w-sm rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger-soft">
                  {streamError}
                </p>
              )}

              {/* Consensus CTA */}
              {done && (
                <div className="mt-6">
                  {reviewedCount > 0 ? (
                    <>
                      <button
                        type="button"
                        onClick={generateConsensus}
                        disabled={synthLoading}
                        className="btn-primary"
                      >
                        {synthLoading ? (
                          <>
                            <IconSpinner className="h-4 w-4" />
                            Synthesising consensus…
                          </>
                        ) : (
                          <>
                            Generate consensus
                            <IconArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                      {synthError && (
                        <p className="mt-3 max-w-sm text-xs text-danger-soft">
                          {synthError}
                        </p>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={startReviews}
                      className="btn-ghost"
                    >
                      Retry reviews
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="order-1 lg:order-2">
              <PentagonReviewers slots={slots} />
            </div>
          </section>

          {/* Structured case */}
          {structured && (
            <CaseSummaryPanel structured={structured} documents={documents} />
          )}

          {/* Specialist cards */}
          <section>
            <h2 className="section-label mb-3">Independent reviews</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {slots.map((slot) => (
                <SpecialistCard key={slot.meta.id} slot={slot} />
              ))}
            </div>
          </section>

          <Disclaimer />
        </div>
      )}
    </main>
    </div>
  );
}
