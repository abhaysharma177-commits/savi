import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/store";
import { generateIntakeQuestions } from "@/lib/orchestrator";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Body = z.object({ caseId: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Missing case." }, { status: 400 });
    }
    const store = getStore();
    const c = await store.getCase(parsed.data.caseId);
    if (!c || !c.anonymised_case) {
      return NextResponse.json({ questions: [] });
    }
    const questions = await generateIntakeQuestions(c.anonymised_case);
    return NextResponse.json({ questions });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: getErrorStatus(error) }
    );
  }
}
