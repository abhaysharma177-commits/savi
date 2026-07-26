import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, Stethoscope, CheckCircle2, ArrowRight } from "lucide-react";
import { getUser } from "@/lib/supabaseServer";
import { getStore } from "@/lib/store";
import type { CaseRecord, CaseStatus } from "@/lib/records";
import { Logo } from "@/components/brand/Logo";
import { CaseForm } from "@/components/CaseForm";
import { SignOutButton } from "@/components/auth/SignOutButton";

export const dynamic = "force-dynamic";

function statusView(status: CaseStatus): {
  label: string;
  icon: typeof Clock;
  cls: string;
  view: "case" | "summary";
  hint: string;
} {
  switch (status) {
    case "clinician_reviewed":
      return {
        label: "Answer ready",
        icon: CheckCircle2,
        cls: "bg-savi-accent-soft text-savi-accent-deep",
        view: "summary",
        hint: "A doctor has signed off. Read what they agree on and what to do next.",
      };
    case "awaiting_clinician":
      return {
        label: "With a doctor",
        icon: Stethoscope,
        cls: "bg-savi-cream border border-savi-line text-savi-muted",
        view: "summary",
        hint: "A verified specialist is reviewing and signing off on your case.",
      };
    case "error":
      return {
        label: "Needs attention",
        icon: Clock,
        cls: "bg-savi-accent-soft text-savi-accent-deep",
        view: "case",
        hint: "Something needs a second look before this can continue.",
      };
    default:
      return {
        label: "In progress",
        icon: Clock,
        cls: "bg-savi-cream border border-savi-line text-savi-muted",
        view: "case",
        hint: "Your case is anonymised and matched to the right specialists.",
      };
  }
}

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.user_metadata?.role === "clinician") redirect("/clinician");

  const name = user.email?.split("@")[0] ?? "there";
  let cases: CaseRecord[] = [];
  try {
    cases = await getStore().listCasesForUser(user.id, 20);
  } catch {
    cases = [];
  }

  return (
    <div className="min-h-screen bg-savi-cream font-sans text-savi-ink antialiased">
      <header className="sticky top-0 z-50 border-b border-savi-line/70 bg-savi-cream/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 sm:px-8">
          <Logo href="/dashboard" />
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-24 pt-12 sm:px-8">
        <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          Hi {name}.
        </h1>
        <p className="mt-3 text-lg text-savi-muted">
          Tell us what&apos;s going on, and the right doctors will take a look.
          You&apos;ll usually have a clear answer within a day.
        </p>

        {/* What happens next */}
        <section className="mt-10 rounded-2xl border border-savi-line bg-savi-paper p-5 sm:p-6">
          <p className="text-sm font-medium text-savi-muted">
            What happens after you send it
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-savi-line bg-savi-cream text-savi-muted">
                <Clock className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold">In progress</p>
                <p className="mt-0.5 text-sm text-savi-muted">
                  Anonymised, then matched to the right specialists.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-savi-line bg-savi-cream text-savi-muted">
                <Stethoscope className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold">With a doctor</p>
                <p className="mt-0.5 text-sm text-savi-muted">
                  A verified specialist reviews and signs off.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-savi-accent-soft text-savi-accent-deep">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold">Answer ready</p>
                <p className="mt-0.5 text-sm text-savi-muted">
                  See what they agree on, and what to do next.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Start a case */}
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">Start a second opinion</h2>
          <CaseForm />
        </section>

        {/* Your cases */}
        <section className="mt-14">
          <h2 className="text-xl font-semibold">Your cases</h2>
          {cases.length === 0 ? (
            <p className="mt-3 text-savi-muted">
              You haven&apos;t sent one yet. When you do, it will show up here so
              you can follow along.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {cases.map((c) => {
                const s = statusView(c.status);
                const href = s.view === "summary" ? `/summary/${c.id}` : `/case/${c.id}`;
                return (
                  <Link
                    key={c.id}
                    href={href}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-savi-line bg-savi-paper p-5 transition hover:border-savi-ink/15"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-savi-ink">
                        {c.anonymised_case?.presenting_complaint ||
                          c.raw_input?.slice(0, 70) ||
                          "New case"}
                      </p>
                      <p className="mt-1 text-sm text-savi-muted">{timeAgo(c.created_at)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        title={s.hint}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${s.cls}`}
                      >
                        <s.icon className="h-3.5 w-3.5" />
                        {s.label}
                      </span>
                      <ArrowRight className="h-4 w-4 text-savi-muted" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
