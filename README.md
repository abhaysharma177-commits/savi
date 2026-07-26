# Second Opinion

**AI-augmented, clinician-governed second opinions. In minutes, not months.**

A patient describes their situation. AI structures and triages the case, five
specialty lenses review it independently and blind to one another, a consensus is
synthesised with disagreement flagged, and an adversarial safety agent red-teams
the conclusion. Then, the part that makes it trustworthy, a **verified clinician
reviews the AI panel and endorses, amends, or escalates it.** Nothing reaches the
patient as final until a real doctor has signed it.

AI does the speed and breadth; the clinician carries the authority.

> Clinical decision support with a human in the loop, **not** a diagnosis, and
> not a medical device. This is a working prototype.

Runs with **no API key** out of the box (a deterministic "sample mode"). See the
[pitch](./PITCH.md) for the market, moat, and business model.

---

## The case lifecycle

```
submitted → structured & anonymised → triaged & routed
          → 5 blind AI reviews → consensus → red-team safety check
          → routed to a matched verified clinician
          → clinician endorses / amends / escalates → patient gets a signed opinion
```

Every result carries clear **provenance**: "AI provisional · awaiting clinician"
until a doctor signs it, then "Clinician-verified" with their name, specialty, and
registration. When a clinician amends, their diagnosis leads and the AI panel
becomes supporting evidence beneath it.

## The agents

| Agent | Role |
|---|---|
| **Triage** | Assess urgency and route to the right human specialty. |
| **5 specialists** | GP, cardiology, endocrinology, rheumatology, neurology, independent, blind reviews. |
| **Synthesiser** | Consensus + probability distribution, with disagreement flagged. |
| **Red-team** | Argues *against* the consensus; names what could be missed. |
| **Verified clinician** | Human sign-off, the authoritative layer. |

---

## Quickstart (no API key needed)

Requires **Node 18.17+**.

```bash
npm install
npm run dev        # http://localhost:3000
```

That's it, it runs in sample mode with built-in, clinically-plausible results.
Try a prepared case on the landing page → watch the five specialists → **Generate
consensus** → open the **Clinician console** to sign it off → see the verified
summary. A "Sample mode" badge shows when no key is set.

> On Windows, if PowerShell blocks `npm` with a script-execution error, use
> `npm.cmd` instead of `npm` (e.g. `npm.cmd run dev`), or run
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once.

### Turn on the real AI (optional)

```bash
cp .env.local.example .env.local   # then set ANTHROPIC_API_KEY=sk-ant-...
```

With a key, the same pipeline calls Claude (Opus 4.8 by default) via structured
outputs; without one, it stays in sample mode. Nothing else changes.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build (also type-checks + lints) |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest, 26 unit tests (schemas, routing, store, agent pipeline) |

Verified: `npm run build` and `npm test` both pass cleanly.

---

## Architecture

```
app/
├─ page.tsx                     Landing / intake (marketplace story)
├─ case/[id]/page.tsx           Live AI review stream (SSE) + pentagon
├─ summary/[id]/page.tsx        Patient summary: provenance, timeline, verdict, AI panel
├─ clinician/page.tsx           Clinician review queue
├─ clinician/[id]/page.tsx      Clinician review console (endorse / amend / escalate)
├─ error.tsx · not-found.tsx · global-error.tsx
└─ api/  create-case · run-reviews (SSE) · synthesise · clinician-review
        · queue · case/[id] · summary/[id] · health
lib/
├─ orchestrator.ts   The agents as composable functions (triage / review / synthesise / red-team)
├─ mock.ts           Deterministic sample-mode data for all agents + 3 demo scenarios
├─ prompts.ts        Personas + every prompt (used when the real API is on)
├─ schemas.ts        Zod validators + JSON Schemas for structured outputs
├─ store.ts          Supabase or in-memory persistence (auto-selected)
├─ clinicians.ts     Verified-clinician roster + specialty routing
├─ anthropic.ts      Single, version-decoupled SDK boundary
└─ sse.ts · streamClient.ts · config.ts · records.ts · errors.ts · id.ts
tests/               Vitest suite
```

**Design principles**

- **Trust is the product.** Provenance, calibration (probability + flagged
  disagreement), an adversarial red-team pass, and mandatory human sign-off.
- **Never crash on bad model output.** Structured outputs + a plain-call fallback
  + Zod `.catch` defaults; one failing reviewer never stops the others.
- **Runs anywhere with nothing.** No key → sample mode; no Supabase → in-memory
  store. The whole flow works offline.
- **Version-decoupled SDK.** Every Claude call goes through one small boundary, so
  it compiles and runs against any SDK version.

---

## Deploy (Vercel)

```bash
npm i -g vercel && vercel
```

Set any env vars in the Vercel dashboard (none required for sample mode). The
`run-reviews` / `synthesise` routes declare `maxDuration` for plans that allow
longer executions.

---

## Production readiness & known limitations

This is a strong prototype with a production-shaped architecture. Before real
patients, the following must be added, they are deliberately scoped out of an
offline, keyless demo:

- **Authentication & authorization.** The clinician console is an open demo
  console. Production needs verified-clinician auth (SSO + credential
  verification), patient auth, and per-role access control on every endpoint. A
  lifecycle guard already ensures only an `awaiting_clinician` case can be signed
  off, and raw patient text is stripped from all read APIs, but identity is not
  yet enforced.
- **Persistent, shared storage.** The default in-memory store is per-process
  (great for a single-session demo). For a multi-user / multi-instance deploy,
  set the Supabase env vars and run [`supabase/schema.sql`](./supabase/schema.sql);
  the store switches automatically.
- **Live-mode request cancellation.** When the real API is enabled, in-flight
  model calls are not yet aborted on client disconnect (a cost consideration, not
  a correctness one). The client stream is aborted correctly.
- **Regulatory / clinical validation.** Real clinical governance, audit retention,
  and a validation study against real cases (see the pitch's traction plan).

---

## Safety

Every screen carries a decision-support disclaimer. Triage assigns urgency; red
flags and urgent actions are surfaced prominently; the consensus includes explicit
safety-netting; cases are anonymised before any reviewer sees them; and no result
is final without a verified clinician's sign-off.
