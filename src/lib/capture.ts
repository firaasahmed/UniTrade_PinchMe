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
  const result = await capture.createToken({ sourceType: "credit-card", ...card });

  if (typeof result.token === "string") return result.token;
  throw new Error(captureErrorMessage(result.errors));
}

function captureErrorMessage(errors: unknown): string {
  if (Array.isArray(errors) && errors.length > 0) {
    return errors
      .map((e) =>
        e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : JSON.stringify(e),
      )
      .join("; ");
  }
  return "please check your card details";
}
