import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/store";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  caseId: z.string().min(1),
  answers: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .max(8),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
    }
    const { caseId, answers } = parsed.data;
    const store = getStore();
    const c = await store.getCase(caseId);
    if (!c || !c.anonymised_case) {
      return NextResponse.json({ error: "Case not found." }, { status: 404 });
    }

    const answered = answers.filter((a) => a.answer.trim());
    if (answered.length > 0) {
      // Fold the follow-up answers into the clinical picture the panel and
      // doctors read. The patient's original words (raw_input) are left untouched.
      const extra = answered
        .map((a) => `${a.question} — ${a.answer.trim()}`)
        .join(" ");
      const merged = {
        ...c.anonymised_case,
        relevant_history: [
          c.anonymised_case.relevant_history,
          `Follow-up answers: ${extra}`,
        ]
          .filter((s) => s && s.trim())
          .join(" "),
      };
      await store.updateCase(caseId, {
        anonymised_case: merged,
        ...(c.structured_case
          ? { structured_case: { ...c.structured_case, anonymised_case: merged } }
          : {}),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: getErrorStatus(error) }
    );
  }
}
