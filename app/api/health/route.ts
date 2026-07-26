import { NextResponse } from "next/server";
import { hasAnthropicKey, isMockMode, MODELS, storageMode } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lightweight readiness probe, handy right before a live demo. */
export async function GET() {
  const mock = isMockMode();
  return NextResponse.json({
    ok: true,
    mode: mock ? "sample" : "live",
    anthropicKey: hasAnthropicKey(),
    storage: storageMode(),
    models: mock ? "built-in sample data" : MODELS,
  });
}
