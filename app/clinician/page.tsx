"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, Stethoscope } from "lucide-react";
import type { CaseRecord } from "@/types";
import { Logo } from "@/components/brand/Logo";
import { SignOutButton } from "@/components/auth/SignOutButton";

function msg(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong.";
}

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

const URGENCY: Record<string, string> = {
  emergency: "bg-savi-accent text-white",
  urgent: "bg-savi-accent-soft text-savi-ink",
  soon: "bg-savi-cream border border-savi-line text-savi-muted",
  routine: "bg-savi-cream border border-savi-line text-savi-muted",
};

export default function ClinicianQueuePage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/queue");
        const json = (await res.json()) as { cases?: CaseRecord[]; error?: string };
        if (!res.ok) throw new Error(json.error || "Could not load cases.");
        if (cancelled) return;
        setCases(json.cases ?? []);
        setPhase("ready");
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
  }, []);

  return (
    <div className="min-h-screen bg-savi-cream font-sans text-savi-ink antialiased">
      <header className="sticky top-0 z-50 border-b border-savi-line/70 bg-savi-cream/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-8">
          <Logo href="/clinician" />
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pb-24 pt-12 sm:px-8">
        <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          Cases to review
        </h1>
        <p className="mt-3 text-lg text-savi-muted">
          Real people waiting for a second opinion. Pick one that fits your field,
          read it, and give your honest view.
        </p>

        {/* How it works for doctors (Delphi) */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            {
              n: "1",
              t: "Pick a case",
              d: "Choose one matched to your specialty from the live pool below.",
            },
            {
              n: "2",
              t: "Review independently",
              d: "Give your own view first, blind to what other doctors said.",
            },
            {
              n: "3",
              t: "Savi combines views",
              d: "Your opinion joins others into one clear answer for the patient.",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-savi-line bg-savi-paper p-4"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-savi-accent-soft font-serif text-sm font-semibold text-savi-accent">
                {s.n}
              </span>
              <p className="mt-2.5 font-semibold">{s.t}</p>
              <p className="mt-1 text-sm text-savi-muted">{s.d}</p>
            </div>
          ))}
        </div>

        {phase === "loading" && (
          <div className="flex items-center gap-3 py-20 text-savi-muted">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading cases…
          </div>
        )}
        {phase === "error" && (
          <div className="mt-8 rounded-2xl border border-savi-line bg-savi-paper p-6 text-savi-muted">
            {error}
          </div>
        )}
        {phase === "ready" && cases.length === 0 && (
          <div className="mt-8 rounded-2xl border border-savi-line bg-savi-paper p-10 text-center">
            <Stethoscope className="mx-auto h-6 w-6 text-savi-muted" />
            <p className="mt-3 font-medium">No cases waiting right now.</p>
            <p className="mt-1 text-sm text-savi-muted">
              New cases show up here the moment a patient sends one.
            </p>
          </div>
        )}
        {phase === "ready" && cases.length > 0 && (
          <div className="mt-8 space-y-3">
            {cases.map((c) => {
              const u = c.triage?.urgency ?? "routine";
              return (
                <Link
                  key={c.id}
                  href={`/clinician/${c.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-savi-line bg-savi-paper p-5 transition hover:border-savi-ink/15"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${URGENCY[u] ?? URGENCY.routine}`}>
                        {u}
                      </span>
                      {c.triage?.recommended_specialty && (
                        <span className="text-xs text-savi-muted">
                          {c.triage.recommended_specialty}
                        </span>
                      )}
                      <span className="text-xs text-savi-muted">· {timeAgo(c.created_at)}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 font-medium text-savi-ink">
                      {c.anonymised_case?.presenting_complaint || "New case"}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-savi-accent px-4 py-2 text-sm font-semibold text-white">
                    Review
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
