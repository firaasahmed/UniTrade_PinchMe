import type { Listing } from "@/types/Listing";

// cents to a stable aud string, e.g. 4500 -> "$45.00" — precise, used at checkout
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// stable short date, e.g. "1 Aug 2026"
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// "Priya S." -> "PS", for avatar fallbacks
export function initials(name: string): string {
  return name
    .split(" ")
    .map((s) => s.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// marketplace display: drop the .00 on whole dollars, append a rate unit if present
// e.g. 32000 + "week" -> "$320/week", 185000 -> "$1,850"
export function formatListingPrice(listing: Listing): string {
  const dollars = listing.priceCents / 100;
  const whole = Number.isInteger(dollars);
  const amount = dollars.toLocaleString("en-AU", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return listing.rateUnit ? `$${amount}/${listing.rateUnit}` : `$${amount}`;
}
