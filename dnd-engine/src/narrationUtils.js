export const DEFAULT_NARRATION_DURATION_MS = 15000;

export function normalizeNarrationDuration(duration) {
  if (duration === null || duration === undefined || duration === '') {
    return DEFAULT_NARRATION_DURATION_MS;
  }
  const number = Number(duration);
  return Number.isFinite(number) ? number : DEFAULT_NARRATION_DURATION_MS;
}
