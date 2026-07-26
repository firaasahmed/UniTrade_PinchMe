import { outcomeForStatus } from "../src/types/PaymentStatus.ts";
import type { CheckoutResult } from "../src/types/CheckoutResult.ts";

const AUTH_URL = "https://auth.getpinch.com.au/connect/token";
const BASE = process.env.PINCH_BASE ?? "https://api.getpinch.com.au/test";
const VERSION = "2020.1";

const APP_ID = process.env.PINCH_APP_ID ?? "";
const SECRET = process.env.PINCH_SECRET ?? "";

type CachedToken = { token: string; expiresAt: number };
let cached: CachedToken | null = null;

async function getToken(): Promise<string> {
  const now = Date.now();
  // reuse til 60s before expiry
  if (cached && now < cached.expiresAt - 60_000) {
    return cached.token;
  }

  const basic = Buffer.from(`${APP_ID}:${SECRET}`).toString("base64");
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      // form-encoded or pinch rejects it
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=api1",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`pinch auth failed (${res.status}): ${detail}`);
  }

  const body = (await res.json()) as { access_token: string; expires_in: number };
  cached = {
    token: body.access_token,
    expiresAt: now + body.expires_in * 1000,
  };
  return cached.token;
}

export function hasCredentials(): boolean {
  return APP_ID !== "" && SECRET !== "";
}

// fetch a token so a broken sandbox/auth surfaces at boot, not mid-demo
export async function verifyCredentials(): Promise<void> {
  await getToken();
}

export type RealtimePaymentInput = {
  token: string;
  amountCents: number;
  fullName?: string;
  email?: string;
  description?: string;
};

// the dishonour code lives at top-level dishonourType, or on the first attempt
function dishonourCode(body: Record<string, unknown>): string | undefined {
  const top = body["dishonourType"];
  if (typeof top === "string" && top) return top;

  const attempts = body["attempts"];
  if (Array.isArray(attempts) && attempts.length > 0) {
    const dishonour = (attempts[0] as Record<string, unknown> | undefined)?.["dishonour"];
    if (dishonour && typeof dishonour === "object") {
      const type = (dishonour as Record<string, unknown>)["type"];
      if (typeof type === "string" && type) return type;
    }
  }
  return undefined;
}

// human readable failure reason, e.g. "insufficient funds", else fall back to status
function reasonFrom(body: Record<string, unknown>, status: string): string {
  const code = dishonourCode(body);
  return code ? code.replace(/-/g, " ") : status;
}

// pinch 400s come back as a json array of error objects (sometimes wrapped in { errors: [...] })
// field names vary, so try the common ones and dump the raw element rather than ever showing [object Object]
function extractPinchErrors(raw: unknown): string {
  const arr: unknown[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { errors?: unknown }).errors)
      ? (raw as { errors: unknown[] }).errors
      : [raw];

  return arr
    .map((e) => {
      if (typeof e === "string") return e;
      if (e && typeof e === "object") {
        const o = e as Record<string, unknown>;
        const msg =
          o["message"] ?? o["errorMessage"] ?? o["error"] ?? o["detail"] ?? o["description"];
        const field = o["field"] ?? o["propertyName"];
        if (typeof msg === "string") {
          return typeof field === "string" ? `${field}: ${msg}` : msg;
        }
        return JSON.stringify(e);
      }
      return JSON.stringify(e);
    })
    .join("; ");
}

async function pinchFetch(
  path: string,
  init: { method: string; body?: unknown },
): Promise<Record<string, unknown>> {
  const token = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "pinch-version": VERSION,
      "Content-Type": "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  const raw: unknown = await res.json().catch(() => null);
  if (Array.isArray(raw)) {
    throw new Error(`pinch rejected ${path} (${res.status}): ${extractPinchErrors(raw)}`);
  }
  if (!raw || typeof raw !== "object") {
    throw new Error(`pinch returned no body for ${path} (${res.status})`);
  }
  if (!res.ok) {
    throw new Error(`pinch rejected ${path} (${res.status}): ${extractPinchErrors(raw)}`);
  }
  return raw as Record<string, unknown>;
}

