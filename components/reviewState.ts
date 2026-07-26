import { SPECIALISTS } from "@/lib/prompts";
import type { Review } from "@/types";

/** Client-side runtime state for each specialist during the live review phase. */
export type ReviewStatus = "pending" | "reviewing" | "complete" | "error";

export interface SpecialistMeta {
  id: string;
  name: string;
  specialty: string;
  initials: string;
  tagline: string;
  hue: string;
}

export interface ReviewSlot {
  meta: SpecialistMeta;
  status: ReviewStatus;
  review?: Review;
  error?: string;
}

/** Initial slots, seeded from the known personas so cards render instantly. */
export function seedSlots(): ReviewSlot[] {
  return SPECIALISTS.map((s) => ({
    meta: {
      id: s.id,
      name: s.name,
      specialty: s.specialty,
      initials: s.initials,
      tagline: s.tagline,
      hue: s.hue,
    },
    status: "pending",
  }));
}
