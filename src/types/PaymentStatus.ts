// pinch payment statuses, verbatim from docs.getpinch.com.au/docs/payment-statuses (v2020.1)
export type PaymentStatus =
  | "approved"
  | "settled"
  | "processing"
  | "scheduled"
  | "pending-action"
  | "dishonoured"
  | "cancelled"
  | "returned-without-settlement"
  | "cleared-settlements-disabled"
  | "cleared-pending-dispute"
  // returned by GET /payments once funds have moved to the merchant
  | "transferred";

// terminal states the checkout resolves to
export type CheckoutOutcome =
  | "SUCCESS"
  | "SUCCESS_WITH_FLAG"
  | "PENDING"
  | "FAILED"
  | "UNKNOWN";

const STATUS_TO_OUTCOME: Record<PaymentStatus, CheckoutOutcome> = {
  approved: "SUCCESS",
  settled: "SUCCESS",
  transferred: "SUCCESS",
  processing: "PENDING",
  scheduled: "PENDING",
  "pending-action": "PENDING",
  dishonoured: "FAILED",
  cancelled: "FAILED",
  "returned-without-settlement": "FAILED",
  "cleared-settlements-disabled": "SUCCESS_WITH_FLAG",
  "cleared-pending-dispute": "SUCCESS_WITH_FLAG",
};

// any status pinch returns that we don't know maps to UNKNOWN, never a default success
export function outcomeForStatus(status: string): CheckoutOutcome {
  if (status in STATUS_TO_OUTCOME) {
    return STATUS_TO_OUTCOME[status as PaymentStatus];
  }
  return "UNKNOWN";
}
