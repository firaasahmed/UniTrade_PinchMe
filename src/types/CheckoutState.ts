import type { PaymentStatus } from "./PaymentStatus";

// the checkout screen is exactly one of these at a time
// IDLE -> TOKENISING -> SUBMITTING -> (SUCCESS | SUCCESS_WITH_FLAG | PENDING | FAILED | UNKNOWN)
// FAILED -> (retry) -> SUBMITTING ; TOKENISING -> (card error) -> IDLE
export type CheckoutState =
  | { state: "IDLE"; fieldError?: string }
  | { state: "TOKENISING" }
  | { state: "SUBMITTING" }
  | { state: "SUCCESS"; paymentId: string; status: PaymentStatus }
  | { state: "SUCCESS_WITH_FLAG"; paymentId: string; status: PaymentStatus }
  | { state: "PENDING"; paymentId: string; status: PaymentStatus }
  | { state: "FAILED"; paymentId: string; status: PaymentStatus; reason: string }
  // status is the raw string pinch sent, since it's one we don't map
  | { state: "UNKNOWN"; paymentId: string; status: string };

export type CheckoutStateName = CheckoutState["state"];
