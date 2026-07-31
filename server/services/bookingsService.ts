import { repo } from "../data/index.ts";
import type { BookingView } from "../../src/types/Booking.ts";
import type { User } from "../../src/types/User.ts";
import { getListingView } from "./listingsService.ts";
import { systemClock } from "../lib/clock.ts";
import { createRefund } from "../payments/index.ts";
import { NotFoundError, ForbiddenError, ValidationError } from "../lib/errors.ts";

function enrich(listingId: string): BookingView["listing"] | null {
  return repo.getListing(listingId) ? getListingView(listingId) : null;
}

// the buyer's purchases, newest first, each carrying its listing
export function listPurchases(buyerId: string): BookingView[] {
  return repo
    .getBookingsForBuyer(buyerId)
    .map((b) => {
      const listing = enrich(b.listingId);
      return listing ? { ...b, listing } : null;
    })
    .filter((x): x is BookingView => x !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// buyer pulls out before confirming: refund through pinch, then put the item back up
export async function refundBooking(user: User, bookingId: string): Promise<BookingView> {
  const booking = repo.getBooking(bookingId);
  if (!booking) throw new NotFoundError("booking not found");
  if (booking.buyerId !== user.id) throw new ForbiddenError("not your purchase");
  if (booking.status !== "HELD") throw new ValidationError("only held payments can be refunded");

  await createRefund(booking.pinchPaymentId, booking.amountCents, "Buyer cancelled before handover");

  const updated = repo.updateBookingStatus(bookingId, "REFUNDED", systemClock());
  if (!updated) throw new NotFoundError("booking not found");

  // the item goes back on the market so someone else can buy it
  const listing = repo.getListing(booking.listingId);
  if (listing && listing.status === "sold") {
    repo.updateListing(listing.id, { status: "active" });
  }
  repo.createNotification({
    userId: booking.sellerId,
    type: "booking",
    payload: {
      listingId: booking.listingId,
      listingTitle: listing?.title ?? "",
      buyerName: user.name,
    },
  });

  return { ...updated, listing: getListingView(updated.listingId) };
}

// buyer releases escrow to the seller — HELD -> RELEASED, state-checked
export function confirmReceived(user: User, bookingId: string): BookingView {
  const booking = repo.getBooking(bookingId);
  if (!booking) throw new NotFoundError("booking not found");
  if (booking.buyerId !== user.id) throw new ForbiddenError("not your purchase");
  if (booking.status !== "HELD") throw new ValidationError("only held payments can be released");

  const updated = repo.updateBookingStatus(bookingId, "RELEASED", systemClock());
  if (!updated) throw new NotFoundError("booking not found");
  return { ...updated, listing: getListingView(updated.listingId) };
}
