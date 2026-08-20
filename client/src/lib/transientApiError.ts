const transientApiPatterns = [
  /unexpected token '<'/i,
  /gateway time-?out/i,
  /failed to fetch/i,
  /networkerror/i,
];

export function shouldRetryTransientApiError(failureCount: number, error: unknown) {
  if (failureCount >= 2) return false;
  const message = error instanceof Error ? error.message : String(error ?? "");
  return transientApiPatterns.some(pattern => pattern.test(message));
}
