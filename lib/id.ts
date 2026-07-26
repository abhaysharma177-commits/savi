/**
 * ID + timestamp helpers.  `crypto.randomUUID` is available in Node 18+ and
 * every modern browser; a cheap fallback keeps this working everywhere.
 */
export function newId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
