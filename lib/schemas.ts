import { z } from "zod";

/**
 * The data contract for the whole pipeline.
 *
 * Each Claude stage returns JSON.  We ask the API for it two ways:
 *   1. Structured Outputs (`output_config.format`) using the JSON Schemas below , 
 *      guarantees valid, shaped JSON on supporting models.
 *   2. A resilient parse + Zod validation as a safety net, so a malformed field
 *      never crashes a request, it degrades to a sensible default instead.
 *
 * Zod fields use `.catch(default)` deliberately: robustness over rigidity.  A
 * single bad field yields a default, not a 500.
 */

/* ─────────────────────────── enums ─────────────────────────── */

export const CASE_COMPLEXITY = ["low", "medium", "high"] as const;
export const AGREEMENT_LEVEL = ["strong", "moderate", "weak", "none"] as const;
export const URGENCY = ["routine", "soon", "urgent", "emergency"] as const;
export const CLINICIAN_DECISION = ["endorsed", "amended", "escalated"] as const;

export type CaseComplexity = (typeof CASE_COMPLEXITY)[number];
export type AgreementLevel = (typeof AGREEMENT_LEVEL)[number];
export type Urgency = (typeof URGENCY)[number];
export type ClinicianDecision = (typeof CLINICIAN_DECISION)[number];

/* ─────────────────── stage 1: anonymise + structure ─────────────────── */

export const AnonymisedCaseSchema = z.object({
  presenting_complaint: z.string().catch(""),
  symptom_timeline: z.string().catch(""),
  symptom_details: z.array(z.string()).catch([]),
  relevant_history: z.string().catch(""),
  lifestyle_context: z.string().catch(""),
  patient_demographics: z.string().catch(""),
});
export type AnonymisedCase = z.infer<typeof AnonymisedCaseSchema>;

const EMPTY_ANONYMISED: AnonymisedCase = {
  presenting_complaint: "",
  symptom_timeline: "",
  symptom_details: [],
  relevant_history: "",
  lifestyle_context: "",
  patient_demographics: "",
};

export const StructureResultSchema = z.object({
  anonymised_case: AnonymisedCaseSchema.catch(EMPTY_ANONYMISED),
  removed_identifiers: z.array(z.string()).catch([]),
  case_complexity: z.enum(CASE_COMPLEXITY).catch("medium"),
  urgent_flags: z.array(z.string()).catch([]),
});
export type StructureResult = z.infer<typeof StructureResultSchema>;

/* ─────────────────────── stage 2: specialist review ─────────────────────── */

export const DifferentialSchema = z.object({
  diagnosis: z.string().catch(""),
  probability: z.coerce.number().catch(0),
  key_feature: z.string().catch(""),
});
export type Differential = z.infer<typeof DifferentialSchema>;

export const SpecialistReviewSchema = z.object({
  specialist_name: z.string().catch(""),
  specialty: z.string().catch(""),
  primary_diagnosis: z.string().catch(""),
  confidence: z.coerce.number().catch(0),
  clinical_reasoning: z.string().catch(""),
  differential_diagnoses: z.array(DifferentialSchema).catch([]),
  red_flags_identified: z.array(z.string()).catch([]),
  recommended_investigations: z.array(z.string()).catch([]),
  what_others_might_miss: z.string().catch(""),
  questions_for_patient: z.array(z.string()).catch([]),
});
export type SpecialistReview = z.infer<typeof SpecialistReviewSchema>;

/** A specialist review enriched with the reviewer's stable identity. */
export interface Review extends SpecialistReview {
  specialist_id: string;
}

/* ─────────────────────── stage 3: consensus synthesis ─────────────────────── */

export const ProbabilityEntrySchema = z.object({
  diagnosis: z.string().catch(""),
  probability: z.coerce.number().catch(0),
  specialists_agreeing: z.coerce.number().catch(0),
});
export type ProbabilityEntry = z.infer<typeof ProbabilityEntrySchema>;

