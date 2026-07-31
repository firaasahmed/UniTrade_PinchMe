import { outcomeForStatus } from "../../src/types/PaymentStatus.ts";
import type { CheckoutResult } from "../../src/types/CheckoutResult.ts";
import { pinchFetch, pinchOk, describeErrors, type PinchBody } from "./client.ts";

// what we attach to every payment so a pinch record can be traced back to a deal
export type PaymentMetadata = {
  listingId: string;
  dealId?: string;
  buyerId?: string;
};

// the dishonour code lives at top-level dishonourType, or on the first attempt
function dishonourCode(body: PinchBody): string | undefined {
  const top = body["dishonourType"];
  if (typeof top === "string" && top) return top;

  const attempts = body["attempts"];
  if (Array.isArray(attempts) && attempts.length > 0) {
    const dishonour = (attempts[0] as PinchBody | undefined)?.["dishonour"];
    if (dishonour && typeof dishonour === "object") {
      const type = (dishonour as PinchBody)["type"];
      if (typeof type === "string" && type) return type;
    }
  }
  return undefined;
}

// human readable failure reason, e.g. "insufficient funds", else fall back to status
function reasonFrom(body: PinchBody, status: string): string {
  const code = dishonourCode(body);
  return code ? code.replace(/-/g, " ") : status;
}

// the single place a pinch payment body becomes one of our five outcomes.
// success is read from the status field only — a 201 can carry "dishonoured"
export function resultFrom(body: PinchBody, fallbackId = ""): CheckoutResult {
  const status = body["status"];
  if (typeof status !== "string") {
    throw new Error(`pinch returned a payment with no status: ${describeErrors(body)}`);
  }
  const id = body["id"];
  const outcome = outcomeForStatus(status);
  const needsReason = outcome === "FAILED" || outcome === "UNKNOWN";
  return {
    outcome,
    paymentId: typeof id === "string" && id ? id : fallbackId,
    status,
    reason: needsReason ? reasonFrom(body, status) : undefined,
  };
}

function assertCents(amountCents: number, what: string): void {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error(`${what} must be a positive integer in cents, got ${amountCents}`);
  }
}

export type RealtimePaymentInput = {
  token: string;
  amountCents: number;
  nonce: string;
  metadata: PaymentMetadata;
  // the seller's managed merchant. the payment belongs to them, not to us
  onBehalfOf: string;
  // the payer record under that merchant. names are NOT sent alongside — pinch
  // rejects the pair once the payer exists
  payerId: string;
  // our cut, in cents, taken out of the settlement to that merchant
  applicationFeeCents?: number;
  description?: string;
};

export async function createRealtimePayment(input: RealtimePaymentInput): Promise<CheckoutResult> {
  assertCents(input.amountCents, "amount");
  const fee = input.applicationFeeCents ?? 0;
  if (!Number.isInteger(fee) || fee < 0) {
    throw new Error(`application fee must be a whole number of cents, got ${fee}`);
  }
  // a fee that swallows the sale would leave the seller with nothing
  if (fee >= input.amountCents) {
    throw new Error(`application fee ${fee} must be less than the amount ${input.amountCents}`);
  }

  const { body } = await pinchFetch("/payments/realtime", {
    method: "POST",
    onBehalfOf: input.onBehalfOf,
    body: {
      token: input.token,
      payerId: input.payerId,
      amount: input.amountCents,
      applicationFee: fee > 0 ? fee : undefined,
      description: input.description,
      nonce: [input.nonce],
      // a json STRING — pinch rejects an object or an array of objects
      metadata: JSON.stringify(input.metadata),
    },
  });

  return resultFrom(body);
}

// asks pinch whether this nonce already produced a charge. the answer is how we
// recover from a request that failed before we learned its outcome
export async function findByNonce(nonce: string, onBehalfOf?: string): Promise<CheckoutResult | null> {
  const body = await pinchOk("/payments/nonce", { method: "POST", body: { nonce }, onBehalfOf });
  if (body["isNonceReplay"] !== true) return null;
  const data = body["data"];
  if (!data || typeof data !== "object") return null;
  return resultFrom(data as PinchBody);
}

