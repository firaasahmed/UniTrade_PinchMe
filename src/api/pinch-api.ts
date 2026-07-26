import type { CheckoutRequest, CheckoutResult } from "../types/CheckoutResult.ts";
import { apiFetch } from "../lib/api.ts";

// the ONLY frontend module that talks to our backend payment endpoints
// goes through apiFetch so the signed-in buyer (x-user-email) rides along for escrow
export async function checkout(req: CheckoutRequest): Promise<CheckoutResult> {
  const res = await apiFetch("/api/checkout", {
    method: "POST",
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    // request-level failure comes back as { error }
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `checkout failed (${res.status})`);
  }

  return (await res.json()) as CheckoutResult;
}

// hosted checkout: pinch renders the payment page, we just send the payer there
export async function startHostedCheckout(
  listingId: string,
  dealId?: string,
): Promise<{ url: string }> {
  const res = await apiFetch("/api/checkout/link", {
    method: "POST",
    body: JSON.stringify({ listingId, dealId }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `couldn't open the payment page (${res.status})`);
  }
  return (await res.json()) as { url: string };
}

export async function confirmHostedCheckout(
  listingId: string,
  paymentId: string,
  dealId?: string,
): Promise<CheckoutResult> {
  const res = await apiFetch("/api/checkout/link/confirm", {
    method: "POST",
    body: JSON.stringify({ listingId, paymentId, dealId }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `couldn't confirm the payment (${res.status})`);
  }
  return (await res.json()) as CheckoutResult;
}
