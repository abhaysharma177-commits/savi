"use client";

import { useRef, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, X, ArrowRight, Loader2 } from "lucide-react";
import { DEMO_CASES } from "@/lib/demoCases";

interface PreparedAttachment {
  kind: "image" | "pdf";
  mediaType: string;
  data: string;
  name: string;
}

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_FILES = 8;

function getSessionId(): string {
  try {
    const key = "so_session";
    let value = localStorage.getItem(key);
    if (!value) {
      value = crypto.randomUUID();
      localStorage.setItem(key, value);
    }
    return value;
  } catch {
    return "anonymous";
  }
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

export function CaseForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<PreparedAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const canSubmit = text.trim().length >= 10 && !loading;

  async function addFiles(list: FileList | File[] | null) {
    if (!list) return;
    setError(null);
    const next: PreparedAttachment[] = [];
    for (const file of Array.from(list)) {
      if (attachments.length + next.length >= MAX_FILES) {
        setError(`You can attach up to ${MAX_FILES} files.`);
        break;
      }
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      if (!isImage && !isPdf) {
        setError("Please attach an image or a PDF.");
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        setError(`${file.name} is larger than 8 MB.`);
        continue;
      }
      try {
        const data = await readAsBase64(file);
        next.push({ kind: isPdf ? "pdf" : "image", mediaType: file.type, data, name: file.name });
      } catch {
        setError(`Could not read ${file.name}.`);
      }
    }
    if (next.length) setAttachments((prev) => [...prev, ...next]);
    if (fileInput.current) fileInput.current.value = "";
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (!loading) void addFiles(e.dataTransfer.files);
  }

  async function submit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/create-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawInput: text.trim(),
          sessionId: getSessionId(),
          attachments: attachments.map(({ kind, mediaType, data }) => ({ kind, mediaType, data })),
        }),
      });
      const json = (await res.json()) as { caseId?: string; error?: string };
      if (!res.ok || !json.caseId) throw new Error(json.error || "Something went wrong. Please try again.");
      router.push(`/intake/${json.caseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-savi-line bg-savi-paper p-5 sm:p-6">
      <label htmlFor="symptoms" className="sr-only">
        Describe what is going on
      </label>
      <textarea
        id="symptoms"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
        rows={6}
        placeholder="Tell us what's going on, in your own words. When it started, how it's changed, and what your doctor has said so far."
        className="w-full resize-y rounded-2xl border border-savi-line bg-savi-cream/50 p-4 text-[15px] leading-relaxed text-savi-ink placeholder:text-savi-muted focus:border-savi-accent/50 focus:outline-none focus:ring-2 focus:ring-savi-accent/15 disabled:opacity-60"
      />

      <div className="mt-3">
        <input
          ref={fileInput}
          type="file"
          accept="image/*,application/pdf"
          multiple
          hidden
          onChange={(e) => void addFiles(e.target.files)}
        />
        <div
          role="button"
          tabIndex={0}
          aria-label="Attach files"
          onClick={() => !loading && fileInput.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!loading) fileInput.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!loading) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed px-4 py-3.5 text-sm transition ${
            dragging ? "border-savi-accent bg-savi-accent-soft/50" : "border-savi-line hover:border-savi-accent/40"
          } ${loading ? "pointer-events-none opacity-60" : ""}`}
        >
          <Paperclip className="h-4 w-4 text-savi-muted" />
          <span className="text-savi-ink">
            Add photos, scans, or letters{" "}
            <span className="text-savi-muted">(optional)</span>
          </span>
        </div>

        {attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {attachments.map((a, i) => (
              <span
                key={`${a.name}-${i}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-savi-line bg-savi-cream px-3 py-1 text-xs text-savi-ink"
              >
                {a.name}
                <button
                  type="button"
                  aria-label={`Remove ${a.name}`}
                  onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                  className="text-savi-muted hover:text-savi-accent"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-savi-accent/30 bg-savi-accent-soft/60 p-3 text-sm text-savi-accent-deep">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-savi-accent px-7 py-3.5 text-base font-semibold text-white transition hover:bg-savi-accent-deep disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending to doctors…
            </>
          ) : (
            <>
              Get my second opinion
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
        <span className="text-sm text-savi-muted">
          Private and anonymised. Takes a few minutes.
        </span>
      </div>

      <div className="mt-5 border-t border-savi-line pt-4">
        <span className="text-xs font-medium text-savi-muted">
          Or try a sample case
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {DEMO_CASES.map((demo) => (
            <button
              key={demo.id}
              type="button"
              disabled={loading}
              onClick={() => {
                setText(demo.text);
                setError(null);
              }}
              title={demo.blurb}
              className="rounded-full border border-savi-line bg-savi-cream px-3.5 py-1.5 text-xs font-medium text-savi-ink transition hover:border-savi-ink/20 disabled:opacity-50"
            >
              {demo.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
