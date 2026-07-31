import type { AddressSuggestion, PlaceRef } from "@/types/Place";
import { apiFetch } from "@/lib/api";

export async function suggestAddresses(query: string): Promise<AddressSuggestion[]> {
  const res = await apiFetch(`/api/addresses/suggest?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  return (await res.json()) as AddressSuggestion[];
}

export async function resolveAddress(id: string): Promise<PlaceRef | null> {
  const res = await apiFetch(`/api/addresses/${encodeURIComponent(id)}`);
  if (!res.ok) return null;
  return (await res.json()) as PlaceRef;
}

export type ManualAddress = { street: string; suburb: string; state: string; postcode: string };

export async function resolveManual(a: ManualAddress): Promise<PlaceRef | null> {
  const qs = new URLSearchParams(a);
  const res = await apiFetch(`/api/addresses/manual?${qs.toString()}`);
  if (!res.ok) return null;
  return (await res.json()) as PlaceRef;
}
