import type { Listing } from "./Listing.ts";

// escrow lifecycle — transitions happen only in the service layer, state-checked
export type BookingStatus = "PENDING_PAYMENT" | "HELD" | "RELEASED" | "REFUNDED";

export type Booking = {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  pinchPaymentId: string;
  amountCents: number;
  status: BookingStatus;
  buyerConfirmedAt: string | null;
  sellerConfirmedAt: string | null;
  createdAt: string;
};

export type NewBooking = {
  listingId: string;
  buyerId: string;
  sellerId: string;
  pinchPaymentId: string;
  amountCents: number;
};

// booking enriched with its listing, for the buyer's purchases view
export type BookingView = Booking & { listing: Listing };
