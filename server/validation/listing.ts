import type { NewListing, ListingPatch, ListingStatus } from "../../src/types/Listing.ts";
import { ValidationError } from "../lib/errors.ts";

function asRecord(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object") throw new ValidationError("request body must be an object");
  return body as Record<string, unknown>;
}

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function intCents(v: unknown): number | undefined {
  const n = num(v);
  return n !== undefined && Number.isInteger(n) && n >= 0 ? n : undefined;
}

// http(s), an inline data url from the browser resizer, or a bundled /listings path
function isImageSrc(v: string): boolean {
  return /^https?:\/\//i.test(v) || v.startsWith("data:image/") || v.startsWith("/");
}

// trimmed, non-empty image sources only; undefined when absent or not an array
function strArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter((x) => x !== "" && isImageSrc(x));
  return out.length ? out : undefined;
}

const STATUSES: ListingStatus[] = ["active", "draft", "sold", "removed"];

export function parseNewListing(body: unknown): NewListing {
  const b = asRecord(body);
  const errors: string[] = [];
  // drafts are lenient — only a title is required; published listings need the full set
  const isDraft = str(b.status)?.trim() === "draft";

  const title = str(b.title)?.trim();
  if (!title) errors.push("title is required");

  const rawPrice = num(b.priceCents);
  const priceProvided = rawPrice !== undefined;
  if (priceProvided && (!Number.isInteger(rawPrice) || rawPrice < 0)) {
    errors.push("priceCents must be a non-negative integer");
  }
  if (!isDraft && !priceProvided) errors.push("priceCents must be a non-negative integer");

  const category = str(b.category)?.trim();
  if (!isDraft && !category) errors.push("category is required");

  const location = str(b.location)?.trim();
  if (!isDraft && !location) errors.push("location is required");

  if (errors.length) throw new ValidationError(errors.join("; "));

  return {
    title: title as string,
    description: str(b.description)?.trim() ?? "",
    priceCents: priceProvided ? (rawPrice as number) : 0,
    rateUnit: str(b.rateUnit)?.trim() || undefined,
    category: category ?? "",
    condition: str(b.condition)?.trim() ?? "",
    location: location ?? "",
    lat: num(b.lat) ?? 0,
    lng: num(b.lng) ?? 0,
    meetup: str(b.meetup)?.trim() ?? "",
    imageUrl: str(b.imageUrl)?.trim() ?? "",
    images: strArray(b.images),
    unlimited: typeof b.unlimited === "boolean" ? b.unlimited : undefined,
    bedrooms: num(b.bedrooms),
    bathrooms: num(b.bathrooms),
    bondCents: intCents(b.bondCents),
    availableFrom: str(b.availableFrom)?.trim() || undefined,
    leaseTerm: str(b.leaseTerm)?.trim() || undefined,
    furnished: typeof b.furnished === "boolean" ? b.furnished : undefined,
    status: isDraft ? "draft" : undefined,
  };
}

export function parseListingPatch(body: unknown): ListingPatch {
  const b = asRecord(body);
  const patch: ListingPatch = {};
  const errors: string[] = [];

  if ("title" in b) {
    const title = str(b.title)?.trim();
    if (!title) errors.push("title cannot be empty");
    else patch.title = title;
  }
  if ("priceCents" in b) {
    const priceCents = num(b.priceCents);
    if (priceCents === undefined || !Number.isInteger(priceCents) || priceCents < 0) {
      errors.push("priceCents must be a non-negative integer");
    } else patch.priceCents = priceCents;
  }
  if ("rateUnit" in b) patch.rateUnit = str(b.rateUnit)?.trim() || undefined;
  if ("images" in b) patch.images = strArray(b.images);
  if ("category" in b) {
    const category = str(b.category)?.trim();
    if (!category) errors.push("category cannot be empty");
    else patch.category = category;
  }
  for (const key of ["description", "condition", "location", "meetup", "imageUrl"] as const) {
    if (key in b) {
      const v = str(b[key]);
      if (v === undefined) errors.push(`${key} must be a string`);
      else patch[key] = v.trim();
    }
  }
  if ("lat" in b) {
    const lat = num(b.lat);
    if (lat === undefined) errors.push("lat must be a number");
    else patch.lat = lat;
  }
  if ("lng" in b) {
    const lng = num(b.lng);
    if (lng === undefined) errors.push("lng must be a number");
    else patch.lng = lng;
  }
  if ("status" in b) {
    const status = str(b.status);
    if (!status || !STATUSES.includes(status as ListingStatus)) {
      errors.push(`status must be one of ${STATUSES.join(", ")}`);
    } else patch.status = status as ListingStatus;
  }

  // accommodation extras — editing a room has to be able to change these
  if ("bedrooms" in b) patch.bedrooms = num(b.bedrooms);
  if ("bathrooms" in b) patch.bathrooms = num(b.bathrooms);
  if ("bondCents" in b) patch.bondCents = intCents(b.bondCents);
  if ("availableFrom" in b) patch.availableFrom = str(b.availableFrom)?.trim() || undefined;
  if ("leaseTerm" in b) patch.leaseTerm = str(b.leaseTerm)?.trim() || undefined;
  if ("furnished" in b) patch.furnished = typeof b.furnished === "boolean" ? b.furnished : undefined;

  if (errors.length) throw new ValidationError(errors.join("; "));
  return patch;
}
