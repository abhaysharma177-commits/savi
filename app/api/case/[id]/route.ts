import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { redactCase } from "@/lib/records";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const store = getStore();
    const caseRecord = await store.getCase(params.id);
    if (!caseRecord) {
      return NextResponse.json({ error: "Case not found." }, { status: 404 });
    }
    const reviews = await store.getReviews(params.id);
    return NextResponse.json({ case: redactCase(caseRecord), reviews });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: getErrorStatus(error) }
    );
  }
}