// payment links need a payer on file first
async function savePayer(name: string, email: string): Promise<string> {
  const [firstName, ...rest] = name.trim().split(" ");
  const body = await pinchFetch("/payers", {
    method: "POST",
    body: {
      firstName: firstName || "Student",
      lastName: rest.join(" ") || undefined,
      emailAddress: email,
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
  payerName: string;
  payerEmail: string;
};

// hosted checkout: pinch renders the page, we get the payer back on returnUrl
export async function createPaymentLink(
  input: PaymentLinkInput,
): Promise<{ id: string; url: string }> {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error(`amount must be a positive integer in cents, got ${input.amountCents}`);
  }

  const payerId = await savePayer(input.payerName, input.payerEmail);
  const body = await pinchFetch("/payment-links", {
    method: "POST",
    body: {
      amount: input.amountCents,
      payerId,
      description: input.description,
      allowedPaymentMethods: ["credit-card"],
      returnUrl: input.returnUrl,
    },
  });

  const id = body["id"];
  const url = body["url"];
  if (typeof url !== "string" || !url) throw new Error("pinch did not return a payment link url");
  return { id: typeof id === "string" ? id : "", url };
}

// on return from the hosted page we ask pinch what actually happened
export async function getPayment(paymentId: string): Promise<CheckoutResult> {
  const body = await pinchFetch(`/payments/${paymentId}`, { method: "GET" });
  const status = body["status"];
  if (typeof status !== "string") {
    throw new Error("pinch returned a payment with no status");
  }
  const outcome = outcomeForStatus(status);
  const needsReason = outcome === "FAILED" || outcome === "UNKNOWN";
  return {
    outcome,
    paymentId,
    status,
    reason: needsReason ? reasonFrom(body, status) : undefined,
  };
}

// refunds are full-amount here; pinch wants cents and a reason
export async function createRefund(
  paymentId: string,
  amountCents: number,
  reason: string,
): Promise<{ id: string; status: string }> {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error(`refund amount must be a positive integer in cents, got ${amountCents}`);
  }
  const body = await pinchFetch("/refunds", {
    method: "POST",
    body: { paymentId, amount: amountCents, reason },
  });
  return {
    id: typeof body["id"] === "string" ? body["id"] : "",
    status: typeof body["status"] === "string" ? body["status"] : "requested",
  };
}

export async function createRealtimePayment(
  input: RealtimePaymentInput,
): Promise<CheckoutResult> {
  // cents guard — must be a whole positive number of cents
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error(`amount must be a positive integer in cents, got ${input.amountCents}`);
  }

  const token = await getToken();
  const res = await fetch(`${BASE}/payments/realtime`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "pinch-version": VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: input.token,
      amount: input.amountCents,
      fullName: input.fullName,
      email: input.email,
      description: input.description,
    }),
  });

  const raw: unknown = await res.json().catch(() => null);

  // 400 validation errors come back as a JSON array, not an object
  if (Array.isArray(raw)) {
    throw new Error(`pinch rejected payment (${res.status}): ${extractPinchErrors(raw)}`);
  }

  if (!raw || typeof raw !== "object") {
    throw new Error(`pinch returned no payment body (${res.status})`);
  }

  const body = raw as Record<string, unknown>;
  const status = body["status"];
  const id = body["id"];

  // no status field — a request-level error, surface whatever pinch said
  if (typeof status !== "string") {
    throw new Error(`pinch rejected payment (${res.status}): ${extractPinchErrors(raw)}`);
  }

  const paymentId = typeof id === "string" ? id : "";
  // map the status field, never the http code — a 201 can carry dishonoured
  const outcome = outcomeForStatus(status);
  const needsReason = outcome === "FAILED" || outcome === "UNKNOWN";

  return {
    outcome,
    paymentId,
    status,
    reason: needsReason ? reasonFrom(body, status) : undefined,
  };
}
