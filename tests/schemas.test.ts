import { describe, expect, it } from "vitest";
import {
  ConsensusSchema,
  RedTeamSchema,
  SpecialistReviewSchema,
  StructureResultSchema,
  TriageSchema,
  clampPercent,
} from "@/lib/schemas";

describe("schema resilience", () => {
  it("fills defaults for an empty structure payload", () => {
    const r = StructureResultSchema.parse({});
    expect(r.case_complexity).toBe("medium");
    expect(r.anonymised_case.presenting_complaint).toBe("");
    expect(r.urgent_flags).toEqual([]);
  });

  it("coerces a stringified confidence into a number", () => {
    const r = SpecialistReviewSchema.parse({ confidence: "80" });
    expect(r.confidence).toBe(80);
  });

  it("defaults a malformed review confidence to 0", () => {
    const r = SpecialistReviewSchema.parse({ confidence: {} });
    expect(r.confidence).toBe(0);
    expect(Array.isArray(r.differential_diagnoses)).toBe(true);
  });

  it("defaults consensus agreement level to none", () => {
    const r = ConsensusSchema.parse({});
    expect(r.agreement_level).toBe("none");
    expect(r.probability_distribution).toEqual([]);
  });

  it("defaults triage urgency to routine", () => {
    expect(TriageSchema.parse({}).urgency).toBe("routine");
  });

  it("coerces red-team confidence", () => {
    expect(RedTeamSchema.parse({ confidence_in_consensus: "50" }).confidence_in_consensus).toBe(50);
  });
});

describe("clampPercent", () => {
  it("clamps above and below range", () => {
    expect(clampPercent(120)).toBe(100);
    expect(clampPercent(-5)).toBe(0);
  });
  it("rounds", () => {
    expect(clampPercent(50.6)).toBe(51);
  });
  it("handles non-finite", () => {
    expect(clampPercent(NaN)).toBe(0);
    expect(clampPercent(Infinity)).toBe(0);
  });
});
