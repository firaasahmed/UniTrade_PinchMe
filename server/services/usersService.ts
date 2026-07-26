import { repo } from "../data/index.ts";
import type { ProfileView } from "../../src/types/User.ts";
import { publicUser, listListings } from "./listingsService.ts";
import { NotFoundError } from "../lib/errors.ts";

// public seller profile: safe projection, join date, and their active listings
export function getProfile(id: string): ProfileView {
  const user = repo.getUser(id);
  if (!user) throw new NotFoundError("user not found");
  return {
    user: publicUser(id),
    joinedAt: user.createdAt,
    location: user.location,
    listings: listListings({ sellerId: id }),
  };
}
