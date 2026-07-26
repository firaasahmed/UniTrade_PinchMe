import { repo } from "../data/index.ts";
import { createRealtimePayment, createPaymentLink, getPayment } from "../pinch.ts";
import type { ListingRow } from "../../src/types/Listing.ts";
import type { User } from "../../src/types/User.ts";
import type { CheckoutResult } from "../../src/types/CheckoutResult.ts";
import type { DealRow } from "../../src/types/Deal.ts";
import { isPayable } from "../../src/types/Deal.ts";
import { NotFoundError, ValidationError, ForbiddenError } from "../lib/errors.ts";

export type CheckoutInput = {
  token: string;
  listingId: string;
  fullName?: string;
  email?: string;
  description?: string;
  // an accepted offer/quote — the agreed price wins over the list price
  dealId?: string;
};

// amount comes from the listing, never trusted from the client
// buyerId (when signed in) drives escrow: a money-moved outcome opens a HELD booking
export async function checkout(input: CheckoutInput, buyerId?: string): Promise<CheckoutResult> {
  const listing = repo.getListing(input.listingId);
  if (!listing) throw new NotFoundError("listing not found");

  // accommodation never takes a payment — it's inspection-only
  if (listing.category.toLowerCase() === "accommodation") {
    throw new ValidationError("accommodation is arranged by inspection, not payment");
  }

  // resolve the amount server-side: an accepted deal's price, else the list price
  let amountCents = listing.priceCents;
  let deal: DealRow | undefined;
  if (input.dealId) {
    deal = repo.getDeal(input.dealId);
    if (!deal) throw new NotFoundError("deal not found");
    if (deal.listingId !== listing.id) throw new ValidationError("deal is for a different listing");
    if (buyerId && deal.buyerId !== buyerId) throw new ForbiddenError("not your deal");
    if (!isPayable(deal)) throw new ValidationError("this deal isn't ready to pay");
    amountCents = deal.amountCents as number;
  }

  const result = await createRealtimePayment({
    token: input.token,
    amountCents,
    fullName: input.fullName,
    email: input.email,
    description: input.description ?? listing.title,
  });

  settle(result, listing.id, buyerId, amountCents, deal?.id);
  return result;
}

// everything that happens once pinch says the money moved, shared by both payment paths
function settle(
  result: CheckoutResult,
  listingId: string,
  buyerId: string | undefined,
  amountCents: number,
  dealId?: string,
): void {
  // success is decided only by the mapped outcome, never the http code
  const moneyMoved = result.outcome === "SUCCESS" || result.outcome === "SUCCESS_WITH_FLAG";
  const listing = repo.getListing(listingId);
  if (!moneyMoved || !buyerId || !listing || buyerId === listing.sellerId) return;
  // don't double-book if the payer refreshes the return url
  if (repo.getBookingByPayment(result.paymentId)) return;

  repo.createBooking({
    listingId: listing.id,
    buyerId,
    sellerId: listing.sellerId,
    pinchPaymentId: result.paymentId,
    amountCents,
  });
  // an agreed deal can only be paid once
  if (dealId) repo.markDealPaid(dealId);
  // take it off the market so it can't be double-sold, unless it never runs out
  if (!listing.unlimited) repo.updateListing(listing.id, { status: "sold" });
  // let the seller know their item sold
  const buyer = repo.getUser(buyerId);
  repo.createNotification({
    userId: listing.sellerId,
    type: "booking",
    payload: {
      listingId: listing.id,
      listingTitle: listing.title,
      buyerName: buyer?.name ?? "A student",
    },
  });
}

// hands the payer to pinch's hosted checkout page
export async function startHostedCheckout(
  user: User,
  listingId: string,
  dealId: string | undefined,
  origin: string,
): Promise<{ url: string }> {
  const { listing, amountCents, deal } = resolve(listingId, dealId, user.id);
  const back = new URLSearchParams({ listing: listing.id });
  if (deal) back.set("deal", deal.id);
  const { url } = await createPaymentLink({
    amountCents,
    description: listing.title,
    returnUrl: `${origin}/checkout/return?${back.toString()}`,
    payerName: user.name,
    payerEmail: user.email,
  });
  return { url };
}

// the payer is back from pinch: ask pinch what happened, then settle on that
export async function confirmHostedCheckout(
  user: User,
  listingId: string,
  dealId: string | undefined,
  paymentId: string,
): Promise<CheckoutResult> {
  const { amountCents, deal } = resolve(listingId, dealId, user.id);
  const result = await getPayment(paymentId);
  settle(result, listingId, user.id, amountCents, deal?.id);
  return result;
}

// the amount is always resolved server side, from the deal when there is one
function resolve(
  listingId: string,
  dealId: string | undefined,
  buyerId: string,
): { listing: ListingRow; amountCents: number; deal?: DealRow } {
  const listing = repo.getListing(listingId);
  if (!listing) throw new NotFoundError("listing not found");
  if (listing.category.toLowerCase() === "accommodation") {
    throw new ValidationError("accommodation is arranged by inspection, not payment");
  }
  if (!dealId) return { listing, amountCents: listing.priceCents };

  const deal = repo.getDeal(dealId);
  if (!deal) throw new NotFoundError("deal not found");
  if (deal.listingId !== listing.id) throw new ValidationError("deal is for a different listing");
  if (deal.buyerId !== buyerId) throw new ForbiddenError("not your deal");
  if (!isPayable(deal)) throw new ValidationError("this deal isn't ready to pay");
  return { listing, amountCents: deal.amountCents as number, deal };
}
