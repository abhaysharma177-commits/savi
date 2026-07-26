import { IconCheck, IconShield } from "./icons";

/**
 * The trust anchor. Every opinion is either AI-provisional (awaiting a verified
 * clinician) or clinician-verified. This badge makes that state unmistakable.
 */
export function ProvenanceBadge({
  verified,
  className = "",
}: {
  verified: boolean;
  className?: string;
}) {
  if (verified) {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full border border-agree/40 bg-agree/10 px-3 py-1 text-xs font-semibold text-agree-soft ${className}`}
      >
        <IconShield className="h-3.5 w-3.5" />
        Clinician-verified
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-caution/40 bg-caution/10 px-3 py-1 text-xs font-semibold text-caution-soft ${className}`}
    >
      <IconCheck className="h-3.5 w-3.5" />
      AI provisional · awaiting clinician
    </span>
  );
}
