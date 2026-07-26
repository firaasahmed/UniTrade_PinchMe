import type { SessionUser } from "@/types/User";
import { apiFetch, errorMessage } from "@/lib/api";

export type RegisterInput = { name: string; email: string; password: string; location?: string };
export type AuthResult = { token: string; user: SessionUser };

export async function register(input: RegisterInput): Promise<AuthResult> {
  const res = await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(input) });
  if (!res.ok) throw new Error(await errorMessage(res, "registration failed"));
  return (await res.json()) as AuthResult;
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "sign in failed"));
  return (await res.json()) as AuthResult;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await apiFetch("/api/auth/password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "couldn't change your password"));
}
