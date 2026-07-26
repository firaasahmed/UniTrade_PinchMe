import { repo } from "../data/index.ts";
import type { DealRow, DealView, DealActions, NewDeal, DealKind } from "../../src/types/Deal.ts";
import { isLive, isPayable } from "../../src/types/Deal.ts";
import type { User } from "../../src/types/User.ts";
import { publicUser } from "./listingsService.ts";
import { NotFoundError, ForbiddenError, ValidationError } from "../lib/errors.ts";

// which deal kind a listing accepts — one journey per listing kind
// mirrors categoryKind on the client; kept local so the server stays free of ui deps
export function dealKindForCategory(category: string): DealKind {
  const c = category.toLowerCase();
  if (c === "accommodation") return "inspection";
  if (c === "services") return "quote";
  return "offer";
}

// the whole rulebook, in one place — the client renders these, it never re-derives them
export function actionsFor(deal: DealRow, userId: string): DealActions {
  const party = deal.buyerId === userId || deal.sellerId === userId;
  const mine = deal.proposedBy === userId;
  const live = party && isLive(deal);
  const pending = live && deal.status === "pending";
  // inspections carry no amount, so there is nothing to haggle over
  const money = deal.kind !== "inspection";
  return {
    mine,
    canAccept: pending && !mine,
    canDecline: pending && !mine,
    canWithdraw: live && mine,
    canCounter: live && !mine && money,
    canRevise: live && mine && money,
    canPay: party && deal.buyerId === userId && isPayable(deal),
    locked: deal.paidAt !== null,
  };
}

const article = (kind: DealKind): string => (kind === "offer" || kind === "inspection" ? `an ${kind}` : `a ${kind}`);

function view(row: DealRow, userId: string): DealView {
  return {
    ...row,
    buyer: publicUser(row.buyerId),
    seller: publicUser(row.sellerId),
    actions: actionsFor(row, userId),
  };
}

function assertParty(deal: DealRow, user: User): void {
  if (deal.buyerId !== user.id && deal.sellerId !== user.id) {
    throw new ForbiddenError("not your deal");
  }
}

// the party who must respond to a pending proposal is whoever didn't propose it
function counterparty(deal: DealRow): string {
  return deal.proposedBy === deal.buyerId ? deal.sellerId : deal.buyerId;
}

// human line dropped into the thread whenever a proposal is made
function describe(deal: DealRow, note: string): string {
  const money = deal.amountCents !== undefined ? `$${(deal.amountCents / 100).toFixed(2)}` : "";
  const head =
    deal.kind === "inspection"
      ? `Requested an inspection for ${deal.scheduledFor ?? "a time that suits"}`
      : deal.kind === "quote"
        ? `Sent a quote: ${money}${deal.scheduledFor ? ` for ${deal.scheduledFor}` : ""}`
        : `Offered ${money}`;
  return note ? `${head}. ${note}` : head;
}

export function listForThread(user: User, listingId: string, otherUserId: string): DealView[] {
  const listing = repo.getListing(listingId);
  if (!listing) return [];
  const buyerId = listing.sellerId === user.id ? otherUserId : user.id;
  const sellerId = listing.sellerId;
  if (user.id !== buyerId && user.id !== sellerId) throw new ForbiddenError("not your thread");
  return repo.getDealsForThread(listingId, buyerId, sellerId).map((d) => view(d, user.id));
}

export function listForUser(userId: string): DealView[] {
  return repo.getDealsForUser(userId).map((d) => view(d, userId));
}

export function createDeal(user: User, input: NewDeal): DealView {
  const listing = repo.getListing(input.listingId);
  if (!listing) throw new NotFoundError("listing not found");

  const expected = dealKindForCategory(listing.category);
  if (input.kind !== expected) {
    throw new ValidationError(`this listing takes ${article(expected)}, not ${article(input.kind)}`);
  }

  const isSeller = listing.sellerId === user.id;
  // quotes come from the provider, offers and inspections come from the buyer
  if (input.kind === "quote" && !isSeller) {
    throw new ForbiddenError("only the provider can send a quote");
  }
  if (input.kind !== "quote" && isSeller) {
    throw new ForbiddenError("you can't do this on your own listing");
  }

  if (input.kind === "inspection") {
    if (input.amountCents !== undefined) throw new ValidationError("inspections don't take a payment");
    if (!input.scheduledFor?.trim()) throw new ValidationError("suggest a time for the inspection");
  } else {
    if (input.amountCents === undefined || !Number.isInteger(input.amountCents) || input.amountCents <= 0) {
      throw new ValidationError("amountCents must be a positive integer");
    }
  }

  // a quote needs the buyer it's addressed to; offers/inspections come from the buyer themselves
  const buyerId = isSeller ? requireQuoteRecipient(input) : user.id;
  if (isSeller && !repo.getUser(buyerId)) throw new NotFoundError("recipient not found");

  // one live deal per thread — a fresh proposal replaces whatever was on the table
  supersedeLive(input.listingId, buyerId, listing.sellerId);
  const row = repo.createDeal(buyerId, listing.sellerId, user.id, input);

  // a proposal opens (or continues) the conversation so it's visible in messages
  repo.createMessage({
    listingId: listing.id,
    senderId: user.id,
    recipientId: counterparty(row),
    body: describe(row, input.note),
  });

  repo.createNotification({
    userId: counterparty(row),
    type: "message",
    payload: {
      listingId: listing.id,
      listingTitle: listing.title,
      fromId: user.id,
      fromName: user.name,
      preview:
        input.kind === "inspection"
          ? `Inspection requested for ${input.scheduledFor ?? ""}`
          : `${input.kind === "quote" ? "Quote" : "Offer"}: $${((input.amountCents ?? 0) / 100).toFixed(2)}`,
    },
  });

  return view(row, user.id);
}

