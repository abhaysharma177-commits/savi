import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/store";
import { ALL_SPECIALISTS, runSpecialistReview } from "@/lib/orchestrator";
import { sseStream } from "@/lib/sse";
import { getErrorMessage } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const Body = z.object({ caseId: z.string().min(1) });

export async function POST(req: NextRequest) {
  let caseId: string;
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "caseId is required." }, { status: 400 });
    }
    caseId = parsed.data.caseId;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const store = getStore();
  const caseRecord = await store.getCase(caseId);
  if (!caseRecord || !caseRecord.anonymised_case) {
    return NextResponse.json(
      { error: "Case not found or not yet structured." },
      { status: 404 }
    );
  }
  if (caseRecord.status === "clinician_reviewed") {
    return NextResponse.json(
      { error: "This case has already been finalised by a clinician." },
      { status: 409 }
    );
  }
  const anonymised = caseRecord.anonymised_case;
  const total = ALL_SPECIALISTS.length;

  return sseStream(async (send) => {
    await store.updateCase(caseId, { status: "reviewing" });

    send({
      event: "start",
      data: {
        total,
        specialists: ALL_SPECIALISTS.map((s) => ({
          id: s.id,
          name: s.name,
          specialty: s.specialty,
          initials: s.initials,
          tagline: s.tagline,
          hue: s.hue,
        })),
      },
    });

    let completed = 0;
    let succeeded = 0;

    // Five independent, blind reviews in parallel. One failing reviewer never
    // takes down the stream, it emits a review_error and the rest continue.
    await Promise.all(
      ALL_SPECIALISTS.map(async (specialist) => {
        send({ event: "reviewing", data: { specialistId: specialist.id } });
        try {
          const review = await runSpecialistReview(specialist, anonymised);
          await store.saveReview(caseId, review);
          completed += 1;
          succeeded += 1;
          send({ event: "review", data: { review, completed, total } });
        } catch (error) {
          completed += 1;
          send({
            event: "review_error",
            data: {
              specialistId: specialist.id,
              message: getErrorMessage(error),
              completed,
              total,
            },
          });
        }
      })
    );

    // If every reviewer failed there is nothing to synthesise, mark the case
    // as errored rather than advancing it to "reviewed".
    await store.updateCase(caseId, {
      status: succeeded > 0 ? "reviewed" : "error",
    });
    send({ event: "complete", data: { completed, succeeded, total } });
  });
}
