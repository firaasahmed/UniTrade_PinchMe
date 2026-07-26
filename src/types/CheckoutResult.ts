import type { CheckoutOutcome } from "./PaymentStatus.ts";

// the /api/checkout contract, shared by server and frontend
export type CheckoutRequest = {
  token: string;
  listingId: string;
  fullName?: string;
  email?: string;
  description?: string;
  // an accepted offer/quote — the backend charges the agreed amount
  dealId?: string;
};

export type CheckoutResult = {
  outcome: CheckoutOutcome;
  paymentId: string;
  status: string;
  reason?: string;
};
