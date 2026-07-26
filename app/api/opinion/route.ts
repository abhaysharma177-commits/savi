import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/store";
import { OpinionInputSchema } from "@/lib/schemas";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = OpinionInputSchema.extend({ caseId: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please give a diagnosis and a short assessment." },
        { status: 400 }
      );
    }
    const { caseId, ...input } = parsed.data;
    const store = getStore();
    const caseRecord = await store.getCase(caseId);
    if (!caseRecord || !caseRecord.anonymised_case) {
      return NextResponse.json({ error: "Case not found." }, { status: 404 });
    }
    const opinion = await store.saveOpinion(caseId, input);
    return NextResponse.json({ opinion });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: getErrorStatus(error) }
    );
  }
}
