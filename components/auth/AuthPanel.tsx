"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabaseBrowser";
import { Logo } from "@/components/brand/Logo";

type Role = "patient" | "doctor";

const COPY: Record<Role, { heading: string; sub: string; points: string[] }> = {
  patient: {
    heading: "A second opinion you can trust.",
    sub: "Start your case and follow it through to a clear answer.",
    points: [
      "Real, verified doctors, not a chatbot",
      "Specialists of every kind: physical, mental, and holistic",
      "One clear answer, usually within a day",
    ],
  },
  doctor: {
    heading: "Lend your expertise. Give someone clarity.",
    sub: "Review real cases and share your view, in minutes.",
    points: [
      "Cases matched to your field",
      "Doctors, specialists, therapists and holistic practitioners welcome",
      "Your opinion, combined with others into one clear answer",
    ],
  },
};

export function AuthPanel({
  mode,
  defaultRole = "patient",
}: {
  mode: "login" | "signup";
  defaultRole?: Role;
}) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [role, setRole] = useState<Role>(defaultRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dest = role === "doctor" ? "/clinician" : "/dashboard";
  const copy = COPY[role];
  const roleMeta = role === "doctor" ? "clinician" : "patient";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      if (isSignup) {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role: roleMeta }),
        });
        const j = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok) throw new Error(j.error || "Could not create your account.");
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push(dest);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-savi-cream font-sans text-savi-ink lg:grid-cols-2">
      {/* Narrative side */}
      <div className="relative hidden flex-col justify-between border-r border-savi-line bg-savi-paper p-12 lg:flex">
        <Logo />
        <div>
          <h2 className="max-w-md font-serif text-4xl font-semibold leading-tight tracking-tight">
            {copy.heading}
          </h2>
          <ul className="mt-8 space-y-4">
            {copy.points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-savi-muted">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-savi-accent-soft text-savi-ink">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-savi-muted">
          Private and anonymised before any doctor sees it.
        </p>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>

          {/* Role switch */}
          <div className="mt-8 grid grid-cols-2 gap-1 rounded-full border border-savi-line bg-savi-paper p-1">
            {(["patient", "doctor"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={role === r}
                onClick={() => setRole(r)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  role === r ? "bg-savi-ink text-white" : "text-savi-muted hover:text-savi-ink"
                }`}
              >
                {r === "patient" ? "I need advice" : "I'm a doctor"}
              </button>
            ))}
          </div>

          <h1 className="mt-7 font-serif text-3xl font-semibold tracking-tight">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-savi-muted">{copy.sub}</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-xl border border-savi-line bg-savi-cream/50 px-3.5 py-3 text-savi-ink placeholder:text-savi-muted focus:border-savi-accent/50 focus:outline-none focus:ring-2 focus:ring-savi-accent/10"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="mt-1.5 w-full rounded-xl border border-savi-line bg-savi-cream/50 px-3.5 py-3 text-savi-ink placeholder:text-savi-muted focus:border-savi-accent/50 focus:outline-none focus:ring-2 focus:ring-savi-accent/10"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-savi-line bg-savi-accent-soft p-3 text-sm text-savi-ink">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-savi-accent px-6 py-3.5 text-base font-semibold text-white transition hover:bg-savi-accent-deep disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isSignup ? "Creating your account…" : "Signing in…"}
                </>
              ) : (
                <>
                  {isSignup ? "Create account" : "Sign in"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-savi-muted">
            {isSignup ? "Already have an account? " : "New here? "}
            <Link
              href={isSignup ? "/login" : "/signup"}
              className="font-semibold text-savi-ink underline-offset-4 hover:underline"
            >
              {isSignup ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
