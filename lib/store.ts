import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";
import { getSpecialist } from "./prompts";
import { getClinician } from "./clinicians";
import { newId, nowIso } from "./id";
import { AppError } from "./errors";
import { SpecialistReviewSchema } from "./schemas";
import type {
  AnonymisedCase,
  ClinicianReviewInput,
  Consensus,
  OpinionInput,
  RedTeam,
  Review,
  StructureResult,
  Triage,
} from "./schemas";
import type {
  CaseBundle,
  CaseRecord,
  CaseStatus,
  ClinicianReviewRecord,
  ConsensusRecord,
  Opinion,
} from "./records";

/**
 * Persistence abstraction. Two implementations:
 *   • SupabaseStore , Postgres, used when Supabase env vars are present.
 *   • MemoryStore   , process-local map, used otherwise so the app always runs.
 */
export interface Store {
  readonly mode: "supabase" | "in-memory";
  createCase(input: {
    rawInput: string;
    sessionId?: string | null;
    userId?: string | null;
  }): Promise<CaseRecord>;
  getCase(id: string): Promise<CaseRecord | null>;
  updateCase(id: string, patch: Partial<CaseRecord>): Promise<void>;
  saveReview(caseId: string, review: Review): Promise<void>;
  getReviews(caseId: string): Promise<Review[]>;
  saveConsensus(
    caseId: string,
    consensus: Consensus,
    redTeam: RedTeam | null
  ): Promise<ConsensusRecord>;
  getConsensus(caseId: string): Promise<ConsensusRecord | null>;
  saveClinicianReview(
    caseId: string,
    input: ClinicianReviewInput
  ): Promise<ClinicianReviewRecord>;
  getClinicianReview(caseId: string): Promise<ClinicianReviewRecord | null>;
  getCaseBundle(caseId: string): Promise<CaseBundle | null>;
  listCasesForUser(userId: string, limit?: number): Promise<CaseRecord[]>;
  listCasesAwaitingClinician(limit?: number): Promise<CaseRecord[]>;
  listOpenCases(limit?: number): Promise<CaseRecord[]>;
  saveOpinion(caseId: string, input: OpinionInput): Promise<Opinion>;
  listOpinions(caseId: string): Promise<Opinion[]>;
  saveDoctorConsensus(caseId: string, consensus: Consensus): Promise<void>;
  getDoctorConsensus(caseId: string): Promise<Consensus | null>;
}

function buildClinicianReview(
  caseId: string,
  input: ClinicianReviewInput
): ClinicianReviewRecord {
  const clinician = getClinician(input.clinician_id);
  if (!clinician) {
    throw new AppError("Unknown clinician.", 400);
  }
  return {
    id: newId(),
    created_at: nowIso(),
    case_id: caseId,
    clinician_id: clinician.id,
    clinician,
    decision: input.decision,
    amended_diagnosis: input.amended_diagnosis,
    amended_summary: input.amended_summary,
    note: input.note,
    safety_confirmed: input.safety_confirmed,
  };
}

function buildOpinion(caseId: string, input: OpinionInput): Opinion {
  const clinician = getClinician(input.clinician_id);
  if (!clinician) {
    throw new AppError("Unknown clinician.", 400);
  }
  return {
    id: newId(),
    created_at: nowIso(),
    case_id: caseId,
    clinician_id: clinician.id,
    clinician,
    diagnosis: input.diagnosis,
    assessment: input.assessment,
  };
}

/* ─────────────────────────── in-memory store ─────────────────────────── */

interface MemoryData {
  cases: Map<string, CaseRecord>;
  reviews: Map<string, Review[]>;
  consensus: Map<string, ConsensusRecord>;
  clinicianReviews: Map<string, ClinicianReviewRecord>;
  opinions: Map<string, Opinion[]>;
  doctorConsensus: Map<string, Consensus>;
}

function memoryData(): MemoryData {
  const g = globalThis as unknown as { __soMemory?: MemoryData };
  if (!g.__soMemory) {
    g.__soMemory = {
      cases: new Map(),
      reviews: new Map(),
      consensus: new Map(),
      clinicianReviews: new Map(),
      opinions: new Map(),
      doctorConsensus: new Map(),
    };
  }
  return g.__soMemory;
}

