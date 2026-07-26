import type { Listing } from "@/types/Listing";
import { apiFetch, errorMessage } from "@/lib/api";

export type WatchlistBundle = { ids: string[]; listings: Listing[] };

export async function getWatchlist(): Promise<WatchlistBundle> {
  const res = await apiFetch("/api/watchlist");
  if (!res.ok) throw new Error(`failed to load watchlist (${res.status})`);
  return (await res.json()) as WatchlistBundle;
}

export async function addWatch(id: string): Promise<void> {
  const res = await apiFetch(`/api/watchlist/${id}`, { method: "POST" });
  if (!res.ok) throw new Error(await errorMessage(res, "failed to add to watchlist"));
}

export async function removeWatch(id: string): Promise<void> {
  const res = await apiFetch(`/api/watchlist/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await errorMessage(res, "failed to remove from watchlist"));
}