// a sub-merchant's payment is invisible to the parent, so the lookup needs their header
export async function getPayment(paymentId: string, onBehalfOf?: string): Promise<CheckoutResult> {
  const body = await pinchOk(`/payments/${paymentId}`, { method: "GET", onBehalfOf });
  return resultFrom(body, paymentId);
}

export type PayerInput = {
  name: string;
  email: string;
  // pass the id we already hold and pinch updates that record instead of minting another
  existingId?: string;
  // a payer belongs to one merchant, so the seller's merchant scopes the record
  onBehalfOf?: string;
};

// upsert, not insert. without the id every checkout created a fresh pyr_… for the
// same student, which scatters their history across duplicate records
export async function savePayer(input: PayerInput): Promise<string> {
  const [firstName, ...rest] = input.name.trim().split(" ");
  const body = await pinchOk("/payers", {
    method: "POST",
    onBehalfOf: input.onBehalfOf,
    body: {
      id: input.existingId,
      firstName: firstName || "Student",
      lastName: rest.join(" ") || undefined,
      emailAddress: input.email,
    },
  });
  const id = body["id"];
  if (typeof id !== "string" || !id) throw new Error("pinch did not return a payer id");
  return id;
}

export type PaymentLinkInput = {
  amountCents: number;
  description: string;
  returnUrl: string;
  payerId: string;
  metadata: PaymentMetadata;
  // the seller's merchant, so the hosted payment belongs to them too
  onBehalfOf?: string;
};

// hosted checkout: pinch renders the page, we get the payer back on returnUrl
export async function createPaymentLink(input: PaymentLinkInput): Promise<{ id: string; url: string }> {
  assertCents(input.amountCents, "amount");

  const payerId = input.payerId;
  const body = await pinchOk("/payment-links", {
    method: "POST",
    onBehalfOf: input.onBehalfOf,
    body: {
      amount: input.amountCents,
      payerId,
      description: input.description,
      allowedPaymentMethods: ["credit-card"],
      returnUrl: input.returnUrl,
      // a json STRING — pinch rejects an object or an array of objects
      metadata: JSON.stringify(input.metadata),
    },
  });

  const url = body["url"];
  if (typeof url !== "string" || !url) throw new Error("pinch did not return a payment link url");
  const id = body["id"];
  return { id: typeof id === "string" ? id : "", url };
}

export async function createRefund(
  paymentId: string,
  amountCents: number,
  reason: string,
): Promise<{ id: string; status: string }> {
  assertCents(amountCents, "refund amount");
  const body = await pinchOk("/refunds", {
    method: "POST",
    body: { paymentId, amount: amountCents, reason },
  });
  return {
    id: typeof body["id"] === "string" ? body["id"] : "",
    status: typeof body["status"] === "string" ? body["status"] : "requested",
  };
}

export type SourceType = "credit-card" | "bank-account";

export type FeeQuote = {
  sourceType: SourceType;
  // what the buyer pays
  amountCents: number;
  // pinch's processing fee, deducted from what the seller receives
  feeCents: number;
  // what actually lands in the seller's account
  netCents: number;
};

// pinch nests the numbers under `fees`, with netAmount alongside — verified against
// the sandbox, not guessed
function readQuote(body: PinchBody, sourceType: SourceType, amountCents: number): FeeQuote | null {
  const fees = body["fees"];
  const total = fees && typeof fees === "object" ? (fees as PinchBody)["totalFee"] : undefined;
  const net = body["netAmount"];
  if (typeof total !== "number" || typeof net !== "number") return null;
  return { sourceType, amountCents, feeCents: total, netCents: net };
}

// what each rail actually costs, so a seller can see it before choosing.
// disclosure only — we never add a surcharge
export async function quoteFees(amountCents: number): Promise<FeeQuote[]> {
  assertCents(amountCents, "amount");
  const quotes: FeeQuote[] = [];
  for (const sourceType of ["credit-card", "bank-account"] as const) {
    try {
      const body = await pinchOk("/fees/calculate", {
        method: "POST",
        body: { amount: amountCents, sourceType },
      });
      const quote = readQuote(body, sourceType, amountCents);
      if (quote) quotes.push(quote);
    } catch {
      // a rail we can't quote simply isn't offered a figure
    }
  }
  return quotes;
}
