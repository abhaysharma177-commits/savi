import { describe, expect, it } from "vitest";
import { CLINICIANS, getClinician, matchClinician } from "@/lib/clinicians";

describe("clinician routing", () => {
  it("matches an exact specialty", () => {
    expect(matchClinician("Endocrinology").id).toBe("dr-lindqvist");
    expect(matchClinician("Respiratory Medicine").id).toBe("dr-arya");
    expect(matchClinician("Neurology").id).toBe("dr-okonkwo");
  });

  it("is case-insensitive", () => {
    expect(matchClinician("endocrinology").id).toBe("dr-lindqvist");
  });

  it("falls back to the GP for an unknown specialty", () => {
    expect(matchClinician("Dermatology").id).toBe(CLINICIANS[0].id);
    expect(matchClinician("").id).toBe(CLINICIANS[0].id);
  });

  it("looks up by id", () => {
    expect(getClinician("dr-arya")?.specialty).toBe("Respiratory Medicine");
    expect(getClinician("nope")).toBeUndefined();
  });

  it("every clinician is verified with a registration", () => {
    for (const c of CLINICIANS) {
      expect(c.verified).toBe(true);
      expect(c.registration.length).toBeGreaterThan(0);
    }
  });
});
