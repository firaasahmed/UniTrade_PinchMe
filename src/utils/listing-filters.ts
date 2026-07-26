import type { Listing } from "@/types/Listing";
import { categoryKind, type ListingKind } from "@/utils/categories";

export type SortKey = "newest" | "price-asc" | "price-desc";

export type KindFilter = ListingKind | "all";

export type Filters = {
  q: string;
  kind: KindFilter;
  category: string; // "" = any
  condition: string; // "" = any
  city: string; // "" = any
  minCents: number | null;
  maxCents: number | null;
  // provider filters for accommodation: a specific agency, or all university housing
  sellerId: string; // "" = any
  sellerOrg: "" | "university";
  sort: SortKey;
};

export const EMPTY_FILTERS: Filters = {
  q: "",
  kind: "all",
  category: "",
  condition: "",
  city: "",
  minCents: null,
  maxCents: null,
  sellerId: "",
  sellerOrg: "",
  sort: "newest",
};

export type Facets = {
  categories: string[];
  conditions: string[];
  cities: string[];
  priceMin: number;
  priceMax: number;
};

// derive the available filter options from the loaded set — no hardcoded lists
export function deriveFacets(listings: Listing[]): Facets {
  const categories = new Set<string>();
  const conditions = new Set<string>();
  const cities = new Set<string>();
  let priceMin = Number.POSITIVE_INFINITY;
  let priceMax = 0;

  for (const l of listings) {
    if (l.category) categories.add(l.category);
    if (l.condition) conditions.add(l.condition);
    if (l.location) cities.add(l.location);
    priceMin = Math.min(priceMin, l.priceCents);
    priceMax = Math.max(priceMax, l.priceCents);
  }

  return {
    categories: [...categories].sort(),
    conditions: [...conditions].sort(),
    cities: [...cities].sort(),
    priceMin: Number.isFinite(priceMin) ? priceMin : 0,
    priceMax,
  };
}

function matches(listing: Listing, f: Filters): boolean {
  if (f.kind !== "all" && categoryKind(listing.category) !== f.kind) return false;
  if (f.category && listing.category.toLowerCase() !== f.category.toLowerCase()) return false;
  if (f.condition && listing.condition !== f.condition) return false;
  if (f.city && listing.location !== f.city) return false;
  if (f.minCents !== null && listing.priceCents < f.minCents) return false;
  if (f.maxCents !== null && listing.priceCents > f.maxCents) return false;
  if (f.sellerId && listing.sellerId !== f.sellerId) return false;
  if (f.sellerOrg === "university" && listing.seller.orgType !== "university") return false;
  if (f.q) {
    const q = f.q.toLowerCase();
    const hay = `${listing.title} ${listing.description} ${listing.category} ${listing.location}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

// stable: filter then sort by an explicit key (createdAt desc keeps seed order for ties)
export function applyFilters(listings: Listing[], f: Filters): Listing[] {
  const out = listings.filter((l) => matches(l, f));
  switch (f.sort) {
    case "price-asc":
      return out.sort((a, b) => a.priceCents - b.priceCents);
    case "price-desc":
      return out.sort((a, b) => b.priceCents - a.priceCents);
    case "newest":
    default:
      return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

// count of non-default filters, for the mobile "Filters (n)" badge
export function activeFilterCount(f: Filters): number {
  let n = 0;
  if (f.category) n++;
  if (f.condition) n++;
  if (f.city) n++;
  if (f.minCents !== null || f.maxCents !== null) n++;
  if (f.sellerId || f.sellerOrg) n++;
  return n;
}
