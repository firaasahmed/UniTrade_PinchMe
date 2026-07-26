import { repo } from "../data/index.ts";
import type { Listing } from "../../src/types/Listing.ts";
import { getListingView } from "./listingsService.ts";
import { NotFoundError } from "../lib/errors.ts";

export function watchlistIds(userId: string): string[] {
  return repo.getWatchlistIds(userId);
}

// watched listings that still exist, newest-watched last preserved by id order
export function listWatchlist(userId: string): Listing[] {
  return repo
    .getWatchlistIds(userId)
    .map((id) => (repo.getListing(id) ? getListingView(id) : null))
    .filter((x): x is Listing => x !== null);
}

export function addWatch(userId: string, listingId: string): void {
  if (!repo.getListing(listingId)) throw new NotFoundError("listing not found");
  repo.addToWatchlist(userId, listingId);
}

export function removeWatch(userId: string, listingId: string): void {
  repo.removeFromWatchlist(userId, listingId);
}
