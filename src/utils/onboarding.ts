// per-user onboarding completion — client-only until we need cross-device sync
const PREFIX = "unitrade:onboarding-done:";

export function hasCompletedOnboarding(userId: string): boolean {
  try {
    return localStorage.getItem(PREFIX + userId) === "1";
  } catch {
    return true; // if storage is blocked, don't keep nagging
  }
}

export function markOnboardingComplete(userId: string): void {
  try {
    localStorage.setItem(PREFIX + userId, "1");
  } catch {
    // non-critical
  }
}
