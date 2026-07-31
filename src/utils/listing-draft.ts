import type { NewListing, Listing } from "@/types/Listing";
import type { PlaceRef } from "@/types/Place";
import { DEFAULT_HORIZON_DAYS } from "@/types/Inspection";
import { EMPTY_INSPECTION, type InspectionDraft } from "@/ui/create/InspectionAvailabilityField";
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
  // the public suburb, derived from place once one is picked
  location: string;
  // the resolved address; null until the host picks one from the dropdown
  place: PlaceRef | null;
  meetup: string;
  images: string[];
  bedrooms: string;
  bathrooms: string;
  bondDollars: string;
  availableFrom: string;
  leaseTerm: string;
  furnished: boolean;
  // drives the buyer's inspection calendar — accommodation only
  inspection: InspectionDraft;
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
  place: null,
  meetup: "",
  images: [],
  bedrooms: "",
  bathrooms: "",
  bondDollars: "",
  availableFrom: "",
  leaseTerm: "",
  furnished: false,
  inspection: EMPTY_INSPECTION,
};

// input length caps mirror the backend's tolerances
export const LIMITS = { title: 120, description: 1000, location: 120, meetup: 160 };

export type StepId = "details" | "place" | "inspection" | "review";

// only accommodation takes bookable inspections, so it gets the extra step
export function stepsFor(kind: ListingKind): StepId[] {
  if (kind === "accommodation") return ["details", "place", "inspection", "review"];
  return ["details", "place", "review"];
}

// per-step required-field validity. condition only required for items
export function stepValidity(d: Draft): Record<StepId, boolean> {
  const isItem = d.kind === "item";
  const details =
    d.category.trim() !== "" && d.title.trim() !== "" && d.description.trim() !== "";
  const place =
    toCents(d.priceDollars) !== undefined &&
    d.location.trim() !== "" &&
    (!isItem || d.condition.trim() !== "");
  return {
    details,
    place,
    // every field here is optional
    inspection: true,
    review: details && place,
  };
}

// which required fields are missing on a given step, for inline error marks
export function missingFields(d: Draft, step: StepId): Set<string> {
  const miss = new Set<string>();
  if (step === "details") {
    if (d.category.trim() === "") miss.add("category");
    if (d.title.trim() === "") miss.add("title");
    if (d.description.trim() === "") miss.add("description");
  }
  if (step === "place") {
    if (toCents(d.priceDollars) === undefined) miss.add("price");
    if (d.location.trim() === "") miss.add("location");
    if (d.kind === "item" && d.condition.trim() === "") miss.add("condition");
  }
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
    // real coordinates from the picked address; editing keeps whatever the listing had
    lat: d.place?.lat ?? 0,
    lng: d.place?.lng ?? 0,
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
    input.inspectionAvailability = {
      ...d.inspection,
      horizonDays: DEFAULT_HORIZON_DAYS,
      blackout: [],
    };
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
    // keep the point the listing already has, or edits would zero it out
    place:
      l.lat !== 0 || l.lng !== 0
        ? { formatted: l.location, lat: l.lat, lng: l.lng, precision: "pin", source: "existing" }
        : null,
    meetup: l.meetup,
    images,
    bedrooms: l.bedrooms !== undefined ? String(l.bedrooms) : "",
    bathrooms: l.bathrooms !== undefined ? String(l.bathrooms) : "",
    bondDollars: l.bondCents !== undefined ? (l.bondCents / 100).toString() : "",
    availableFrom: l.availableFrom ?? "",
    leaseTerm: l.leaseTerm ?? "",
    furnished: l.furnished ?? false,
    inspection: l.inspectionAvailability
      ? {
          weekdays: l.inspectionAvailability.weekdays,
          times: l.inspectionAvailability.times,
          acceptsRequests: l.inspectionAvailability.acceptsRequests,
        }
      : EMPTY_INSPECTION,
  };
}
