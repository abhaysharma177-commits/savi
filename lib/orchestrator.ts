import { generateStructured, type Attachment } from "./anthropic";
import { MODELS, EFFORT, isMockMode } from "./config";
import {
  mockConsensus,
  mockRedTeam,
  mockReview,
  mockStructure,
  mockTriage,
} from "./mock";
import {
  SPECIALISTS,
  buildConsensusPrompt,
  buildDoctorConsensusPrompt,
  buildRedTeamPrompt,
  buildSpecialistPrompt,
  buildStructurePrompt,
  buildTriagePrompt,
  type Specialist,
} from "./prompts";
import type { Opinion } from "./records";
import {
  CONSENSUS_JSON_SCHEMA,
  ConsensusSchema,
  REDTEAM_JSON_SCHEMA,
  REVIEW_JSON_SCHEMA,
  RedTeamSchema,
  STRUCTURE_JSON_SCHEMA,
  SpecialistReviewSchema,
  StructureResultSchema,
  TRIAGE_JSON_SCHEMA,
  TriageSchema,
  clampPercent,
  type AnonymisedCase,
  type Consensus,
  type RedTeam,
  type Review,
  type StructureResult,
  type Triage,
} from "./schemas";

/**
 * The three reasoning stages, as coordinated agents.  Each is a pure async
 * function so routes can compose them (sequentially, in parallel, or streamed).
 */

/** Stage 1, anonymise + structure the raw case. */
export async function structureCase(
  rawInput: string,
  attachments?: Attachment[]
): Promise<StructureResult> {
  if (isMockMode()) return mockStructure(rawInput);
  const { system, user } = buildStructurePrompt(rawInput);
  return generateStructured(StructureResultSchema, {
    model: MODELS.triage,
    system,
    prompt: user,
    attachments,
    jsonSchema: STRUCTURE_JSON_SCHEMA,
    effort: EFFORT.triage,
    thinking: false,
    maxTokens: 3000,
  });
}

/** Stage 0, triage: assess urgency and route to a human specialty. */
export async function triageCase(anonymised: AnonymisedCase): Promise<Triage> {
  if (isMockMode()) return mockTriage(anonymised);
  const { system, user } = buildTriagePrompt(anonymised);
  return generateStructured(TriageSchema, {
    model: MODELS.triage,
    system,
    prompt: user,
    jsonSchema: TRIAGE_JSON_SCHEMA,
    effort: EFFORT.triage,
    thinking: false,
    maxTokens: 1500,
  });
}

/** Stage 2, a single specialist's independent, blind review. */
export async function runSpecialistReview(
  specialist: Specialist,
  anonymised: AnonymisedCase
): Promise<Review> {
  if (isMockMode()) return mockReview(specialist, anonymised);
  const { system, user } = buildSpecialistPrompt(specialist, anonymised);
  const review = await generateStructured(SpecialistReviewSchema, {
    model: MODELS.specialist,
    system,
    prompt: user,
    jsonSchema: REVIEW_JSON_SCHEMA,
    effort: EFFORT.specialist,
    thinking: true,
    maxTokens: 5000,
  });
  // Enforce the reviewer's real identity and clamp model-supplied percentages.
  return {
    ...review,
    specialist_id: specialist.id,
    specialist_name: specialist.name,
    specialty: specialist.specialty,
    confidence: clampPercent(review.confidence),
    differential_diagnoses: review.differential_diagnoses.map((d) => ({
      ...d,
      probability: clampPercent(d.probability),
    })),
  };
}

export const ALL_SPECIALISTS = SPECIALISTS;

