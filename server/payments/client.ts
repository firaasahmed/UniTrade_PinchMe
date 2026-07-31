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
  if (cached && now < cached.expiresAt - 60_000) return cached.token;

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
    throw new Error(`pinch auth failed (${res.status}): ${await res.text()}`);
  }

  const body = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: body.access_token, expiresAt: now + body.expires_in * 1000 };
  return cached.token;
}

export function hasCredentials(): boolean {
  return APP_ID !== "" && SECRET !== "";
}

// fetch a token so a broken sandbox/auth surfaces at boot, not mid-demo
export async function verifyCredentials(): Promise<void> {
  await getToken();
}

// a call that never reached pinch — safe to retry with the same nonce
export class PinchUnreachableError extends Error {}

// 400s come back as a json array of error objects, sometimes wrapped in { errors: [...] }.
// field names vary, so try the common ones and dump the raw element rather than ever
// showing [object Object]
export function describeErrors(raw: unknown): string {
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
        const msg = o["message"] ?? o["errorMessage"] ?? o["error"] ?? o["detail"] ?? o["description"];
        const field = o["field"] ?? o["propertyName"];
        if (typeof msg === "string") return typeof field === "string" ? `${field}: ${msg}` : msg;
      }
      return JSON.stringify(e);
    })
    .join("; ");
}

export type PinchBody = Record<string, unknown>;

export type PinchInit = {
  method: string;
  body?: unknown;
  // act as a managed sub-merchant. the payment then belongs to them, not to us —
  // the parent account cannot even read it back
  onBehalfOf?: string;
};

export function isTestMode(): boolean {
  return BASE.includes("/test");
}

// THE http boundary — every pinch call in the codebase goes through here.
// returns the parsed body even on a non-2xx that carries one, because a payment
// response can be a valid outcome at an unexpected status code
export async function pinchFetch(
  path: string,
  init: PinchInit,
): Promise<{ status: number; body: PinchBody }> {
  const token = await getToken();

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${token}`,
        "pinch-version": VERSION,
        "Content-Type": "application/json",
        ...(init.onBehalfOf ? { "Current-Merchant": init.onBehalfOf } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch (e) {
    // never got an answer, so we cannot know whether the charge happened
    throw new PinchUnreachableError(e instanceof Error ? e.message : `could not reach pinch at ${path}`);
  }

  const raw: unknown = await res.json().catch(() => null);

  if (Array.isArray(raw)) {
    throw new Error(`pinch rejected ${path} (${res.status}): ${describeErrors(raw)}`);
  }
  if (!raw || typeof raw !== "object") {
    throw new Error(`pinch returned no body for ${path} (${res.status})`);
  }
  return { status: res.status, body: raw as PinchBody };
}

export async function pinchOk(path: string, init: PinchInit): Promise<PinchBody> {
  const { status, body } = await pinchFetch(path, init);
  if (status < 200 || status >= 300) {
    throw new Error(`pinch rejected ${path} (${status}): ${describeErrors(body)}`);
  }
  return body;
}