class MemoryStore implements Store {
  readonly mode = "in-memory" as const;

  async createCase(input: {
    rawInput: string;
    sessionId?: string | null;
    userId?: string | null;
  }): Promise<CaseRecord> {
    const record: CaseRecord = {
      id: newId(),
      created_at: nowIso(),
      raw_input: input.rawInput,
      structured_case: null,
      anonymised_case: null,
      triage: null,
      documents: [],
      user_id: input.userId ?? null,
      status: "created",
      session_id: input.sessionId ?? null,
    };
    memoryData().cases.set(record.id, record);
    return record;
  }

  async getCase(id: string): Promise<CaseRecord | null> {
    return memoryData().cases.get(id) ?? null;
  }

  async updateCase(id: string, patch: Partial<CaseRecord>): Promise<void> {
    const data = memoryData();
    const existing = data.cases.get(id);
    if (!existing) return;
    data.cases.set(id, { ...existing, ...patch });
  }

  async saveReview(caseId: string, review: Review): Promise<void> {
    const data = memoryData();
    const list = data.reviews.get(caseId) ?? [];
    const next = list.filter((r) => r.specialist_id !== review.specialist_id);
    next.push(review);
    data.reviews.set(caseId, next);
  }

  async getReviews(caseId: string): Promise<Review[]> {
    return [...(memoryData().reviews.get(caseId) ?? [])];
  }

  async saveConsensus(
    caseId: string,
    consensus: Consensus,
    redTeam: RedTeam | null
  ): Promise<ConsensusRecord> {
    const record: ConsensusRecord = {
      id: newId(),
      created_at: nowIso(),
      case_id: caseId,
      consensus,
      red_team: redTeam,
    };
    memoryData().consensus.set(caseId, record);
    return record;
  }

  async getConsensus(caseId: string): Promise<ConsensusRecord | null> {
    return memoryData().consensus.get(caseId) ?? null;
  }

  async saveClinicianReview(
    caseId: string,
    input: ClinicianReviewInput
  ): Promise<ClinicianReviewRecord> {
    const record = buildClinicianReview(caseId, input);
    memoryData().clinicianReviews.set(caseId, record);
    return record;
  }

  async getClinicianReview(caseId: string): Promise<ClinicianReviewRecord | null> {
    return memoryData().clinicianReviews.get(caseId) ?? null;
  }

  async saveOpinion(caseId: string, input: OpinionInput): Promise<Opinion> {
    const record = buildOpinion(caseId, input);
    const data = memoryData();
    const list = data.opinions.get(caseId) ?? [];
    // One opinion per clinician per case: replace theirs if they revise it.
    const next = list.filter((o) => o.clinician_id !== record.clinician_id);
    next.push(record);
    data.opinions.set(caseId, next);
    return record;
  }

  async listOpinions(caseId: string): Promise<Opinion[]> {
    return [...(memoryData().opinions.get(caseId) ?? [])];
  }

  async saveDoctorConsensus(caseId: string, consensus: Consensus): Promise<void> {
    memoryData().doctorConsensus.set(caseId, consensus);
  }

  async getDoctorConsensus(caseId: string): Promise<Consensus | null> {
    return memoryData().doctorConsensus.get(caseId) ?? null;
  }

  async getCaseBundle(caseId: string): Promise<CaseBundle | null> {
    const caseRecord = await this.getCase(caseId);
    if (!caseRecord) return null;
    const consensusRecord = await this.getConsensus(caseId);
    return {
      case: caseRecord,
      reviews: await this.getReviews(caseId),
      consensus: consensusRecord?.consensus ?? null,
      red_team: consensusRecord?.red_team ?? null,
      clinician_review: await this.getClinicianReview(caseId),
      opinions: await this.listOpinions(caseId),
      doctor_consensus: await this.getDoctorConsensus(caseId),
    };
  }

