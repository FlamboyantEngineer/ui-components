/** An error's nonempty message, or the caller's fallback for other rejection values. */
export function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
