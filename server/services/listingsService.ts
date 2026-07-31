import { repo } from "../data/index.ts";
import type { Listing, ListingRow, NewListing, ListingPatch, ListingFilter } from "../../src/types/Listing.ts";
import type { PublicUser, User } from "../../src/types/User.ts";
import { NotFoundError, ForbiddenError } from "../lib/errors.ts";

export function publicUser(sellerId: string): PublicUser {
  const user = repo.getUser(sellerId);
  const university = user ? repo.getUniversity(user.universityId)?.name ?? "" : "";
  return {
    id: sellerId,
    name: user?.name ?? "Unknown seller",
    universityId: user?.universityId ?? "",
    university,
    verified: user?.verified ?? false,
    orgType: user?.orgType,
    // presence of a merchant is enough — reading pinch per listing would put a
    // network call on every grid render, and the checkout guard is the real gate
    payoutReady: Boolean(user && repo.getPinchMerchantId(user.id)),
  };
}

function enrich(row: ListingRow): Listing {
  return { ...row, seller: publicUser(row.sellerId) };
}

function assertOwner(user: User, row: ListingRow): void {
  if (user.role !== "admin" && row.sellerId !== user.id) {
    throw new ForbiddenError("you can only change your own listings");
  }
}

// public browse defaults to active listings only
export function listListings(filter: ListingFilter): Listing[] {
  return repo.getListings({ ...filter, status: filter.status ?? "active" }).map(enrich);
}

export function getListingView(id: string): Listing {
  const row = repo.getListing(id);
  if (!row) throw new NotFoundError("listing not found");
  return enrich(row);
}

export function createListing(user: User, input: NewListing): Listing {
  return enrich(repo.createListing(user.id, input));
}

export function updateListing(user: User, id: string, patch: ListingPatch): Listing {
  const row = repo.getListing(id);
  if (!row) throw new NotFoundError("listing not found");
  assertOwner(user, row);
  const updated = repo.updateListing(id, patch);
  if (!updated) throw new NotFoundError("listing not found");
  return enrich(updated);
}

export function markSold(user: User, id: string): Listing {
  return updateListing(user, id, { status: "sold" });
}

export function deleteListing(user: User, id: string): void {
  const row = repo.getListing(id);
  if (!row) throw new NotFoundError("listing not found");
  assertOwner(user, row);
  repo.deleteListing(id);
}

// a user's own listings, all statuses, for "My Listings"
export function listUserListings(userId: string): Listing[] {
  return repo.getListings({ sellerId: userId }).map(enrich);
}
