import Link from "next/link";

/**
 * Wordmark only, no icon. Inherits the surrounding text colour so it works on
 * both the light marketing pages and the app shells.
 */
export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      aria-label="Savi home"
      className="inline-flex items-baseline gap-1 font-serif text-2xl font-semibold tracking-tight transition hover:opacity-80"
    >
      Savi
      <span className="h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-savi-accent" />
    </Link>
  );
}
