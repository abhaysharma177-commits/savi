import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { AppError, getErrorMessage } from "./errors";
import type { JsonSchema } from "./schemas";

/**
 * A minimal structural view of a validator (every Zod schema satisfies it).
 * Inferring T from `parse`'s return type keys off the schema's *output* type,
 * avoiding the loose input-type inference that `ZodType<T>` produces for schemas
 * built with `.catch(...)`.
 */
interface Parseable<T> {
  parse(data: unknown): T;
}

/**
 * The single boundary between our strongly-typed application and the Anthropic
 * SDK.  We construct the request body ourselves and forward it through one
 * carefully-scoped cast, so the code compiles against any SDK version and still
 * works even if the installed SDK's TypeScript types predate newer request
 * fields (`output_config`, adaptive `thinking`). The Messages endpoint accepts
 * those fields on the wire regardless of SDK version.
 */

/** Minimal view of the Messages response, only the fields we read. */
interface ClaudeResponse {
  content: Array<{ type: string; text?: string; thinking?: string }>;
  stop_reason: string | null;
  model?: string;
}

let cachedClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    throw new AppError(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the server.",
      503
    );
  }
  if (!cachedClient) cachedClient = new Anthropic();
  return cachedClient;
}

async function callClaude(body: Record<string, unknown>): Promise<ClaudeResponse> {
  const client = getClient();
  // Retype the resource (same object reference, `this` stays correct) so we can
  // pass forward-compatible request bodies without fighting version-specific types.
  const messages = client.messages as unknown as {
    create: (b: unknown) => Promise<ClaudeResponse>;
  };
  return messages.create(body);
}

function extractText(res: ClaudeResponse): string {
  if (res.stop_reason === "refusal") {
    throw new AppError(
      "A reviewer declined to answer this request for safety reasons.",
      422
    );
  }
  const text = (res.content ?? [])
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text as string)
    .join("")
    .trim();
  if (!text) {
    throw new AppError("The model returned an empty response.", 502);
  }
  return text;
}

/** Strip markdown code fences and isolate the outermost JSON object. */
function parseLenientJson(raw: string): unknown {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    // Fall through to brace extraction.
  }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return JSON.parse(cleaned.slice(start, end + 1));
  }
  throw new AppError("The model response was not valid JSON.", 502);
}

export type Attachment = Record<string, unknown>;

export interface GenerateOptions {
  model: string;
  system: string;
  prompt: string;
  /** Extra content blocks (image / document) prepended to the user turn. */
  attachments?: Attachment[];
  jsonSchema: JsonSchema;
  effort?: string;
  maxTokens?: number;
  /** Enable adaptive thinking for higher-quality reasoning. */
  thinking?: boolean;
}

let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiClient) openaiClient = new OpenAI();
  return openaiClient;
}

/**
 * Live provider when OPENAI_API_KEY is set. Strict Structured Outputs first,
 * plain JSON-object mode as a fallback; Zod's `.catch` defaults are the net.
 */
async function generateWithOpenAI<T>(
  schema: Parseable<T>,
  opts: GenerateOptions
): Promise<T> {
  const client = getOpenAI();
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const messages = [
    { role: "system", content: opts.system },
    { role: "user", content: opts.prompt },
  ];
  const maxTokens = opts.maxTokens ?? 3200;
  const read = (res: unknown): string =>
    (res as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]
      ?.message?.content ?? "";
  try {
    const res = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages: messages as never,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "result",
          strict: true,
          schema: opts.jsonSchema as Record<string, unknown>,
        },
      },
    } as never);
    const text = read(res);
    if (!text) throw new AppError("The model returned an empty response.", 502);
    return schema.parse(parseLenientJson(text));
  } catch (firstError) {
    try {
      const res = await client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        messages: messages as never,
        response_format: { type: "json_object" },
      } as never);
      return schema.parse(parseLenientJson(read(res)));
    } catch (secondError) {
      throw new AppError(
        `The AI reviewer could not produce a valid result: ${getErrorMessage(
          secondError
        )}`,
        502,
        getErrorMessage(firstError)
      );
    }
  }
}

/**
 * Generate a structured object from Claude and validate it with Zod.
 *
 * Attempt 1 uses Structured Outputs (guaranteed-shape JSON) + optional adaptive
 * thinking.  If the call errors or the payload can't be parsed, attempt 2 drops
 * Structured Outputs and thinking and relies on the prompt's explicit JSON
 * instruction plus lenient extraction.  Zod (with `.catch` defaults) is the
 * final safety net, so a single malformed field never throws.
 */
export async function generateStructured<T>(
  schema: Parseable<T>,
  opts: GenerateOptions
): Promise<T> {
  if (process.env.OPENAI_API_KEY?.trim()) {
    return generateWithOpenAI(schema, opts);
  }
  const userContent: Attachment[] = [
    ...(opts.attachments ?? []),
    { type: "text", text: opts.prompt },
  ];
  const maxTokens = opts.maxTokens ?? 3200;

  const baseBody: Record<string, unknown> = {
    model: opts.model,
    max_tokens: maxTokens,
    system: opts.system,
    messages: [{ role: "user", content: userContent }],
  };

  // Attempt 1, Structured Outputs (+ optional adaptive thinking).
  try {
    const body: Record<string, unknown> = {
      ...baseBody,
      output_config: {
        ...(opts.effort ? { effort: opts.effort } : {}),
        format: { type: "json_schema", schema: opts.jsonSchema },
      },
    };
    if (opts.thinking) body.thinking = { type: "adaptive" };
    const res = await callClaude(body);
    return schema.parse(parseLenientJson(extractText(res)));
  } catch (firstError) {
    // A genuine safety refusal shouldn't be retried and then masked as a 502 , 
    // surface it with its real status.
    if (firstError instanceof AppError && firstError.status === 422) {
      throw firstError;
    }
    // Attempt 2, plain call, no Structured Outputs, no thinking. The prompt
    // already instructs "respond with a single JSON object and nothing else".
    try {
      const res = await callClaude(baseBody);
      return schema.parse(parseLenientJson(extractText(res)));
    } catch (secondError) {
      throw new AppError(
        `The AI reviewer could not produce a valid result: ${getErrorMessage(
          secondError
        )}`,
        502,
        getErrorMessage(firstError)
      );
    }
  }
}

/** Build an image content block from a base64 data payload. */
export function imageAttachment(mediaType: string, base64: string): Attachment {
  return {
    type: "image",
    source: { type: "base64", media_type: mediaType, data: base64 },
  };
}

/** Build a PDF document content block from a base64 data payload. */
export function pdfAttachment(base64: string): Attachment {
  return {
    type: "document",
    source: { type: "base64", media_type: "application/pdf", data: base64 },
  };
}
