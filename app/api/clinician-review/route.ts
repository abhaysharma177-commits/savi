import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/store";
import { ClinicianReviewInputSchema } from "@/lib/schemas";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = ClinicianReviewInputSchema.extend({
  caseId: z.string().min(1),
}).superRefine((val, ctx) => {
  if (val.decision === "amended" && !val.amended_diagnosis.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["amended_diagnosis"],
      message: "An amended diagnosis is required when amending.",
    });
  }
});

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid review submission." },
        { status: 400 }
      );
    }
    const { caseId, ...input } = parsed.data;

    const store = getStore();
    const caseRecord = await store.getCase(caseId);
    if (!caseRecord) {
      return NextResponse.json({ error: "Case not found." }, { status: 404 });
    }
    // Only a case with a provisional AI opinion may be signed off, you can't
    // finalise something that hasn't been reviewed and synthesised yet.
    if (caseRecord.status !== "awaiting_clinician") {
      return NextResponse.json(
        { error: "This case is not awaiting clinician review." },
        { status: 409 }
      );
    }

    const review = await store.saveClinicianReview(caseId, input);
    await store.updateCase(caseId, { status: "clinician_reviewed" });

    return NextResponse.json({ review });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: getErrorStatus(error) }
    );
  }
}
