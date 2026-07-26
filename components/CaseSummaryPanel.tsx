import type { StructureResult } from "@/types";

const COMPLEXITY_STYLE: Record<string, string> = {
  low: "border-agree/40 bg-agree/10 text-agree-soft",
  medium: "border-clinical/40 bg-clinical/10 text-clinical-soft",
  high: "border-caution/40 bg-caution/10 text-caution-soft",
};

function Field({ label, value }: { label: string; value: string }) {
  if (!value || !value.trim()) return null;
  return (
    <div>
      <span className="section-label">{label}</span>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">{value}</p>
    </div>
  );
}

function documentSummary(documents: string[]): string {
  const images = documents.filter((d) => d === "image").length;
  const pdfs = documents.filter((d) => d === "pdf").length;
  const parts: string[] = [];
  if (images) parts.push(`${images} image${images === 1 ? "" : "s"}`);
  if (pdfs) parts.push(`${pdfs} PDF${pdfs === 1 ? "" : "s"}`);
  return parts.join(" and ");
}

export function CaseSummaryPanel({
  structured,
  documents = [],
}: {
  structured: StructureResult;
  documents?: string[];
}) {
  const c = structured.anonymised_case;
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">Structured case file</h2>
        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            COMPLEXITY_STYLE[structured.case_complexity] ?? COMPLEXITY_STYLE.medium
          }`}
        >
          {structured.case_complexity} complexity
        </span>
      </div>

      {documents.length > 0 && (
        <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-line bg-surface-2/50 px-3 py-1.5 text-xs text-ink-muted">
          Synthesised with {documentSummary(documents)} you attached
        </p>
      )}

      <p className="mt-4 text-[15px] font-medium leading-snug text-ink">
        {c.presenting_complaint || "Presenting complaint not specified."}
      </p>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Timeline" value={c.symptom_timeline} />
        <Field label="Demographics" value={c.patient_demographics} />
        <Field label="Relevant history" value={c.relevant_history} />
        <Field label="Lifestyle context" value={c.lifestyle_context} />
      </div>

      {c.symptom_details.length > 0 && (
        <div className="mt-5">
          <span className="section-label">Symptoms</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {c.symptom_details.map((s, i) => (
              <span key={i} className="chip">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {structured.removed_identifiers.length > 0 && (
        <details className="mt-5 border-t border-line pt-4">
          <summary className="cursor-pointer text-xs font-medium text-ink-faint hover:text-ink-muted">
            Anonymised {structured.removed_identifiers.length} identifying detail
            {structured.removed_identifiers.length === 1 ? "" : "s"} before review
          </summary>
          <ul className="mt-2 space-y-1">
            {structured.removed_identifiers.map((r, i) => (
              <li key={i} className="text-xs text-ink-faint">
                · {r}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
