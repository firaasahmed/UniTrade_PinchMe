// the ONLY module that talks to pinch's capturejs browser sdk
// card details go browser -> pinch here, never to our server
type PinchCapture = {
  createToken(input: {
    sourceType: "credit-card";
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvc: string;
    cardHolderName: string;
  }): Promise<{ token?: string; errors?: unknown }>;
};

declare global {
  interface Window {
    Pinch?: { Capture(opts: { publishableKey: string }): PinchCapture };
  }
}

export type CardInput = {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  cardHolderName: string;
};

export async function tokeniseCard(card: CardInput): Promise<string> {
  if (!window.Pinch) throw new Error("payments unavailable, the card service didn't load");

  const pk: string = import.meta.env.VITE_PINCH_PUBLISHABLE_KEY;
  const capture = window.Pinch.Capture({ publishableKey: pk });

  // capturejs REJECTS with { hasError, errors } rather than resolving with them,
  // so the failure path is the catch, not a check on the result
  let result: { token?: string; errors?: unknown };
  try {
    result = await capture.createToken({ sourceType: "credit-card", ...card });
  } catch (e) {
    throw new Error(captureErrorMessage(e));
  }

  if (typeof result.token === "string") return result.token;
  throw new Error(captureErrorMessage(result));
}

// each entry carries errorMessage, not message
function captureErrorMessage(thrown: unknown): string {
  const errors =
    thrown && typeof thrown === "object" && "errors" in thrown
      ? (thrown as { errors: unknown }).errors
      : thrown;

  if (Array.isArray(errors) && errors.length > 0) {
    const parts = errors
      .map((e) => {
        if (!e || typeof e !== "object") return "";
        const o = e as Record<string, unknown>;
        const msg = o["errorMessage"] ?? o["message"];
        return typeof msg === "string" ? msg : "";
      })
      .filter((s) => s !== "");
    if (parts.length > 0) return parts.join("; ");
  }
  return "please check your card details";
}
