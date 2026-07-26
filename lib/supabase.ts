import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig } from "./config";

/**
 * Returns a service-role Supabase client, or null when Supabase isn't
 * configured (the app then transparently uses the in-memory store).
 */
let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  if (!cached) {
    cached = createClient(cfg.url, cfg.serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
