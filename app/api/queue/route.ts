import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { redactCase } from "@/lib/records";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The clinician review queue, cases whose AI opinion awaits human sign-off. */
export async function GET() {
  try {
    const cases = await getStore().listOpenCases(50);
    return NextResponse.json({ cases: cases.map(redactCase) });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: getErrorStatus(error) }
    );
  }
}
