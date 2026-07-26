import type { NewListing, Listing } from "@/types/Listing";
import type { ListingKind } from "@/utils/categories";
import { categoryKind } from "@/utils/categories";
import { toCentsAllowingZero as toCents, toInt } from "@/utils/money";

export { toCents, toInt };

export type Draft = {
  kind: ListingKind;
  category: string;
  title: string;
  description: string;
  priceDollars: string;
  condition: string;
  location: string;
  meetup: string;
  images: string[];
  bedrooms: string;
  bathrooms: string;
  bondDollars: string;
  availableFrom: string;
  leaseTerm: string;
  furnished: boolean;
};

// the common student leases; "other" is free text so nothing is forced
export const LEASE_TERMS = [
  "One semester",
  "6 months",
  "12 months",
  "Month to month",
] as const;

export const EMPTY_DRAFT: Draft = {
  kind: "item",
  category: "",
  title: "",
  description: "",
  priceDollars: "",
  condition: "",
  location: "",
  meetup: "",
  images: [],
  bedrooms: "",
  bathrooms: "",
  bondDollars: "",
  availableFrom: "",
  leaseTerm: "",
  furnished: false,
};

// input length caps mirror the backend's tolerances
export const LIMITS = { title: 120, description: 1000, location: 120, meetup: 160 };

export type StepId = 0 | 1 | 2 | 3 | 4;

// per-step required-field validity. condition only required for items
export function stepValidity(d: Draft): Record<StepId, boolean> {
  const priceCents = toCents(d.priceDollars);
  const isItem = d.kind === "item";
  const type = d.category.trim() !== "";
  const details = d.title.trim() !== "";
  const pricing =
    priceCents !== undefined &&
    d.location.trim() !== "" &&
    d.meetup.trim() !== "" &&
    (!isItem || d.condition.trim() !== "");
  const description = d.description.trim() !== "";
  return { 0: type, 1: details, 2: pricing, 3: description, 4: type && details && pricing && description };
}

// which required fields are missing on a given step, for inline error marks
export function missingFields(d: Draft, step: StepId): Set<string> {
  const miss = new Set<string>();
  if (step === 0 && d.category.trim() === "") miss.add("category");
  if (step === 1 && d.title.trim() === "") miss.add("title");
  if (step === 2) {
    if (toCents(d.priceDollars) === undefined) miss.add("price");
    if (d.location.trim() === "") miss.add("location");
    if (d.meetup.trim() === "") miss.add("meetup");
    if (d.kind === "item" && d.condition.trim() === "") miss.add("condition");
  }
  if (step === 3 && d.description.trim() === "") miss.add("description");
  return miss;
}

export function draftToNewListing(d: Draft, status: "active" | "draft"): NewListing | null {
  // drafts may be saved without a price; publishing requires a valid one
  const priceCents = toCents(d.priceDollars) ?? (status === "draft" ? 0 : undefined);
  if (priceCents === undefined) return null;
  const rateUnit = d.kind === "service" ? "hr" : d.kind === "accommodation" ? "week" : undefined;
  const images = d.images.map((s) => s.trim()).filter((s) => s !== "");
  const input: NewListing = {
    title: d.title.trim(),
    description: d.description.trim(),
    priceCents,
    rateUnit,
    category: d.category.trim(),
    condition: d.condition.trim(),
    location: d.location.trim(),
    lat: 0,
    lng: 0,
    meetup: d.meetup.trim(),
    imageUrl: images[0] ?? "",
    images: images.length ? images : undefined,
    status,
  };
  if (d.kind === "accommodation") {
    input.bedrooms = toInt(d.bedrooms);
    input.bathrooms = toInt(d.bathrooms);
    input.bondCents = toCents(d.bondDollars);
    input.availableFrom = d.availableFrom || undefined;
    input.leaseTerm = d.leaseTerm.trim() || undefined;
    input.furnished = d.furnished;
  }
  return input;
}

// hydrate the form from an existing listing for edit mode
export function listingToDraft(l: Listing): Draft {
  const kind = categoryKind(l.category);
  const images = l.images && l.images.length > 0 ? l.images : l.imageUrl ? [l.imageUrl] : [];
  return {
    kind,
    category: l.category,
    title: l.title,
    description: l.description,
    priceDollars: (l.priceCents / 100).toString(),
    condition: l.condition,
    location: l.location,
    meetup: l.meetup,
    images,
    bedrooms: l.bedrooms !== undefined ? String(l.bedrooms) : "",
    bathrooms: l.bathrooms !== undefined ? String(l.bathrooms) : "",
    bondDollars: l.bondCents !== undefined ? (l.bondCents / 100).toString() : "",
    availableFrom: l.availableFrom ?? "",
    leaseTerm: l.leaseTerm ?? "",
    furnished: l.furnished ?? false,
  };
}
