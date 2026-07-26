import type { Listing, NewListing, ListingPatch, ListingFilter } from "@/types/Listing";
import { apiFetch, errorMessage } from "@/lib/api";

export async function getListings(filter: ListingFilter = {}): Promise<Listing[]> {
  const qs = new URLSearchParams();
  if (filter.category) qs.set("category", filter.category);
  if (filter.universityId) qs.set("universityId", filter.universityId);
  if (filter.city) qs.set("city", filter.city);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await apiFetch(`/api/listings${suffix}`);
  if (!res.ok) throw new Error(`failed to load listings (${res.status})`);
  return (await res.json()) as Listing[];
}

export async function getListing(id: string): Promise<Listing> {
  const res = await apiFetch(`/api/listings/${id}`);
  if (!res.ok) throw new Error(`failed to load listing (${res.status})`);
  return (await res.json()) as Listing;
}

export async function createListing(input: NewListing): Promise<Listing> {
  const res = await apiFetch("/api/listings", { method: "POST", body: JSON.stringify(input) });
  if (!res.ok) throw new Error(await errorMessage(res, "failed to publish listing"));
  return (await res.json()) as Listing;
}

export async function updateListing(id: string, patch: ListingPatch): Promise<Listing> {
  const res = await apiFetch(`/api/listings/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
  if (!res.ok) throw new Error(await errorMessage(res, "failed to update listing"));
  return (await res.json()) as Listing;
}

export async function getMyListings(): Promise<Listing[]> {
  const res = await apiFetch("/api/listings/mine");
  if (!res.ok) throw new Error(`failed to load your listings (${res.status})`);
  return (await res.json()) as Listing[];
}

export async function markListingSold(id: string): Promise<Listing> {
  const res = await apiFetch(`/api/listings/${id}/sold`, { method: "POST" });
  if (!res.ok) throw new Error(await errorMessage(res, "failed to mark sold"));
  return (await res.json()) as Listing;
}

export async function deleteListing(id: string): Promise<void> {
  const res = await apiFetch(`/api/listings/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await errorMessage(res, "failed to delete listing"));
}
