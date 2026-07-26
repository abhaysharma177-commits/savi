import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/store";
import { getUser } from "@/lib/supabaseServer";
import { structureCase, triageCase } from "@/lib/orchestrator";
import { imageAttachment, pdfAttachment, type Attachment } from "@/lib/anthropic";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
import type { StructureResult } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const AttachmentInput = z.object({
  kind: z.enum(["image", "pdf"]),
  mediaType: z
    .string()
    .regex(/^(image\/(png|jpe?g|webp|gif)|application\/pdf)$/i),
  data: z.string().max(9_000_000), // base64, no data: URI prefix (~6 MB binary)
});

const Body = z.object({
  rawInput: z.string().max(20000),
  sessionId: z.string().nullable().optional(),
  attachments: z.array(AttachmentInput).max(8).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please describe your symptoms before submitting." },
        { status: 400 }
      );
    }
    const { rawInput, sessionId, attachments } = parsed.data;
    if (rawInput.trim().length < 10) {
      return NextResponse.json(
        { error: "Please add a little more detail about your symptoms (at least a sentence)." },
        { status: 400 }
      );
    }

    const store = getStore();
    const user = await getUser();
    const caseRecord = await store.createCase({
      rawInput,
      sessionId: sessionId ?? null,
      userId: user?.id ?? null,
    });
    await store.updateCase(caseRecord.id, { status: "structuring" });

    const atts: Attachment[] = (attachments ?? []).map((a) =>
      a.kind === "image" ? imageAttachment(a.mediaType, a.data) : pdfAttachment(a.data)
    );

    let structured: StructureResult;
    try {
      structured = await structureCase(rawInput, atts);
    } catch (error) {
      // If an attachment broke the call, retry text-only rather than failing.
      if (atts.length > 0) {
        try {
          structured = await structureCase(rawInput, []);
        } catch (retryError) {
          await store.updateCase(caseRecord.id, { status: "error" });
          throw retryError;
        }
      } else {
        await store.updateCase(caseRecord.id, { status: "error" });
        throw error;
      }
    }

    await store.updateCase(caseRecord.id, {
      structured_case: structured,
      anonymised_case: structured.anonymised_case,
      documents: (attachments ?? []).map((a) => a.kind),
      status: "structured",
    });

    // Triage + routing. Best-effort, never fail case creation if it errors.
    let triage = null;
    try {
      triage = await triageCase(structured.anonymised_case);
      await store.updateCase(caseRecord.id, { triage });
    } catch {
      /* proceed without triage */
    }

    return NextResponse.json({ caseId: caseRecord.id, structured, triage });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: getErrorStatus(error) }
    );
  }
}
