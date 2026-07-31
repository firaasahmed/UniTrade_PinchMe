import type { PublicUser } from "./User.ts";
import type { InspectionAvailability } from "./Inspection.ts";

export type ListingStatus = "active" | "draft" | "sold" | "removed";

export type TransitMode = "walk" | "bus" | "train" | "tram" | "ferry";

// how you actually get around from here — stated by the host, never computed by us
export type TransitLink = {
  mode: TransitMode;
  // what it gets you to, e.g. "Carlton tram stop" or "campus"
  to: string;
  minutes: number;
};

// the stored row — normalised, seller referenced by id
export type ListingRow = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  priceCents: number;
  // "week", "hr" etc for accommodation/services; absent = flat one-off price
  rateUnit?: string;
  category: string;
  condition: string;
  location: string;
  lat: number;
  lng: number;
  meetup: string;
  // primary/thumbnail image; gallery falls back to [imageUrl] when images is absent
  imageUrl: string;
  // ordered gallery for the detail carousel
  images?: string[];
  // never sells out: stays active after a purchase, so it can be bought again
  unlimited?: boolean;
  status: ListingStatus;
  // accommodation-specific, optional
  bedrooms?: number;
  bathrooms?: number;
  bondCents?: number;
  availableFrom?: string;
  // how long the lease runs, e.g. "6 months" — open string, presets in the UI
  leaseTerm?: string;
  furnished?: boolean;
  transit?: TransitLink[];
  inspectionAvailability?: InspectionAvailability;
  createdAt: string;
  updatedAt: string;
};

// the api/view shape — row enriched with the seller for display
export type Listing = ListingRow & { seller: PublicUser };

export type NewListing = {
  title: string;
  description: string;
  priceCents: number;
  rateUnit?: string;
  category: string;
  condition: string;
  location: string;
  lat: number;
  lng: number;
  meetup: string;
  imageUrl: string;
  images?: string[];
  unlimited?: boolean;
  bedrooms?: number;
  bathrooms?: number;
  bondCents?: number;
  availableFrom?: string;
  leaseTerm?: string;
  furnished?: boolean;
  transit?: TransitLink[];
  inspectionAvailability?: InspectionAvailability;
  // "active" (published) or "draft"; defaults to active when absent
  status?: Extract<ListingStatus, "active" | "draft">;
};

export type ListingPatch = Partial<Omit<NewListing, "status">> & { status?: ListingStatus };

// the ordered gallery for a listing — always at least one entry
export function listingImages(listing: Pick<ListingRow, "imageUrl" | "images">): string[] {
  if (listing.images && listing.images.length > 0) return listing.images;
  if (listing.imageUrl) return [listing.imageUrl];
  return [];
}

export type ListingFilter = {
  category?: string;
  universityId?: string;
  city?: string;
  sellerId?: string;
  status?: ListingStatus;
};
