import Link from "next/link";
import { ArrowRight, Check, ShieldCheck, UserCheck, FileCheck2, Lock } from "lucide-react";
import { getUser } from "@/lib/supabaseServer";
import { Logo } from "@/components/brand/Logo";
import { Reveal } from "@/components/motion/Reveal";
import { FaqAccordion } from "@/components/FaqAccordion";

export const dynamic = "force-dynamic";

const SPECIALTIES = [
  "Cardiology",
  "Neurology",
  "Dermatology",
  "Mental health",
  "Endocrinology",
  "Rheumatology",
  "Oncology",
  "Paediatrics",
  "Gastroenterology",
  "Trauma therapy",
  "Respiratory",
  "Immunology",
];

const STEPS = [
  {
    n: "01",
    title: "Tell your story",
    body: "Describe what's going on, in your own words. Add any photos, results, or letters you have.",
  },
  {
    n: "02",
    title: "We protect your privacy",
    body: "Anything that could identify you is stripped out first. What's left is a clean clinical picture, nothing more.",
  },
  {
    n: "03",
    title: "Matched to the right specialists",
    body: "Your case goes to doctors whose training actually fits it, wherever in the world they are.",
  },
  {
    n: "04",
    title: "Independent review, then a safety check",
    body: "Each doctor forms their own view first. A second pass checks for anything that could have been missed.",
  },
  {
    n: "05",
    title: "One clear, signed answer",
    body: "See what they agree on, what they don't, and what to do next, in plain English, signed by a named doctor.",
  },
];

