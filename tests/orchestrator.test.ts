import { describe, expect, it } from "vitest";
import {
  ALL_SPECIALISTS,
  redTeamReview,
  runSpecialistReview,
  structureCase,
  synthesiseConsensus,
  triageCase,
} from "@/lib/orchestrator";

// With no ANTHROPIC_API_KEY in the environment, the orchestrator runs in sample
// mode, exactly the path used for the offline demo.

const HYPO =
  "34-year-old woman, 3 months of fatigue, weight gain, feeling cold all the time, hair falling out, low mood, irregular periods.";
const COUGH =
  "Man early 50s, 3 weeks of a worsening cough, weight loss, former smoker, breathless on the stairs.";
const MIGRAINE =
  "Woman late 20s, one-sided headache twice a month with a visual aura of zigzag lines, sensitive to light and sound.";

describe("orchestrator, sample-mode pipeline", () => {
  it("structures and routes hypothyroid → endocrinology", async () => {
    const s = await structureCase(HYPO);
    expect(s.anonymised_case.presenting_complaint.length).toBeGreaterThan(0);
    const t = await triageCase(s.anonymised_case);
    expect(t.recommended_specialty).toBe("Endocrinology");
  });

  it("routes cough → respiratory medicine, urgent", async () => {
    const s = await structureCase(COUGH);
    const t = await triageCase(s.anonymised_case);
    expect(t.recommended_specialty).toBe("Respiratory Medicine");
    expect(t.urgency).toBe("urgent");
  });

  it("routes migraine → neurology", async () => {
    const s = await structureCase(MIGRAINE);
    const t = await triageCase(s.anonymised_case);
    expect(t.recommended_specialty).toBe("Neurology");
  });

  it("runs a specialist review with the correct, enforced identity", async () => {
    const s = await structureCase(HYPO);
    const first = ALL_SPECIALISTS[0];
    const r = await runSpecialistReview(first, s.anonymised_case);
    expect(r.specialist_id).toBe(first.id);
    expect(r.specialist_name).toBe(first.name);
    expect(r.confidence).toBeGreaterThanOrEqual(0);
    expect(r.confidence).toBeLessThanOrEqual(100);
  });

  it("synthesises a strong hypothyroid consensus and red-teams it", async () => {
    const s = await structureCase(HYPO);
    const reviews = await Promise.all(
      ALL_SPECIALISTS.map((sp) => runSpecialistReview(sp, s.anonymised_case))
    );
    expect(reviews).toHaveLength(5);

    const consensus = await synthesiseConsensus(s.anonymised_case, reviews);
    expect(consensus.consensus_diagnosis).toBe("Primary hypothyroidism");
    expect(consensus.agreement_level).toBe("strong");

    const rt = await redTeamReview(s.anonymised_case, reviews, consensus);
    expect(rt.confidence_in_consensus).toBeGreaterThanOrEqual(0);
    expect(rt.confidence_in_consensus).toBeLessThanOrEqual(100);
    expect(Array.isArray(rt.safety_concerns)).toBe(true);
  });
});
