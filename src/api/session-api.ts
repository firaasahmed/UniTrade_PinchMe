import type { SessionUser } from "@/types/User";
import { apiFetch } from "@/lib/api";

export async function getMe(): Promise<SessionUser> {
  const res = await apiFetch("/api/me");
  if (!res.ok) throw new Error(`failed to load session (${res.status})`);
  return (await res.json()) as SessionUser;
}
