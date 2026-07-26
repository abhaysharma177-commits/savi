import { IconShield } from "./icons";

export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-line bg-surface-2/60 p-4 text-xs leading-relaxed text-ink-muted ${className}`}
    >
      <IconShield className="mt-0.5 h-4 w-4 shrink-0 text-clinical-soft" />
      <p>
        <span className="font-semibold text-ink">Decision support, not a diagnosis.</span>{" "}
        Savi helps you prepare for a conversation with a qualified clinician. It
        does not replace professional medical advice, diagnosis or treatment. If
        your symptoms are severe or worsening, seek urgent care or call your
        local emergency number.
      </p>
    </div>
  );
}
