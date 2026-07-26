// the signed-in user's JWT, persisted client-side and sent as a bearer token
const KEY = "unitrade.token";

export function getSessionToken(): string | null {
  return localStorage.getItem(KEY);
}

export function setSessionToken(token: string | null): void {
  if (token) localStorage.setItem(KEY, token);
  else localStorage.removeItem(KEY);
}
