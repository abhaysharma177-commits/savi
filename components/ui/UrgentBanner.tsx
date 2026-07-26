import { IconAlert } from "./icons";

export function UrgentBanner({
  items,
  title = "Urgent, discuss with a doctor promptly",
}: {
  items: string[];
  title?: string;
}) {
  const shown = items.filter((i) => i && i.trim().length > 0);
  if (shown.length === 0) return null;

  return (
    <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4 sm:p-5">
      <div className="flex items-center gap-2 text-danger-soft">
        <IconAlert className="h-5 w-5" />
        <h3 className="text-sm font-semibold uppercase tracking-wide">{title}</h3>
      </div>
      <ul className="mt-3 space-y-1.5">
        {shown.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-ink">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