/** Stage 3, synthesise the independent reviews into a consensus. */
export async function synthesiseConsensus(
  anonymised: AnonymisedCase,
  reviews: Review[]
): Promise<Consensus> {
  if (isMockMode()) return mockConsensus(anonymised, reviews);
  const consensus = await generateStructured(ConsensusSchema, {
    model: MODELS.synthesis,
    ...pairToOptions(buildConsensusPrompt(anonymised, reviews)),
    jsonSchema: CONSENSUS_JSON_SCHEMA,
    effort: EFFORT.synthesis,
    thinking: true,
    maxTokens: 6000,
  });
  const specialistCount = reviews.length || SPECIALISTS.length;
  return {
    ...consensus,
    probability_distribution: consensus.probability_distribution.map((p) => ({
      ...p,
      probability: clampPercent(p.probability),
      specialists_agreeing: Math.max(
        0,
        Math.min(specialistCount, Math.round(p.specialists_agreeing))
      ),
    })),
  };
}

/** Condense several real doctors' opinions into one calibrated consensus. */
export async function synthesiseDoctorConsensus(
  anonymised: AnonymisedCase,
  opinions: Opinion[]
): Promise<Consensus> {
  if (opinions.length === 0 || isMockMode()) {
    return fallbackDoctorConsensus(opinions);
  }
  const consensus = await generateStructured(ConsensusSchema, {
    model: MODELS.synthesis,
    ...pairToOptions(buildDoctorConsensusPrompt(anonymised, opinions)),
    jsonSchema: CONSENSUS_JSON_SCHEMA,
    effort: EFFORT.synthesis,
    maxTokens: 4000,
  });
  const n = opinions.length;
  return {
    ...consensus,
    probability_distribution: consensus.probability_distribution.map((p) => ({
      ...p,
      probability: clampPercent(p.probability),
      specialists_agreeing: Math.max(0, Math.min(n, Math.round(p.specialists_agreeing))),
    })),
  };
}

/** Deterministic tally, used when the model is off or there are no opinions. */
function fallbackDoctorConsensus(opinions: Opinion[]): Consensus {
  const counts = new Map<string, number>();
  for (const o of opinions) counts.set(o.diagnosis, (counts.get(o.diagnosis) ?? 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const total = opinions.length;
  const top = sorted[0]?.[0] ?? "Awaiting doctor opinions";
  const topN = sorted[0]?.[1] ?? 0;
  const level: Consensus["agreement_level"] =
    total === 0
      ? "none"
      : topN === total
        ? "strong"
        : topN > total / 2
          ? "moderate"
          : sorted.length > 1
            ? "weak"
            : "moderate";
  return {
    consensus_diagnosis: top,
    agreement_level: level,
    probability_distribution: sorted.map(([d, count]) => ({
      diagnosis: d,
      probability: total ? Math.round((count / total) * 100) : 0,
      specialists_agreeing: count,
    })),
    key_agreements: topN > 1 ? [`${topN} of ${total} doctors pointed to ${top}.`] : [],
    key_disagreements: [],
    recommended_investigations: [],
    urgent_actions: [],
    gp_summary:
      total > 0
        ? `${total} doctor${total === 1 ? "" : "s"} reviewed this case. The most common view was ${top}.`
        : "No doctor opinions yet.",
    patient_note: "",
    safety_netting: [],
  };
}

/** Stage 4, red-team: challenge the consensus for safety. */
export async function redTeamReview(
  anonymised: AnonymisedCase,
  reviews: Review[],
  consensus: Consensus
): Promise<RedTeam> {
  if (isMockMode()) return mockRedTeam(anonymised);
  const redTeam = await generateStructured(RedTeamSchema, {
    model: MODELS.synthesis,
    ...pairToOptions(buildRedTeamPrompt(anonymised, reviews, consensus)),
    jsonSchema: REDTEAM_JSON_SCHEMA,
    effort: EFFORT.synthesis,
    thinking: true,
    maxTokens: 3000,
  });
  return {
    ...redTeam,
    confidence_in_consensus: clampPercent(redTeam.confidence_in_consensus),
  };
}

function pairToOptions(pair: { system: string; user: string }): {
  system: string;
  prompt: string;
} {
  return { system: pair.system, prompt: pair.user };
}
