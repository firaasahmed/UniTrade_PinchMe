import type { ProfileView, SessionUser, UserPatch } from "@/types/User";
import { apiFetch, errorMessage } from "@/lib/api";

export async function getProfile(id: string): Promise<ProfileView> {
  const res = await apiFetch(`/api/users/${id}`);
  if (!res.ok) throw new Error(`failed to load profile (${res.status})`);
  return (await res.json()) as ProfileView;
}

export async function updateMe(patch: UserPatch): Promise<SessionUser> {
  const res = await apiFetch("/api/me", { method: "PATCH", body: JSON.stringify(patch) });
  if (!res.ok) throw new Error(await errorMessage(res, "failed to update profile"));
  return (await res.json()) as SessionUser;
}
