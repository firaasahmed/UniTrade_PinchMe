// recently-viewed listing ids in localStorage — most recent first, capped
const KEY = "unitrade:recently-viewed";
const MAX = 12;

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function rememberViewed(id: string): void {
  try {
    const next = [id, ...read().filter((x) => x !== id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable — non-critical
  }
}

export function getViewed(): string[] {
  return read();
}
