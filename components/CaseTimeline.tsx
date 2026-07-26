import type { CaseStatus } from "@/types";
import { IconCheck } from "./ui/icons";

const STEPS = [
  "Submitted",
  "Structured & triaged",
  "Five AI reviews",
  "Consensus + red-team",
  "Clinician verified",
];

// How many steps are fully complete for a given status.
const COMPLETED: Record<CaseStatus, number> = {
  created: 1,
  structuring: 1,
  structured: 2,
  reviewing: 2,
  reviewed: 3,
  synthesising: 3,
  awaiting_clinician: 4,
  clinician_reviewed: 5,
  error: 0,
};

export function CaseTimeline({ status }: { status: CaseStatus }) {
  const completed = COMPLETED[status] ?? 0;

  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-0">
      {STEPS.map((label, i) => {
        const state = i < completed ? "done" : i === completed ? "current" : "pending";
        const isLast = i === STEPS.length - 1;
        return (
          <li key={i} className="flex flex-1 gap-3 sm:flex-col sm:items-center sm:text-center">
            <div className="flex flex-col items-center sm:w-full sm:flex-row">
              <span
                className={`z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
                  state === "done"
                    ? "border-agree/50 bg-agree/15 text-agree-soft"
                    : state === "current"
                      ? "border-clinical/60 bg-clinical/15 text-clinical-soft"
                      : "border-line bg-surface-2 text-ink-faint"
                }`}
              >
                {state === "done" ? <IconCheck className="h-3.5 w-3.5" /> : i + 1}
              </span>
              {/* connector */}
              <span
                className={`my-1 h-6 w-px sm:my-0 sm:h-px sm:w-full ${
                  isLast ? "opacity-0" : i < completed ? "bg-agree/40" : "bg-line"
                }`}
              />
            </div>
            <span
              className={`pb-4 text-xs sm:pb-0 sm:pt-2 ${
                state === "pending" ? "text-ink-faint" : "text-ink-muted"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
