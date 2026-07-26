/** Shared type surface for the app. */
export type {
  AnonymisedCase,
  StructureResult,
  SpecialistReview,
  Review,
  Consensus,
  Differential,
  Disagreement,
  ProbabilityEntry,
  CaseComplexity,
  AgreementLevel,
  Triage,
  RedTeam,
  RedTeamChallenge,
  Urgency,
  ClinicianDecision,
} from "@/lib/schemas";

export type {
  CaseRecord,
  ConsensusRecord,
  ClinicianReviewRecord,
  CaseBundle,
  CaseStatus,
} from "@/lib/records";

export type { Specialist } from "@/lib/prompts";
export type { Clinician } from "@/lib/clinicians";
