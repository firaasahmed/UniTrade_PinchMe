import type { University } from "../../../src/types/University.ts";
import type { User } from "../../../src/types/User.ts";
import type { ListingRow } from "../../../src/types/Listing.ts";
import type { BrandDeal } from "../../../src/types/BrandDeal.ts";
import { seedUniversities } from "./universities.ts";
import { seedUsers } from "./users.ts";
import { seedListings } from "./listings.ts";
import { seedBrandDeals } from "./brandDeals.ts";

export type SeedData = {
  universities: University[];
  users: User[];
  listings: ListingRow[];
  brandDeals: BrandDeal[];
};

export const seed: SeedData = {
  universities: seedUniversities,
  users: seedUsers,
  listings: seedListings,
  brandDeals: seedBrandDeals,
};
