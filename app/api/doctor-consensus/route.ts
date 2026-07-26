import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/store";
import { synthesiseDoctorConsensus } from "@/lib/orchestrator";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const Body = z.object({ caseId: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const { caseId } = Body.parse(await req.json());
    const store = getStore();
    const caseRecord = await store.getCase(caseId);
    if (!caseRecord || !caseRecord.anonymised_case) {
      return NextResponse.json({ error: "Case not found." }, { status: 404 });
    }
    const opinions = await store.listOpinions(caseId);
    if (opinions.length === 0) {
      return NextResponse.json({ error: "No doctor opinions yet." }, { status: 409 });
    }
    const consensus = await synthesiseDoctorConsensus(
      caseRecord.anonymised_case,
      opinions
    );
    await store.saveDoctorConsensus(caseId, consensus);
    return NextResponse.json({ consensus, opinionCount: opinions.length });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: getErrorStatus(error) }
    );
  }
}
