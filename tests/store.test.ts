import { describe, expect, it } from "vitest";
import { getStore } from "@/lib/store";
import type { Consensus, RedTeam, Review } from "@/lib/schemas";

const store = getStore();

function fakeReview(id: string, dx: string): Review {
  return {
    specialist_id: id,
    specialist_name: `Dr ${id}`,
    specialty: "General Practice",
    primary_diagnosis: dx,
    confidence: 70,
    clinical_reasoning: "…",
    differential_diagnoses: [],
    red_flags_identified: [],
    recommended_investigations: [],
    what_others_might_miss: "",
    questions_for_patient: [],
  };
}

const consensus: Consensus = {
  consensus_diagnosis: "Test dx",
  agreement_level: "strong",
  probability_distribution: [],
  key_agreements: [],
  key_disagreements: [],
  recommended_investigations: [],
  urgent_actions: [],
  gp_summary: "summary",
  patient_note: "note",
  safety_netting: [],
};

const redTeam: RedTeam = {
  confidence_in_consensus: 80,
  overlooked_possibilities: [],
  challenges: [],
  safety_concerns: [],
  recommendation: "ok",
};

describe("MemoryStore (default when no Supabase)", () => {
  it("uses the in-memory store without Supabase env", () => {
    expect(store.mode).toBe("in-memory");
  });

  it("creates, reads and updates a case", async () => {
    const c = await store.createCase({ rawInput: "test", sessionId: "s1" });
    expect(c.status).toBe("created");
    expect(c.triage).toBeNull();

    await store.updateCase(c.id, { status: "structured" });
    const got = await store.getCase(c.id);
    expect(got?.status).toBe("structured");
  });

  it("deduplicates reviews by specialist", async () => {
    const c = await store.createCase({ rawInput: "x" });
    await store.saveReview(c.id, fakeReview("gp", "A"));
    await store.saveReview(c.id, fakeReview("gp", "B"));
    const reviews = await store.getReviews(c.id);
    expect(reviews).toHaveLength(1);
    expect(reviews[0].primary_diagnosis).toBe("B");
  });

  it("stores consensus with the red-team pass and returns a bundle", async () => {
    const c = await store.createCase({ rawInput: "x" });
    await store.saveReview(c.id, fakeReview("gp", "A"));
    await store.saveConsensus(c.id, consensus, redTeam);
    const bundle = await store.getCaseBundle(c.id);
    expect(bundle?.consensus?.consensus_diagnosis).toBe("Test dx");
    expect(bundle?.red_team?.confidence_in_consensus).toBe(80);
    expect(bundle?.reviews).toHaveLength(1);
  });

  it("records a clinician review from a known clinician", async () => {
    const c = await store.createCase({ rawInput: "x" });
    const review = await store.saveClinicianReview(c.id, {
      clinician_id: "dr-mensah",
      decision: "endorsed",
      amended_diagnosis: "",
      amended_summary: "",
      note: "looks right",
      safety_confirmed: true,
    });
    expect(review.clinician.name).toContain("Mensah");
    const got = await store.getClinicianReview(c.id);
    expect(got?.decision).toBe("endorsed");
  });

  it("rejects an unknown clinician", async () => {
    const c = await store.createCase({ rawInput: "x" });
    await expect(
      store.saveClinicianReview(c.id, {
        clinician_id: "ghost",
        decision: "endorsed",
        amended_diagnosis: "",
        amended_summary: "",
        note: "",
        safety_confirmed: false,
      })
    ).rejects.toThrow();
  });

  it("lists cases awaiting a clinician", async () => {
    const c = await store.createCase({ rawInput: "queue-me" });
    await store.updateCase(c.id, { status: "awaiting_clinician" });
    const queue = await store.listCasesAwaitingClinician();
    expect(queue.some((q) => q.id === c.id)).toBe(true);
  });
});
