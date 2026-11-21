export const followUpLimit = 5;
export const followUpWindowMinutes = 5;
export const followUpLimitKey = "intindi-follow-up-attempts-v1";
const windowMs = followUpWindowMinutes * 60_000;

export function activeFollowUps(attempts: unknown, now = Date.now()): number[] {
  if (!Array.isArray(attempts)) return [];
  return attempts.filter((time): time is number =>
    typeof time === "number" && time <= now && time > now - windowMs,
  ).sort((a, b) => a - b).slice(-followUpLimit);
}

export function readFollowUps(fallback: number[], now = Date.now()) {
  try {
    const stored = localStorage.getItem(followUpLimitKey);
    if (stored) return activeFollowUps(JSON.parse(stored), now);
  } catch {
    // Storage may be unavailable in some browsers. Keep the current tab's count.
  }
  return activeFollowUps(fallback, now);
}
