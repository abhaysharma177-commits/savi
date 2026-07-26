import type {
  AnonymisedCase,
  ClinicianDecision,
  Consensus,
  RedTeam,
  Review,
  StructureResult,
  Triage,
} from "./schemas";
import type { Clinician } from "./clinicians";

/** Persisted record shapes. Pure types, safe to import from client code. */

export const CASE_STATUSES = [
  "created",
  "structuring",
  "structured",
  "reviewing",
  "reviewed",
  "synthesising",
  "awaiting_clinician",
  "clinician_reviewed",
  "error",
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

export interface CaseRecord {
  id: string;
  created_at: string;
  raw_input: string;
  structured_case: StructureResult | null;
  anonymised_case: AnonymisedCase | null;
  triage: Triage | null;
  /** Kinds of documents the patient attached, e.g. ["image", "pdf"]. */
  documents: string[];
  /** The signed-in patient who created this case (null for anonymous/demo). */
  user_id: string | null;
  status: CaseStatus;
  session_id: string | null;
}

export interface ConsensusRecord {
  id: string;
  created_at: string;
  case_id: string;
  consensus: Consensus;
  red_team: RedTeam | null;
}

export interface ClinicianReviewRecord {
  id: string;
  created_at: string;
  case_id: string;
  clinician_id: string;
  clinician: Clinician;
  decision: ClinicianDecision;
  amended_diagnosis: string;
  amended_summary: string;
  note: string;
  safety_confirmed: boolean;
}

/** One doctor's opinion on a case. Several of these are condensed by the AI. */
export interface Opinion {
  id: string;
  created_at: string;
  case_id: string;
  clinician_id: string;
  clinician: Clinician;
  diagnosis: string;
  assessment: string;
}

/** Everything needed to render a case, in one read. */
export interface CaseBundle {
  case: CaseRecord;
  reviews: Review[];
  consensus: Consensus | null;
  red_team: RedTeam | null;
  clinician_review: ClinicianReviewRecord | null;
  opinions: Opinion[];
  doctor_consensus: Consensus | null;
}

/**
 * Strip the raw, potentially-identifying patient text before a case leaves the
 * server. Clients only ever need the anonymised/structured views.
 */
export function redactCase(c: CaseRecord): CaseRecord {
  return { ...c, raw_input: "" };
}

export type { Review };
