# Second Opinion, pitch

**AI-augmented, clinician-governed second opinions. In minutes, not months.**

---

## The problem

Diagnostic error is the single largest source of preventable harm in medicine , 
implicated in an estimated **~795,000 serious harms a year in the US alone**, more
than medication or surgical error. The proven antidote already exists: a second
opinion changes the diagnosis or treatment plan in a large share of complex
cases. But today a second opinion means **one** expert, reached **slowly**
(typically 2 to 4 weeks) and **expensively** (£200 to £400 out of pocket). So the vast
majority of patients never get one, and clinicians rarely get a fast, structured
sanity check either.

## The insight

A second opinion shouldn't be a rare, artisanal event. It should be a **process**:
several independent expert lenses, a deliberate search for where they *disagree*,
and a human specialist who owns the final call. AI can do the expensive,
time-consuming part in seconds. A doctor does the part that requires a license and
accountability. **AI for speed and breadth; the clinician for authority and trust.**

## The product

A patient (or referring GP) describes a case. Then:

1. **Structure & anonymise**, the case is de-identified and turned into a clean clinical file.
2. **Triage & route**, urgency is assessed and the case is routed to the right human specialty.
3. **Five blind AI reviews**, five specialty lenses give independent opinions, blind to one another, so agreement is real signal.
4. **Consensus**, a probability distribution across diagnoses, with disagreement *flagged*, not hidden.
5. **Red-team**, a safety agent argues against the consensus and names what could be missed.
6. **Clinician sign-off**, a verified specialist endorses, amends, or escalates. Nothing is final until a doctor signs it.

The patient receives a doctor-validated summary with clear provenance, a
plain-English hand-out for their GP, and explicit safety-netting. Every step is
transparent and auditable.

## Why now

- Frontier models are finally good enough at structured clinical reasoning to be a credible *first pass*, not a replacement, a force-multiplier.
- Regulators have a clear lane for **clinical decision support** with a human in the loop; our architecture is built for it (the AI never issues a diagnosis unsupervised).
- Clinician time is the scarcest resource in every health system on earth. We turn a 30-minute review into a 5-minute verification of a pre-structured, pre-analysed case.

## The moat

- **Data that compounds.** Every case yields *disagreement-labelled* diagnostic data, where models and specialists diverge, and how a human adjudicated it. Nobody else is generating this. It gets more valuable with volume and directly improves routing, calibration, and safety.
- **The verified-clinician network.** A two-sided marketplace: patient demand on one side, credentialed specialists on the other. Classic Zocdoc-style sequencing, nail the demand side first (the AI works at zero marginal supply), then the network becomes the durable asset.
- **Trust as a product surface.** Provenance, calibration, red-teaming, and audit trails are hard to retrofit and are exactly what regulators, insurers, and health systems buy.

## Business model

- **B2C**, pay-per-opinion, far below the £300 status quo, or subscription for chronic/complex patients.
- **B2B2C**, insurers and employers (reduce mis-diagnosis cost and unnecessary referrals), and health systems (triage + specialist-time leverage).
- **Clinician marketplace take-rate** on human reviews.

## Traction plan

1. Ship the AI layer (done, this prototype) at zero supply cost.
2. Onboard a small panel of verified specialists for the first 100 real cases.
3. Measure: change-in-management rate, clinician time saved, calibration of the AI vs. human verdict.
4. Use disagreement data to sharpen routing and safety; expand specialties.

## The ask

Clinical partners to validate the first 100 real cases, and a YC interview to
turn a working product into a company.

---

## Likely judge / investor questions

**Isn't this a regulated medical device?** It's decision support with a mandatory
human in the loop, the same framing as cleared CDS tools. The AI never issues an
unsupervised diagnosis; a verified clinician signs every result.

**What if the AI is wrong?** We *surface* uncertainty instead of hiding it, a
probability distribution, flagged disagreement, an adversarial red-team pass, and
a doctor who can override. A calibrated system that shows where experts diverge is
safer than one confident wrong opinion.

**How is this different from one expensive expert opinion?** Five independent
lenses at once, a safety agent arguing against them, and a clinician who signs
off, in minutes, at a fraction of the cost.

**How do you get doctors on the platform?** The AI works at zero supply, so we can
build patient demand first; specialists follow the demand (and the time leverage).
Same sequencing that worked for Zocdoc.

**Where's the defensibility?** Disagreement-labelled diagnostic data no one else
has, a verified-clinician network, and a trust/provenance layer that compounds.
