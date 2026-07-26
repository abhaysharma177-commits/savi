/**
 * Typed application error carrying an HTTP status, plus small helpers for
 * turning arbitrary thrown values into safe, user-facing strings.
 */
export class AppError extends Error {
  readonly status: number;
  readonly detail?: string;

  constructor(message: string, status = 500, detail?: string) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.detail = detail;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "An unknown error occurred.";
  }
}

export function getErrorStatus(error: unknown): number {
  if (error instanceof AppError) return error.status;
  return 500;
}
