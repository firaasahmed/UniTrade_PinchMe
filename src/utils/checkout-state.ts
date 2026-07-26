import type { CheckoutState } from "@/types/CheckoutState";
import type { CheckoutResult } from "@/types/CheckoutResult";
import type { PaymentStatus } from "@/types/PaymentStatus";

// map the server's resolved outcome onto exactly one frontend terminal state
export function resultToState(r: CheckoutResult): CheckoutState {
  switch (r.outcome) {
    case "SUCCESS":
      return { state: "SUCCESS", paymentId: r.paymentId, status: r.status as PaymentStatus };
    case "SUCCESS_WITH_FLAG":
      return { state: "SUCCESS_WITH_FLAG", paymentId: r.paymentId, status: r.status as PaymentStatus };
    case "PENDING":
      return { state: "PENDING", paymentId: r.paymentId, status: r.status as PaymentStatus };
    case "FAILED":
      return {
        state: "FAILED",
        paymentId: r.paymentId,
        status: r.status as PaymentStatus,
        reason: r.reason ?? "payment failed",
      };
    case "UNKNOWN":
      return { state: "UNKNOWN", paymentId: r.paymentId, status: r.status };
  }
}
