import type { Listing } from "@/types/Listing";

export type Providers = {
  uniCount: number;
  agencies: { id: string; name: string; count: number }[];
};

// who is renting: the university itself, or a managing agency
export function deriveProviders(listings: Listing[]): Providers {
  const uniCount = listings.filter((l) => l.seller.orgType === "university").length;
  const agencies = new Map<string, { id: string; name: string; count: number }>();
  for (const l of listings) {
    if (l.seller.orgType !== "agency") continue;
    const cur = agencies.get(l.sellerId) ?? { id: l.sellerId, name: l.seller.name, count: 0 };
    cur.count++;
    agencies.set(l.sellerId, cur);
  }
  return { uniCount, agencies: [...agencies.values()].sort((a, b) => a.name.localeCompare(b.name)) };
}