// closes anything still open in a thread, so two accepted deals can never both be payable
function supersedeLive(listingId: string, buyerId: string, sellerId: string): void {
  for (const d of repo.getDealsForThread(listingId, buyerId, sellerId)) {
    if (isLive(d)) repo.updateDealStatus(d.id, "countered");
  }
}

// quotes carry their recipient on the input; typed loosely at the edge then checked
function requireQuoteRecipient(input: NewDeal & { buyerId?: string }): string {
  if (!input.buyerId) throw new ValidationError("buyerId is required to send a quote");
  return input.buyerId;
}

function transition(user: User, id: string, next: "accepted" | "declined" | "withdrawn"): DealView {
  const deal = repo.getDeal(id);
  if (!deal) throw new NotFoundError("deal not found");
  assertParty(deal, user);

  const can = actionsFor(deal, user.id);
  const allowed =
    next === "accepted" ? can.canAccept : next === "declined" ? can.canDecline : can.canWithdraw;
  if (!allowed) throw new ValidationError(refusal(deal, user.id));

  const updated = repo.updateDealStatus(id, next);
  if (!updated) throw new NotFoundError("deal not found");

  const listing = repo.getListing(deal.listingId);
  repo.createNotification({
    userId: next === "withdrawn" ? counterparty(deal) : deal.proposedBy,
    type: "message",
    payload: {
      listingId: deal.listingId,
      listingTitle: listing?.title ?? "",
      fromId: user.id,
      fromName: user.name,
      preview: `${deal.kind} ${next}`,
    },
  });

  return view(updated, user.id);
}

// one explanation for every refusal, so the client never has to guess why
function refusal(deal: DealRow, userId: string): string {
  if (deal.paidAt !== null) return `this ${deal.kind} is paid for — the amount is locked in`;
  if (!isLive(deal)) return `this ${deal.kind} is already ${deal.status}`;
  if (deal.status === "accepted") return `this ${deal.kind} is already agreed`;
  return deal.proposedBy === userId ? "wait for the other party to respond" : "that one isn't yours to change";
}

export const acceptDeal = (user: User, id: string) => transition(user, id, "accepted");
export const declineDeal = (user: User, id: string) => transition(user, id, "declined");
export const withdrawDeal = (user: User, id: string) => transition(user, id, "withdrawn");

// both re-pricing paths are the same move: close the proposal on the table, open a new one.
// countering answers the other side; revising changes your own — including after it was
// agreed, right up until the money lands
function supersede(
  user: User,
  id: string,
  amountCents: number | undefined,
  scheduledFor: string | undefined,
  note: string,
  as: "counter" | "revise",
): DealView {
  const deal = repo.getDeal(id);
  if (!deal) throw new NotFoundError("deal not found");
  assertParty(deal, user);

  const can = actionsFor(deal, user.id);
  if (!(as === "counter" ? can.canCounter : can.canRevise)) throw new ValidationError(refusal(deal, user.id));

  if (deal.kind === "inspection") {
    if (!scheduledFor?.trim()) throw new ValidationError("suggest a time");
  } else if (amountCents === undefined || !Number.isInteger(amountCents) || amountCents <= 0) {
    throw new ValidationError("amountCents must be a positive integer");
  }

  supersedeLive(deal.listingId, deal.buyerId, deal.sellerId);
  const row = repo.createDeal(deal.buyerId, deal.sellerId, user.id, {
    listingId: deal.listingId,
    kind: deal.kind,
    amountCents: deal.kind === "inspection" ? undefined : amountCents,
    scheduledFor,
    note,
  });

  const lead = as === "counter" ? "Countered" : deal.status === "accepted" ? "Reopened" : "Updated";
  const listing = repo.getListing(deal.listingId);
  repo.createMessage({
    listingId: deal.listingId,
    senderId: user.id,
    recipientId: counterparty(row),
    body: `${lead} — ${describe(row, note)}`,
  });
  repo.createNotification({
    userId: counterparty(row),
    type: "message",
    payload: {
      listingId: deal.listingId,
      listingTitle: listing?.title ?? "",
      fromId: user.id,
      fromName: user.name,
      preview: `${lead}: ${deal.kind === "inspection" ? (scheduledFor ?? "") : `$${((amountCents ?? 0) / 100).toFixed(2)}`}`,
    },
  });

  return view(row, user.id);
}

export const counterDeal = (
  user: User,
  id: string,
  amountCents: number | undefined,
  scheduledFor: string | undefined,
  note: string,
) => supersede(user, id, amountCents, scheduledFor, note, "counter");

export const reviseDeal = (
  user: User,
  id: string,
  amountCents: number | undefined,
  scheduledFor: string | undefined,
  note: string,
) => supersede(user, id, amountCents, scheduledFor, note, "revise");
