import type { DealKind } from "@/types/Deal";
import type { ListingKind } from "@/utils/categories";

// the transaction rules for each listing kind, in one place
export type Journey = {
  deal: DealKind;
  // who opens the conversation with a proposal
  openedBy: "buyer" | "seller";
  cta: string;
  ctaHint: string;
  dialogTitle: string;
  amountLabel: string | null;
  timeLabel: string | null;
  acceptedLabel: string;
  // accommodation never reaches checkout
  paysOnAccept: boolean;
  steps: string[];
};

export const JOURNEYS: Record<ListingKind, Journey> = {
  item: {
    deal: "offer",
    openedBy: "buyer",
    cta: "Make an offer",
    ctaHint: "Name your price, the seller can accept or counter",
    dialogTitle: "Make an offer",
    amountLabel: "Your offer ($)",
    timeLabel: null,
    acceptedLabel: "Offer accepted. Pay to lock it in",
    paysOnAccept: true,
    steps: ["Message the seller", "Agree a price", "Pay securely", "Meet up & confirm"],
  },
  service: {
    deal: "quote",
    openedBy: "seller",
    cta: "Request a quote",
    ctaHint: "Tell them what you need and they'll send back a price and a time",
    dialogTitle: "Send a quote",
    amountLabel: "Quote total ($)",
    timeLabel: "When",
    acceptedLabel: "Quote accepted. Pay to book",
    paysOnAccept: true,
    steps: ["Describe the job", "Provider sends a quote", "Pay securely", "Marked complete"],
  },
  accommodation: {
    deal: "inspection",
    openedBy: "buyer",
    cta: "Book an inspection",
    ctaHint: "",
    dialogTitle: "Request an inspection",
    amountLabel: null,
    timeLabel: "Preferred time",
    acceptedLabel: "Inspection confirmed",
    paysOnAccept: false,
    steps: ["Enquire", "Request a viewing", "Host confirms", "Arrange the lease directly"],
  },
};

export function journeyFor(kind: ListingKind): Journey {
  return JOURNEYS[kind];
}
