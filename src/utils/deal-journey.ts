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
    // the buyer books at the listed rate, the same shape as booking an inspection.
    // the provider can still counter with a different price
    openedBy: "buyer",
    cta: "Book a session",
    ctaHint: "Pick a time and they'll confirm or come back with a price",
    dialogTitle: "Book a session",
    amountLabel: "Agreed total ($)",
    timeLabel: "When do you need them?",
    acceptedLabel: "Session confirmed. Pay to book it in",
    paysOnAccept: true,
    steps: ["Pick a time", "Provider confirms", "Pay securely", "Marked complete"],
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
