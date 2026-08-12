"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export default function IntakePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const caseId = params.id;
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [phase, setPhase] = useState<"loading" | "ready">("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/intake-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caseId }),
        });
        const json = (await res.json()) as { questions?: string[] };
        if (cancelled) return;
        const qs = json.questions ?? [];
        if (qs.length === 0) {
          router.replace(`/case/${caseId}`);
          return;
        }
        setQuestions(qs);
        setPhase("ready");
      } catch {
        if (!cancelled) router.replace(`/case/${caseId}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId, router]);

  async function proceed(withAnswers: boolean) {
    setSubmitting(true);
    try {
      if (withAnswers) {
        const payload = questions.map((q, i) => ({
          question: q,
          answer: answers[i] ?? "",
        }));
        await fetch("/api/intake-answers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caseId, answers: payload }),
        }).catch(() => {});
      }
      router.push(`/case/${caseId}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-savi-cream font-sans text-savi-ink antialiased">
      <header className="border-b border-savi-line/70">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4 sm:px-8">
          <Logo href="/dashboard" />
          <button
            onClick={() => proceed(false)}
            disabled={submitting}
            className="text-sm font-medium text-savi-muted transition hover:text-savi-ink"
          >
            Skip for now
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
        {phase === "loading" && (
          <div className="flex items-center gap-3 py-24 text-savi-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            Reading what you sent…
          </div>
        )}

        {phase === "ready" && (
          <>
            <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              A few quick questions.
            </h1>
            <p className="mt-3 text-lg text-savi-muted">
              These are the things a doctor would usually want to know. Answering
              them helps you get a clearer, faster answer. Skip any you&apos;re not
              sure about.
            </p>

            <div className="mt-8 space-y-5">
              {questions.map((q, i) => (
                <div key={i}>
                  <label className="block text-[15px] font-medium">{q}</label>
                  <textarea
                    rows={2}
                    value={answers[i] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [i]: e.target.value }))
                    }
                    placeholder="Your answer (optional)"
                    className="mt-2 w-full resize-y rounded-xl border border-savi-line bg-white px-3.5 py-3 text-[15px] leading-relaxed text-savi-ink placeholder:text-savi-muted focus:border-savi-accent/50 focus:outline-none focus:ring-2 focus:ring-savi-accent/10"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => proceed(true)}
              disabled={submitting}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-savi-accent px-8 py-4 text-base font-semibold text-white transition hover:bg-savi-accent-deep disabled:opacity-60 sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Sending to the doctors…
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
            <p className="mt-3 text-sm text-savi-muted">
              You can add these now or let the doctors ask later.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