  async listCasesForUser(userId: string, limit = 25): Promise<CaseRecord[]> {
    return [...memoryData().cases.values()]
      .filter((c) => c.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }

  async listCasesAwaitingClinician(limit = 25): Promise<CaseRecord[]> {
    return [...memoryData().cases.values()]
      .filter((c) => c.status === "awaiting_clinician")
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }

  async listOpenCases(limit = 50): Promise<CaseRecord[]> {
    return [...memoryData().cases.values()]
      .filter(
        (c) =>
          c.anonymised_case &&
          c.status !== "clinician_reviewed" &&
          c.status !== "error"
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }
}

/* ─────────────────────────── supabase store ─────────────────────────── */

interface CaseRow {
  id: string;
  created_at: string;
  raw_input: string;
  structured_case: StructureResult | null;
  anonymised_case: AnonymisedCase | null;
  triage: Triage | null;
  documents: string[] | null;
  user_id: string | null;
  status: string | null;
  session_id: string | null;
}

function rowToCase(row: CaseRow): CaseRecord {
  return {
    id: row.id,
    created_at: row.created_at,
    raw_input: row.raw_input,
    structured_case: row.structured_case,
    anonymised_case: row.anonymised_case,
    triage: row.triage ?? null,
    documents: row.documents ?? [],
    user_id: row.user_id ?? null,
    status: (row.status ?? "created") as CaseStatus,
    session_id: row.session_id,
  };
}

class SupabaseStore implements Store {
  readonly mode = "supabase" as const;
  constructor(private readonly db: SupabaseClient) {}

  async createCase(input: {
    rawInput: string;
    sessionId?: string | null;
    userId?: string | null;
  }): Promise<CaseRecord> {
    const base = {
      raw_input: input.rawInput,
      session_id: input.sessionId ?? null,
      status: "created",
    };
    let { data, error } = await this.db
      .from("cases")
      .insert({ ...base, user_id: input.userId ?? null })
      .select()
      .single();
    // Resilient to a not-yet-migrated table: retry without user_id.
    if (error && /user_id/i.test(error.message)) {
      ({ data, error } = await this.db
        .from("cases")
        .insert(base)
        .select()
        .single());
    }
    if (error || !data) {
      throw new Error(`Supabase insert failed: ${error?.message ?? "no row"}`);
    }
    return rowToCase(data as CaseRow);
  }

  async getCase(id: string): Promise<CaseRecord | null> {
    const { data, error } = await this.db
      .from("cases")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Supabase read failed: ${error.message}`);
    return data ? rowToCase(data as CaseRow) : null;
  }

  async updateCase(id: string, patch: Partial<CaseRecord>): Promise<void> {
    const allowed: Record<string, unknown> = {};
    if (patch.status !== undefined) allowed.status = patch.status;
    if (patch.structured_case !== undefined) allowed.structured_case = patch.structured_case;
    if (patch.anonymised_case !== undefined) allowed.anonymised_case = patch.anonymised_case;
    if (patch.triage !== undefined) allowed.triage = patch.triage;
    if (patch.documents !== undefined) allowed.documents = patch.documents;
    if (patch.session_id !== undefined) allowed.session_id = patch.session_id;
    if (Object.keys(allowed).length === 0) return;
    const { error } = await this.db.from("cases").update(allowed).eq("id", id);
    if (error) throw new Error(`Supabase update failed: ${error.message}`);
  }

  async saveReview(caseId: string, review: Review): Promise<void> {
    const persona = getSpecialist(review.specialist_id) ?? null;
    // Idempotent per specialist, mirror MemoryStore's dedup so a re-run doesn't
    // accumulate duplicate rows that would skew the consensus.
    await this.db
      .from("reviews")
      .delete()
      .eq("case_id", caseId)
      .eq("specialist_type", review.specialist_id);
    const { error } = await this.db.from("reviews").insert({
      case_id: caseId,
      specialist_type: review.specialist_id,
      specialist_persona: persona,
      review_content: JSON.stringify(review),
      primary_diagnosis: review.primary_diagnosis,
      confidence_score: Math.round(review.confidence),
      differential_diagnoses: review.differential_diagnoses,
      red_flags: review.red_flags_identified,
      recommended_tests: review.recommended_investigations,
      status: "complete",
    });
    if (error) throw new Error(`Supabase review insert failed: ${error.message}`);
  }

  async getReviews(caseId: string): Promise<Review[]> {
    const { data, error } = await this.db
      .from("reviews")
      .select("review_content, specialist_type")
      .eq("case_id", caseId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(`Supabase reviews read failed: ${error.message}`);
    const rows = (data ?? []) as Array<{
      review_content: string | null;
      specialist_type: string | null;
    }>;
    const reviews: Review[] = [];
    for (const row of rows) {
      if (!row.review_content) continue;
      try {
        const raw = JSON.parse(row.review_content) as { specialist_id?: string };
        // Re-validate through Zod (its `.catch` defaults heal a corrupt row)
        // rather than trusting stored JSON to still match the current shape.
        const validated = SpecialistReviewSchema.parse(raw);
        reviews.push({
          ...validated,
          specialist_id: raw.specialist_id || row.specialist_type || "",
        });
      } catch {
        // Skip an unparseable row rather than failing the whole read.
      }
    }
    return reviews;
  }

  async saveConsensus(
    caseId: string,
    consensus: Consensus,
    redTeam: RedTeam | null
  ): Promise<ConsensusRecord> {
    const minority = consensus.key_disagreements[0]?.minority_view ?? null;
    const { data, error } = await this.db
      .from("consensus")
      .insert({
        case_id: caseId,
        agreed_diagnosis: consensus.consensus_diagnosis,
        confidence_distribution: consensus.probability_distribution,
        disagreement_points: consensus.key_disagreements,
        recommended_next_steps: consensus.recommended_investigations,
        gp_summary: consensus.gp_summary,
        minority_view: minority,
        raw: consensus,
        red_team: redTeam,
      })
      .select()
      .single();
    if (error || !data) {
      throw new Error(`Supabase consensus insert failed: ${error?.message ?? "no row"}`);
    }
    const row = data as { id: string; created_at: string };
    return {
      id: row.id,
      created_at: row.created_at,
      case_id: caseId,
      consensus,
      red_team: redTeam,
    };
  }

  async getConsensus(caseId: string): Promise<ConsensusRecord | null> {
    const { data, error } = await this.db
      .from("consensus")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`Supabase consensus read failed: ${error.message}`);
    if (!data) return null;
    const row = data as {
      id: string;
      created_at: string;
      raw?: unknown;
      red_team?: unknown;
    };
    if (row.raw && typeof row.raw === "object") {
      return {
        id: row.id,
        created_at: row.created_at,
        case_id: caseId,
        consensus: row.raw as Consensus,
        red_team: (row.red_team as RedTeam | null) ?? null,
      };
    }
    return null;
  }

  async saveClinicianReview(
    caseId: string,
    input: ClinicianReviewInput
  ): Promise<ClinicianReviewRecord> {
    const record = buildClinicianReview(caseId, input);
    const { error } = await this.db.from("clinician_reviews").insert({
      id: record.id,
      case_id: caseId,
      clinician_id: record.clinician_id,
      clinician: record.clinician,
      decision: record.decision,
      amended_diagnosis: record.amended_diagnosis,
      amended_summary: record.amended_summary,
      note: record.note,
      safety_confirmed: record.safety_confirmed,
    });
    if (error) {
      throw new Error(`Supabase clinician review insert failed: ${error.message}`);
    }
    return record;
  }

  async getClinicianReview(caseId: string): Promise<ClinicianReviewRecord | null> {
    const { data, error } = await this.db
      .from("clinician_reviews")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`Supabase clinician review read failed: ${error.message}`);
    if (!data) return null;
    const row = data as {
      id: string;
      created_at: string;
      clinician_id: string;
      clinician: ClinicianReviewRecord["clinician"];
      decision: ClinicianReviewRecord["decision"];
      amended_diagnosis: string | null;
      amended_summary: string | null;
      note: string | null;
      safety_confirmed: boolean | null;
    };
    return {
      id: row.id,
      created_at: row.created_at,
      case_id: caseId,
      clinician_id: row.clinician_id,
      clinician: row.clinician,
      decision: row.decision,
      amended_diagnosis: row.amended_diagnosis ?? "",
      amended_summary: row.amended_summary ?? "",
      note: row.note ?? "",
      safety_confirmed: Boolean(row.safety_confirmed),
    };
  }

  async getCaseBundle(caseId: string): Promise<CaseBundle | null> {
    const caseRecord = await this.getCase(caseId);
    if (!caseRecord) return null;
    const [reviews, consensusRecord, clinicianReview, opinions, doctorConsensus] =
      await Promise.all([
        this.getReviews(caseId),
        this.getConsensus(caseId),
        this.getClinicianReview(caseId),
        this.listOpinions(caseId),
        this.getDoctorConsensus(caseId),
      ]);
    return {
      case: caseRecord,
      reviews,
      consensus: consensusRecord?.consensus ?? null,
      red_team: consensusRecord?.red_team ?? null,
      clinician_review: clinicianReview,
      opinions,
      doctor_consensus: doctorConsensus,
    };
  }

  async saveOpinion(caseId: string, input: OpinionInput): Promise<Opinion> {
    const record = buildOpinion(caseId, input);
    // One opinion per clinician per case.
    await this.db
      .from("opinions")
      .delete()
      .eq("case_id", caseId)
      .eq("clinician_id", record.clinician_id);
    const { error } = await this.db.from("opinions").insert({
      id: record.id,
      case_id: caseId,
      clinician_id: record.clinician_id,
      clinician: record.clinician,
      diagnosis: record.diagnosis,
      assessment: record.assessment,
    });
    if (error) throw new Error(`Supabase opinion insert failed: ${error.message}`);
    return record;
  }

  async listOpinions(caseId: string): Promise<Opinion[]> {
    const { data, error } = await this.db
      .from("opinions")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: true });
    if (error) return []; // resilient if the table isn't created yet
    return (data ?? []) as Opinion[];
  }

  async saveDoctorConsensus(caseId: string, consensus: Consensus): Promise<void> {
    await this.db
      .from("doctor_consensus")
      .delete()
      .eq("case_id", caseId);
    await this.db
      .from("doctor_consensus")
      .insert({ case_id: caseId, raw: consensus });
  }

  async getDoctorConsensus(caseId: string): Promise<Consensus | null> {
    const { data, error } = await this.db
      .from("doctor_consensus")
      .select("raw")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    const raw = (data as { raw?: unknown }).raw;
    return raw && typeof raw === "object" ? (raw as Consensus) : null;
  }

  async listCasesForUser(userId: string, limit = 25): Promise<CaseRecord[]> {
    const { data, error } = await this.db
      .from("cases")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return []; // resilient if the table has no user_id column yet
    return ((data ?? []) as CaseRow[]).map(rowToCase);
  }

  async listCasesAwaitingClinician(limit = 25): Promise<CaseRecord[]> {
    const { data, error } = await this.db
      .from("cases")
      .select("*")
      .eq("status", "awaiting_clinician")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`Supabase case list failed: ${error.message}`);
    return ((data ?? []) as CaseRow[]).map(rowToCase);
  }

  async listOpenCases(limit = 50): Promise<CaseRecord[]> {
    const { data, error } = await this.db
      .from("cases")
      .select("*")
      .not("anonymised_case", "is", null)
      .not("status", "in", '("clinician_reviewed","error")')
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`Supabase open cases failed: ${error.message}`);
    return ((data ?? []) as CaseRow[]).map(rowToCase);
  }
}

/* ─────────────────────────── factory ─────────────────────────── */

let storeSingleton: Store | null = null;

export function getStore(): Store {
  if (storeSingleton) return storeSingleton;
  const supabase = getSupabase();
  storeSingleton = supabase ? new SupabaseStore(supabase) : new MemoryStore();
  return storeSingleton;
}