export const DisagreementSchema = z.object({
  point: z.string().catch(""),
  majority_view: z.string().catch(""),
  minority_view: z.string().catch(""),
  why_it_matters: z.string().catch(""),
});
export type Disagreement = z.infer<typeof DisagreementSchema>;

export const ConsensusSchema = z.object({
  consensus_diagnosis: z.string().catch(""),
  agreement_level: z.enum(AGREEMENT_LEVEL).catch("none"),
  probability_distribution: z.array(ProbabilityEntrySchema).catch([]),
  key_agreements: z.array(z.string()).catch([]),
  key_disagreements: z.array(DisagreementSchema).catch([]),
  recommended_investigations: z.array(z.string()).catch([]),
  urgent_actions: z.array(z.string()).catch([]),
  gp_summary: z.string().catch(""),
  patient_note: z.string().catch(""),
  safety_netting: z.array(z.string()).catch([]),
});
export type Consensus = z.infer<typeof ConsensusSchema>;

/* ─────────────────── stage 0: triage + routing agent ─────────────────── */

export const TriageSchema = z.object({
  urgency: z.enum(URGENCY).catch("routine"),
  recommended_specialty: z.string().catch("General Practice"),
  routing_rationale: z.string().catch(""),
  key_risk_factors: z.array(z.string()).catch([]),
});
export type Triage = z.infer<typeof TriageSchema>;

/* ─────────────────── stage 4: red-team safety agent ─────────────────── */

export const RedTeamChallengeSchema = z.object({
  claim: z.string().catch(""),
  challenge: z.string().catch(""),
});
export type RedTeamChallenge = z.infer<typeof RedTeamChallengeSchema>;

export const RedTeamSchema = z.object({
  confidence_in_consensus: z.coerce.number().catch(0),
  overlooked_possibilities: z.array(z.string()).catch([]),
  challenges: z.array(RedTeamChallengeSchema).catch([]),
  safety_concerns: z.array(z.string()).catch([]),
  recommendation: z.string().catch(""),
});
export type RedTeam = z.infer<typeof RedTeamSchema>;

/* ─────────────────── clinician review (human sign-off) input ─────────────────── */

export const ClinicianReviewInputSchema = z.object({
  clinician_id: z.string().min(1),
  decision: z.enum(CLINICIAN_DECISION),
  amended_diagnosis: z.string().optional().default(""),
  amended_summary: z.string().optional().default(""),
  note: z.string().optional().default(""),
  safety_confirmed: z.boolean().optional().default(false),
});
export type ClinicianReviewInput = z.infer<typeof ClinicianReviewInputSchema>;

/* ─────────────── doctor opinion (one of several, condensed by AI) ─────────────── */

export const OpinionInputSchema = z.object({
  clinician_id: z.string().min(1),
  // When a real, signed-in doctor reviews, their identity travels with the
  // opinion. When omitted, we fall back to the demo roster by clinician_id.
  clinician: z
    .object({
      name: z.string().min(1),
      specialty: z.string().min(1),
      credentials: z.string().optional().default(""),
      registration: z.string().optional().default(""),
    })
    .optional(),
  diagnosis: z.string().min(1).max(400),
  assessment: z.string().min(1).max(4000),
});
export type OpinionInput = z.infer<typeof OpinionInputSchema>;

/* ─────────────────────────── JSON Schemas ───────────────────────────
 * Hand-written to satisfy Structured Outputs exactly: every object sets
 * `additionalProperties: false` and lists every key in `required`.  No
 * numeric/length constraints (unsupported by Structured Outputs, enforced
 * in Zod instead).
 */

export type JsonSchema = Record<string, unknown>;

const stringArray: JsonSchema = { type: "array", items: { type: "string" } };

