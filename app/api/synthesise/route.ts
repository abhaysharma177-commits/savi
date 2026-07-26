import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/store";
import { redTeamReview, synthesiseConsensus } from "@/lib/orchestrator";
import type { RedTeam } from "@/lib/schemas";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

const Body = z.object({ caseId: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "caseId is required." }, { status: 400 });
    }
    const { caseId } = parsed.data;

    const store = getStore();
    const caseRecord = await store.getCase(caseId);
    if (!caseRecord || !caseRecord.anonymised_case) {
      return NextResponse.json(
        { error: "Case not found or not yet structured." },
        { status: 404 }
      );
    }

    const reviews = await store.getReviews(caseId);
    if (reviews.length === 0) {
      return NextResponse.json(
        { error: "No specialist reviews found for this case yet." },
        { status: 409 }
      );
    }

    await store.updateCase(caseId, { status: "synthesising" });
    try {
      const consensus = await synthesiseConsensus(caseRecord.anonymised_case, reviews);

      // Red-team safety pass. Best-effort, a consensus is still valuable without it.
      let redTeam: RedTeam | null = null;
      try {
        redTeam = await redTeamReview(caseRecord.anonymised_case, reviews, consensus);
      } catch {
        /* proceed without the red-team pass */
      }

      const record = await store.saveConsensus(caseId, consensus, redTeam);
      // Provisional AI opinion is ready, it now awaits a verified clinician.
      await store.updateCase(caseId, { status: "awaiting_clinician" });

      return NextResponse.json({ caseId, consensusId: record.id, consensus, redTeam });
    } catch (error) {
      await store.updateCase(caseId, { status: "error" });
      throw error;
    }
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: getErrorStatus(error) }
    );
  }
}
