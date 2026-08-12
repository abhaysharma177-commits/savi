import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { redactCase } from "@/lib/records";
import { getUser } from "@/lib/supabaseServer";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const bundle = await getStore().getCaseBundle(params.id);
    if (!bundle) {
      return NextResponse.json({ error: "Case not found." }, { status: 404 });
    }
    // A reviewing clinician sees the patient's original, verbatim words. Everyone
    // else gets the raw text stripped (only the anonymised clinical picture).
    const user = await getUser();
    const isClinician = user?.user_metadata?.role === "clinician";
    const caseOut = isClinician ? bundle.case : redactCase(bundle.case);
    return NextResponse.json({ ...bundle, case: caseOut });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: getErrorStatus(error) }
    );
  }
}
