import { createHmac, timingSafeEqual } from "node:crypto";

// Pinch signs every delivery:
//   pinch-signature: t=1619577772,v2=<hex hmac-sha256 of "{t}.{raw body}">
// verified against the whsec_... secret handed back when the webhook is registered.
//
// The RAW body matters — re-serialising parsed json changes bytes and breaks the
// signature, so the receiving route must not run through express.json().

const TOLERANCE_SECONDS = 300;

export type WebhookVerdict =
  | { ok: true; eventId: string; type: string }
  | { ok: false; reason: "no-secret" | "malformed-header" | "stale" | "bad-signature" | "bad-body" };

function parseHeader(header: string): { t: string; v2: string } | null {
  const parts = new Map<string, string>();
  for (const piece of header.split(",")) {
    const [k, v] = piece.split("=");
    if (k && v) parts.set(k.trim(), v.trim());
  }
  const t = parts.get("t");
  const v2 = parts.get("v2");
  return t && v2 ? { t, v2 } : null;
}

// constant time, and only after a length check — timingSafeEqual throws on a mismatch
function sameSignature(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function verifyWebhook(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string,
  nowMs: number,
): WebhookVerdict {
  if (!secret) return { ok: false, reason: "no-secret" };
  if (!signatureHeader) return { ok: false, reason: "malformed-header" };

  const parsed = parseHeader(signatureHeader);
  if (!parsed) return { ok: false, reason: "malformed-header" };

  const sentAt = Number(parsed.t);
  if (!Number.isFinite(sentAt)) return { ok: false, reason: "malformed-header" };

  // replay guard — an old capture can't be re-sent later
  const ageSeconds = Math.abs(nowMs / 1000 - sentAt);
  if (ageSeconds > TOLERANCE_SECONDS) return { ok: false, reason: "stale" };

  const expected = createHmac("sha256", secret).update(`${parsed.t}.${rawBody}`).digest("hex");
  if (!sameSignature(expected, parsed.v2)) return { ok: false, reason: "bad-signature" };

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return { ok: false, reason: "bad-body" };
  }
  if (!body || typeof body !== "object") return { ok: false, reason: "bad-body" };

  // pinch sends PascalCase by default; accept either so a format switch can't break us
  const o = body as Record<string, unknown>;
  const eventId = o["Id"] ?? o["id"];
  const type = o["Type"] ?? o["type"];
  return {
    ok: true,
    eventId: typeof eventId === "string" ? eventId : "",
    type: typeof type === "string" ? type : "",
  };
}
