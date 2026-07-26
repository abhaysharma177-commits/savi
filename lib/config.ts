/**
 * Central configuration.  Everything is env-driven with production-quality
 * defaults so the app runs with only ANTHROPIC_API_KEY set.
 *
 * Models default to Claude Opus 4.8 (Anthropic's most capable model, the right
 * bar for clinical reasoning).  Structured outputs require a supporting model
 * (Opus 4.8 / Sonnet 5 / Haiku 4.5 / Fable 5); the AI layer degrades gracefully
 * to JSON extraction on any other model.
 */

const DEFAULT_MODEL = process.env.SECOND_OPINION_MODEL?.trim() || "claude-opus-4-8";

export const MODELS = {
  /** Anonymisation + clinical structuring. */
  triage: process.env.SECOND_OPINION_TRIAGE_MODEL?.trim() || DEFAULT_MODEL,
  /** The five independent specialist reviewers. */
  specialist: process.env.SECOND_OPINION_SPECIALIST_MODEL?.trim() || DEFAULT_MODEL,
  /** Consensus synthesis. */
  synthesis: process.env.SECOND_OPINION_SYNTHESIS_MODEL?.trim() || DEFAULT_MODEL,
} as const;

/** Reasoning effort per stage (low | medium | high | xhigh | max). */
export const EFFORT = {
  triage: process.env.SECOND_OPINION_TRIAGE_EFFORT?.trim() || "medium",
  specialist: process.env.SECOND_OPINION_SPECIALIST_EFFORT?.trim() || "medium",
  synthesis: process.env.SECOND_OPINION_SYNTHESIS_EFFORT?.trim() || "high",
} as const;

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

/**
 * Sample mode serves built-in demo results instead of calling Claude.
 * Forced on with SECOND_OPINION_MOCK=1, off with =0, otherwise auto-on whenever
 * no API key is set, so the app always runs, with or without a key.
 */
export function isMockMode(): boolean {
  const flag = process.env.SECOND_OPINION_MOCK?.trim().toLowerCase();
  if (flag === "1" || flag === "true") return true;
  if (flag === "0" || flag === "false") return false;
  return !(hasAnthropicKey() || hasOpenAIKey());
}

/** Returns Supabase server credentials only when both URL and service key are present. */
export function supabaseConfig(): { url: string; serviceKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (url && serviceKey) return { url, serviceKey };
  return null;
}

/** Human-readable summary of the active backend, surfaced in health checks. */
export function storageMode(): "supabase" | "in-memory" {
  return supabaseConfig() ? "supabase" : "in-memory";
}