export const STRUCTURE_JSON_SCHEMA: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "anonymised_case",
    "removed_identifiers",
    "case_complexity",
    "urgent_flags",
  ],
  properties: {
    anonymised_case: {
      type: "object",
      additionalProperties: false,
      required: [
        "presenting_complaint",
        "symptom_timeline",
        "symptom_details",
        "relevant_history",
        "lifestyle_context",
        "patient_demographics",
      ],
      properties: {
        presenting_complaint: { type: "string" },
        symptom_timeline: { type: "string" },
        symptom_details: stringArray,
        relevant_history: { type: "string" },
        lifestyle_context: { type: "string" },
        patient_demographics: { type: "string" },
      },
    },
    removed_identifiers: stringArray,
    case_complexity: { type: "string", enum: [...CASE_COMPLEXITY] },
    urgent_flags: stringArray,
  },
};

export const REVIEW_JSON_SCHEMA: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "specialist_name",
    "specialty",
    "primary_diagnosis",
    "confidence",
    "clinical_reasoning",
    "differential_diagnoses",
    "red_flags_identified",
    "recommended_investigations",
    "what_others_might_miss",
    "questions_for_patient",
  ],
  properties: {
    specialist_name: { type: "string" },
    specialty: { type: "string" },
    primary_diagnosis: { type: "string" },
    confidence: { type: "number" },
    clinical_reasoning: { type: "string" },
    differential_diagnoses: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["diagnosis", "probability", "key_feature"],
        properties: {
          diagnosis: { type: "string" },
          probability: { type: "number" },
          key_feature: { type: "string" },
        },
      },
    },
    red_flags_identified: stringArray,
    recommended_investigations: stringArray,
    what_others_might_miss: { type: "string" },
    questions_for_patient: stringArray,
  },
};

export const CONSENSUS_JSON_SCHEMA: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "consensus_diagnosis",
    "agreement_level",
    "probability_distribution",
    "key_agreements",
    "key_disagreements",
    "recommended_investigations",
    "urgent_actions",
    "gp_summary",
    "patient_note",
    "safety_netting",
  ],
  properties: {
    consensus_diagnosis: { type: "string" },
    agreement_level: { type: "string", enum: [...AGREEMENT_LEVEL] },
    probability_distribution: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["diagnosis", "probability", "specialists_agreeing"],
        properties: {
          diagnosis: { type: "string" },
          probability: { type: "number" },
          specialists_agreeing: { type: "number" },
        },
      },
    },
    key_agreements: stringArray,
    key_disagreements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["point", "majority_view", "minority_view", "why_it_matters"],
        properties: {
          point: { type: "string" },
          majority_view: { type: "string" },
          minority_view: { type: "string" },
          why_it_matters: { type: "string" },
        },
      },
    },
    recommended_investigations: stringArray,
    urgent_actions: stringArray,
    gp_summary: { type: "string" },
    patient_note: { type: "string" },
    safety_netting: stringArray,
  },
};

export const TRIAGE_JSON_SCHEMA: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["urgency", "recommended_specialty", "routing_rationale", "key_risk_factors"],
  properties: {
    urgency: { type: "string", enum: [...URGENCY] },
    recommended_specialty: { type: "string" },
    routing_rationale: { type: "string" },
    key_risk_factors: stringArray,
  },
};

export const REDTEAM_JSON_SCHEMA: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "confidence_in_consensus",
    "overlooked_possibilities",
    "challenges",
    "safety_concerns",
    "recommendation",
  ],
  properties: {
    confidence_in_consensus: { type: "number" },
    overlooked_possibilities: stringArray,
    challenges: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["claim", "challenge"],
        properties: {
          claim: { type: "string" },
          challenge: { type: "string" },
        },
      },
    },
    safety_concerns: stringArray,
    recommendation: { type: "string" },
  },
};

/** Clamp a model-supplied percentage into a sane 0 to 100 integer. */
export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  // Some models return 0.82 instead of 82. Detect and rescale.
  let n = value;
  if (n > 0 && n <= 1) n = n * 100;
  return Math.max(0, Math.min(100, Math.round(n)));
}
