import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { redactCase } from "@/lib/records";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const bundle = await getStore().getCaseBundle(params.id);
    if (!bundle) {
      return NextResponse.json({ error: "Case not found." }, { status: 404 });
    }
    return NextResponse.json({ ...bundle, case: redactCase(bundle.case) });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: getErrorStatus(error) }
    );
  }
}
