import type { DealView, NewDeal } from "@/types/Deal";
import { apiFetch, errorMessage } from "@/lib/api";

export async function getThreadDeals(listingId: string, otherUserId: string): Promise<DealView[]> {
  const qs = new URLSearchParams({ listingId, otherUserId });
  const res = await apiFetch(`/api/deals?${qs.toString()}`);
  if (!res.ok) return [];
  return (await res.json()) as DealView[];
}

export async function getMyDeals(): Promise<DealView[]> {
  const res = await apiFetch("/api/deals");
  if (!res.ok) throw new Error(`failed to load deals (${res.status})`);
  return (await res.json()) as DealView[];
}

export async function createDeal(input: NewDeal & { buyerId?: string }): Promise<DealView> {
  const res = await apiFetch("/api/deals", { method: "POST", body: JSON.stringify(input) });
  if (!res.ok) throw new Error(await errorMessage(res, "failed to send"));
  return (await res.json()) as DealView;
}

async function act(id: string, action: string, body?: unknown): Promise<DealView> {
  const res = await apiFetch(`/api/deals/${id}/${action}`, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await errorMessage(res, `failed to ${action}`));
  return (await res.json()) as DealView;
}

export const acceptDeal = (id: string) => act(id, "accept");
export const declineDeal = (id: string) => act(id, "decline");
export const withdrawDeal = (id: string) => act(id, "withdraw");
type Reprice = { amountCents?: number; scheduledFor?: string; note?: string };

export const counterDeal = (id: string, body: Reprice) => act(id, "counter", body);
export const reviseDeal = (id: string, body: Reprice) => act(id, "revise", body);