export default async function HomePage() {
  const user = await getUser();
  const dest = user?.user_metadata?.role === "clinician" ? "/clinician" : "/dashboard";

  return (
    <div className="min-h-screen overflow-x-hidden bg-savi-cream font-sans text-savi-ink antialiased">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-savi-line/70 bg-savi-cream/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="rounded-full border border-savi-line bg-savi-paper px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-savi-muted">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link
                href={dest}
                className="rounded-full bg-savi-ink px-5 py-2.5 text-sm font-semibold text-savi-cream transition hover:bg-savi-ink/90"
              >
                My account
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden text-sm font-medium text-savi-muted transition hover:text-savi-ink sm:inline"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-savi-ink px-5 py-2.5 text-sm font-semibold text-savi-cream transition hover:bg-savi-ink/90"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-5 pt-12 sm:px-8 sm:pt-16">
          <div className="max-w-3xl">
            <span
              className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-savi-line bg-savi-paper px-3.5 py-1.5 text-sm text-savi-muted"
              style={{ animationDelay: "0ms" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-savi-accent" />
              Second opinions on your health
            </span>
            <h1
              className="animate-fade-up mt-7 font-serif text-[46px] font-semibold leading-[1.03] tracking-[-0.02em] sm:text-[76px]"
              style={{ animationDelay: "70ms" }}
            >
              A second opinion
              <br className="hidden sm:block" /> on your health, in{" "}
              <span className="text-savi-accent">24 hours</span>.
            </h1>
            <p
              className="animate-fade-up mt-7 max-w-xl text-xl leading-relaxed text-savi-muted"
              style={{ animationDelay: "140ms" }}
            >
              Not sure about a diagnosis? Tell us what&apos;s going on. Real,
              verified doctors review your case and send you one clear answer,
              usually within a day.
            </p>
            <div
              className="animate-fade-up mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
              style={{ animationDelay: "210ms" }}
            >
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-savi-accent px-8 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-savi-accent-deep"
              >
                Get your second opinion today
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="#how"
                className="inline-flex items-center justify-center rounded-full border border-savi-line bg-savi-paper px-8 py-4 text-base font-semibold text-savi-ink transition hover:border-savi-ink/20"
              >
                How it works
              </Link>
            </div>
            <p
              className="animate-fade-up mt-6 text-sm text-savi-muted"
              style={{ animationDelay: "260ms" }}
            >
              Free to start · Real, verified doctors · No referral needed
            </p>
            <div
              className="animate-fade-up mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-savi-muted"
              style={{ animationDelay: "300ms" }}
            >
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-savi-accent" />
                Anonymised before review
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-savi-accent" />
                Every doctor licence-checked
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FileCheck2 className="h-4 w-4 text-savi-accent" />
                Signed by name, not a bot
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-savi-accent" />
                Encrypted, never sold
              </span>
            </div>
          </div>
        </section>

        {/* Moving specialties marquee */}
        <section className="mt-20 border-y border-savi-line py-6 sm:mt-28">
          <p className="mx-auto mb-5 max-w-6xl px-5 text-center text-sm text-savi-muted sm:px-8">
            A specialist for whatever you&apos;re facing
          </p>
          <div className="relative overflow-hidden">
            <div className="flex w-max animate-marquee gap-3 pr-3">
              {[...SPECIALTIES, ...SPECIALTIES].map((s, i) => (
                <span
                  key={i}
                  className="whitespace-nowrap rounded-full border border-savi-line bg-savi-paper px-5 py-2 text-sm font-medium text-savi-ink/80 transition hover:border-savi-accent/40 hover:text-savi-ink"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <Reveal>
          <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-14 sm:px-8 sm:pt-20">
            <h2 className="max-w-2xl font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              Getting a second opinion used to be hard. Not anymore.
            </h2>
            <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {STEPS.map((s) => (
                <div
                  key={s.n}
                  className="rounded-2xl border border-transparent p-2 transition duration-300 hover:-translate-y-1 hover:border-savi-line hover:bg-savi-paper hover:shadow-sm"
                >
                  <div className="font-serif text-2xl text-savi-accent">{s.n}</div>
                  <h3 className="mt-3 text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-savi-muted">{s.body}</p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* Value */}
        <Reveal>
          <section className="mx-auto max-w-6xl px-5 pt-14 sm:px-8 sm:pt-20">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                  One opinion is a guess. A few is an answer.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-savi-muted">
                  Your doctor sees it one way. Another might see it differently.
                  Savi brings several of the best specialists to your case, then
                  shows you plainly where they agree and where they don&apos;t, so
                  you decide with confidence, not doubt.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  { title: "What they agree on", body: "The shared view, ranked by how certain they are." },
                  { title: "Where they differ", body: "Every honest difference of opinion, and why it matters." },
                  { title: "Signed by a real doctor", body: "A verified specialist stands behind your answer." },
                ].map((r) => (
                  <div
                    key={r.title}
                    className="flex items-start gap-4 rounded-2xl border border-savi-line bg-savi-paper p-6 transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-savi-accent-soft text-savi-accent">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <div>
                      <p className="font-semibold">{r.title}</p>
                      <p className="text-savi-muted">{r.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Reveal>

        {/* Privacy */}
        <Reveal>
          <section className="mx-auto max-w-6xl px-5 pt-14 sm:px-8 sm:pt-20">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                  Your file goes to doctors. Nowhere else.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-savi-muted">
                  A health file feels different from any other kind of file.
                  That&apos;s why we handle yours the way we&apos;d want ours
                  handled: identifying details stripped out before a single
                  doctor sees it, encrypted the whole way through, and never
                  sold, shared, or used for anything except getting you an
                  answer.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Anonymised first",
                    body: "Your name and contact details never reach a reviewing doctor. They see your medical picture, not your identity.",
                  },
                  {
                    icon: Lock,
                    title: "Encrypted, always",
                    body: "Your case is encrypted in transit and at rest, the same standard hospitals hold their own records to.",
                  },
                  {
                    icon: FileCheck2,
                    title: "Not sold, not shared",
                    body: "Your case is used for one thing: getting you an answer. We don't sell it, and it isn't handed to advertisers.",
                  },
                ].map((r) => (
                  <div
                    key={r.title}
                    className="flex items-start gap-4 rounded-2xl border border-savi-line bg-savi-paper p-6 transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-savi-accent-soft text-savi-accent">
                      <r.icon className="h-4 w-4" strokeWidth={2.25} />
                    </span>
                    <div>
                      <p className="font-semibold">{r.title}</p>
                      <p className="text-savi-muted">{r.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Reveal>

        {/* Doctor vetting */}
        <Reveal>
          <section className="mx-auto max-w-6xl px-5 pt-14 sm:px-8 sm:pt-20">
            <div className="max-w-2xl">
              <h2 className="font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Every doctor is checked. Every answer is signed.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-savi-muted">
                We don&apos;t queue you up for whichever doctor is free. Your
                case goes to specialists whose training actually fits it, and
                nothing reaches you unsigned.
              </p>
            </div>
            <div className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2">
              {[
                {
                  title: "Licence checked",
                  body: "Every doctor's registration is verified with their medical board before they can review a single case.",
                },
                {
                  title: "Matched by specialty",
                  body: "Your case is routed to doctors whose training fits what you're describing, not a general queue.",
                },
                {
                  title: "Reviewed independently",
                  body: "Each doctor forms their own view before seeing anyone else's, so agreement means something.",
                },
                {
                  title: "Signed, not anonymous",
                  body: "Every answer carries a real doctor's name, specialty, and credentials, right there with your results.",
                },
              ].map((r) => (
                <div key={r.title} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-savi-accent-soft text-savi-accent">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <div>
                    <p className="font-semibold">{r.title}</p>
                    <p className="mt-1 text-savi-muted">{r.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* FAQ */}
        <Reveal>
          <section className="mx-auto max-w-3xl px-5 pt-14 sm:px-8 sm:pt-20">
            <h2 className="text-center font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Questions people ask us
            </h2>
            <div className="mt-10">
              <FaqAccordion
                items={[
                  {
                    q: "Where does my file actually go?",
                    a: "It's anonymised first, so anything that could identify you is stripped out. What's left, your symptoms, history, and any files you attach, goes only to the doctors matched to your case. Nobody else sees it.",
                  },
                  {
                    q: "Does this replace my own doctor?",
                    a: "No. Savi gives you a second opinion to bring to your own doctor or specialist. It's another view, not a replacement for the person who knows your full history and can examine you in person.",
                  },
                  {
                    q: "What if the doctors disagree?",
                    a: "You're told plainly. We don't smooth over disagreement, you see exactly where opinions diverge and why, so you and your doctor can weigh it yourselves.",
                  },
                  {
                    q: "Is this safe to use if I'm seriously unwell?",
                    a: "No, Savi isn't an emergency service. If you're seriously unwell, call your local emergency number. Every answer we send includes clear guidance on when to seek urgent care.",
                  },
                  {
                    q: "What does it cost?",
                    a: "Getting started and your first case are free. If that ever changes, you'll know the price before you pay anything.",
                  },
                  {
                    q: "How do I know a real doctor looked at my case?",
                    a: "Every answer is signed with a real doctor's name, specialty, and credentials, right there with your results, not left anonymous.",
                  },
                ]}
              />
            </div>
          </section>
        </Reveal>

        {/* CTA band */}
        <Reveal>
          <section className="mx-auto max-w-6xl px-5 pb-16 pt-14 sm:px-8 sm:pt-20">
            <div className="rounded-[32px] bg-savi-ink px-8 py-16 text-center sm:px-16 sm:py-20">
              <h2 className="mx-auto max-w-2xl font-serif text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
                Stop wondering. Get an answer.
              </h2>
              <p className="mx-auto mt-5 max-w-md text-lg text-white/70">
                A second opinion from real doctors, usually within a day. Free to
                start.
              </p>
              <Link
                href="/signup"
                className="mt-9 inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-savi-ink transition hover:bg-white/90"
              >
                Get your second opinion today
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </section>
        </Reveal>

        <footer className="border-t border-savi-line">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 py-10 text-center sm:px-8">
            <Logo />
            <p className="max-w-lg text-sm text-savi-muted">
              Savi gives you a second opinion to discuss with your own doctor. It
              is not for emergencies. If you are seriously unwell, call your local
              emergency number.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
