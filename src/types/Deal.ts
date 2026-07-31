import type { PublicUser } from "./User.ts";

// one negotiation entity covering all three journeys:
//   offer      item        buyer proposes a price, seller accepts -> checkout at that price
//   quote      service     provider proposes price + timing, buyer accepts -> checkout
//   inspection accommodation  buyer requests a viewing time, host confirms -> no payment
export type DealKind = "offer" | "quote" | "inspection";

export type DealStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "countered"
  | "withdrawn"
  | "completed";

export type DealRow = {
  id: string;
  // the anchor listing — messages and checkout hang off this one
  listingId: string;
  buyerId: string;
  sellerId: string;
  kind: DealKind;
  // absent for inspections — those never carry money
  amountCents?: number;
  // free-text timing for quotes and inspections, e.g. "Sat 2 Aug, 10am"
  scheduledFor?: string;
  note: string;
  // whose proposal is currently on the table
  proposedBy: string;
  status: DealStatus;
  // set once an accepted deal has been paid, so it can't be reused
  paidAt: string | null;
  // moving-out bundles: every listing covered by this one offer (includes the anchor).
  // absent for ordinary single-listing deals
  bundleListingIds?: string[];
  createdAt: string;
  updatedAt: string;
};

// what the viewing user may do with this deal — decided on the server, rendered as-is
export type DealActions = {
  // the proposal currently on the table is mine
  mine: boolean;
  canAccept: boolean;
  canDecline: boolean;
  canWithdraw: boolean;
  canCounter: boolean;
  canRevise: boolean;
  canPay: boolean;
  // paid deals are settled money — the amount stops moving
  locked: boolean;
};

// enough of each bundled listing to render the offer without extra fetches
export type BundleItem = {
  id: string;
  title: string;
  priceCents: number;
  imageUrl: string;
};

export type DealView = DealRow & {
  buyer: PublicUser;
  seller: PublicUser;
  actions: DealActions;
  // resolved from bundleListingIds so the client can show what's in the bundle
  bundleListings?: BundleItem[];
};

export type NewDeal = {
  listingId: string;
  kind: DealKind;
  amountCents?: number;
  scheduledFor?: string;
  note: string;
  bundleListingIds?: string[];
};

// only an accepted, unpaid deal with an amount can drive a payment
export function isPayable(deal: DealRow): boolean {
  return deal.status === "accepted" && deal.paidAt === null && deal.amountCents !== undefined;
}

// still on the table: either side can still move the number until the money lands
export function isLive(deal: DealRow): boolean {
  return deal.status === "pending" || (deal.status === "accepted" && deal.paidAt === null);
}
