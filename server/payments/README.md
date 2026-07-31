# Payments

Everything that talks to Pinch lives in this folder. Nothing outside it calls Pinch
directly — the rest of the server imports from `index.ts` and nowhere else.

```
client.ts      auth + token cache + the single fetch boundary + error parsing
operations.ts  every Pinch call we make, and the one place a body becomes an outcome
nonce.ts       the idempotency key, derived rather than generated
webhook.ts     HMAC-SHA256 signature verification with a replay window
index.ts       the public surface
```

---

## How it is secured

**Card numbers never reach our server.** The browser tokenises the card directly with
Pinch's CaptureJS SDK and sends us a single-use token. We never see, log or store a PAN.
That is what keeps this out of PCI scope.

**The secret never reaches the browser.** `PINCH_SECRET` is read server-side only. Vite
only exposes `VITE_`-prefixed variables to the client, so the publishable key is the one
and only key that can leak, and it is designed to be public.

**The client cannot set its own price.** `checkoutService` resolves the amount from the
listing, or from an accepted deal, on the server. A tampered request body cannot change
what is charged.

**Success is never inferred from the HTTP status.** A Pinch `201` can carry
`"status": "dishonoured"`. `resultFrom()` reads the `status` field and maps it through
`src/types/PaymentStatus.ts`. There is no code path where a 2xx alone means paid.

**Every Pinch status maps to exactly one UI state**, and unknown statuses map to
`UNKNOWN` rather than falling through to success. Backend states and frontend states are
in one-to-one correspondence by construction.

**Retries cannot double-charge.** Every charge carries a nonce derived from
`{deal or listing}-{buyer}-attempt-{n}`. Pinch returns the original result for a repeated
nonce instead of taking the money again. If a request fails before we learn its outcome,
`PinchUnreachableError` sends us to `findByNonce()` to ask Pinch what actually happened —
we never blind-retry a charge.

**Webhooks are verified, not trusted.** `verifyWebhook()` recomputes
`HMAC-SHA256("{t}.{raw body}", whsec_…)` and compares it in constant time, and rejects
anything older than a 5 minute window so a captured delivery cannot be replayed. The raw
bytes are used — re-serialising parsed JSON changes the payload and breaks the signature.

**Amounts are integer cents everywhere.** `assertCents()` guards every call. Dollars only
exist at the point of display.

---

## The state model

```
IDLE → TOKENISING → SUBMITTING → SUCCESS | SUCCESS_WITH_FLAG | PENDING | FAILED | UNKNOWN
FAILED → (retry, attempt + 1) → SUBMITTING
TOKENISING → (card error) → IDLE
```

| Pinch status | Outcome | What the payer sees |
| --- | --- | --- |
| `approved`, `settled`, `transferred` | `SUCCESS` | Paid |
| `processing`, `scheduled`, `pending-action` | `PENDING` | Processing, with the payment ID |
| `dishonoured`, `cancelled`, `returned-without-settlement` | `FAILED` | Reason + retry |
| `cleared-settlements-disabled`, `cleared-pending-dispute` | `SUCCESS_WITH_FLAG` | Paid, flagged internally |
| anything else | `UNKNOWN` | "We're confirming this payment" + ID |

`SUBMITTING` always resolves into exactly one of those five. There is no spinner with no
exit.

---

## What it can do

- Real-time card payments through CaptureJS tokenisation
- Hosted checkout via Pinch payment links, with the outcome confirmed by asking Pinch on
  return rather than trusting the redirect
- Full and partial refunds, within Pinch's 180-day window
- Settlement figures per rail (`quoteFees`) so a seller can see what lands in their
  account on card versus bank before choosing. We never add a surcharge of our own
- Metadata on every payment (`listingId`, `dealId`, `buyerId`) so a Pinch record can be
  traced back to a deal
- Deterministic failure testing — a `#dishonour-code` in the description forces a chosen
  decline, so every failure state is reachable on demand rather than by luck

## What it cannot do

Stated plainly, because a demo that overclaims is worse than one that doesn't.

- **No escrow and no auth-and-capture hold.** Pinch has no manual capture, so funds
  cannot be held pending delivery. Any escrow-like behaviour would mean holding other
  people's money, which is a regulated activity we are deliberately not doing.
- **No PayTo.**
- **Refunds are capped at 180 days**, and Pinch does not return its processing fee on a
  refund.
- **Sellers are not yet managed merchants**, so settlement currently lands in the platform
  account rather than the seller's own. Until that is built, "we never hold your money" is
  the design intent, not a description of what runs today.

---

## Monetisation note

`applicationFee` is supported by Pinch and is deliberately unused — UniTrade adds no fee
of its own to a student transaction. The field is the mechanism if that ever changes;
today it is absent from every request in this folder.
