import type { MerchantRegistration, MerchantView } from "@/types/Merchant";
import { apiFetch } from "@/lib/api";

export async function getMyMerchant(): Promise<MerchantView> {
  const res = await apiFetch("/api/merchants/me");
  if (!res.ok) throw new Error("couldn't load your payout details");
  return (await res.json()) as MerchantView;
}

export async function registerMerchant(input: MerchantRegistration): Promise<MerchantView> {
  const res = await apiFetch("/api/merchants", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `registration failed (${res.status})`);
  }
  return (await res.json()) as MerchantView;
}
