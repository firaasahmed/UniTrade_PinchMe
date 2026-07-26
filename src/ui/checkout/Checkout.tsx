import { useRef, useState } from "react";
import type { Listing } from "@/types/Listing";
import type { CheckoutState } from "@/types/CheckoutState";
import type { CardInput } from "@/lib/capture";
import { tokeniseCard } from "@/lib/capture";
import { checkout } from "@/api/pinch-api";
import { resultToState } from "@/utils/checkout-state";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { SavedCardForm } from "@/ui/checkout/SavedCardForm";
import { ProcessingState } from "@/ui/checkout/ProcessingState";
import { SuccessState } from "@/ui/checkout/SuccessState";
import { SuccessFlaggedState } from "@/ui/checkout/SuccessFlaggedState";
import { PendingState } from "@/ui/checkout/PendingState";
import { FailedState } from "@/ui/checkout/FailedState";
import { UnknownState } from "@/ui/checkout/UnknownState";

// prefilled with the success test card so the demo is one click
const INITIAL_CARD: CardInput = {
  cardNumber: "4242424242424242",
  expiryMonth: "12",
  expiryYear: "2030",
  cvc: "123",
  cardHolderName: "Test Student",
};

export function Checkout({
  listing,
  onBack,
  onDone,
  dealId,
  agreedCents,
}: {
  listing: Listing;
  onBack: () => void;
  onDone: () => void;
  dealId?: string;
  // agreed price from an accepted deal — display only, the server is authoritative
  agreedCents?: number;
}) {
  const [cs, setCs] = useState<CheckoutState>({ state: "IDLE" });
  const [card] = useState<CardInput>(INITIAL_CARD);
  const [email] = useState("test.student@example.com");
  const [forceOutcome, setForceOutcome] = useState("");
  const tokenRef = useRef<string | null>(null);

  async function submit(token: string): Promise<void> {
    setCs({ state: "SUBMITTING" });
    const description = forceOutcome ? `${listing.title} #${forceOutcome}` : listing.title;
    try {
      const result = await checkout({
        token,
        listingId: listing.id,
        fullName: card.cardHolderName,
        email: email || undefined,
        description,
        dealId,
      });
      setCs(resultToState(result));
    } catch (err) {
      // request-level error (no payment status) — back to the form with the message
      setCs({ state: "IDLE", fieldError: err instanceof Error ? err.message : "payment failed" });
    }
  }

  async function pay(): Promise<void> {
    setCs({ state: "TOKENISING" });
    try {
      const token = await tokeniseCard(card);
      tokenRef.current = token;
      await submit(token);
    } catch (err) {
      setCs({ state: "IDLE", fieldError: err instanceof Error ? err.message : "check your card details" });
    }
  }

  function retry(): void {
    if (tokenRef.current) void submit(tokenRef.current);
    else void pay();
  }

  const canGoBack = cs.state === "IDLE";

  return (
    <div className="mx-auto max-w-lg">
      {/* Top URL / Portal Navigation Bar */}
      <div className="mb-4 flex items-center justify-between border-b pb-3">
        {canGoBack ? (
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
            <ArrowLeft className="size-4" />
            Back to UniTrade
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-verified" />
            <span>Pinch Secure Payment Environment</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 rounded-full border bg-muted/60 px-3 py-1 text-xs font-mono font-medium text-muted-foreground">
          <Lock className="size-3 text-verified" />
          <span>checkout.getpinch.com.au</span>
        </div>
      </div>

      {/* Main Hosted Checkout Card */}
      <div className="rounded-2xl border bg-card p-6 shadow-md">
        {/* Pinch Portal Header */}
        <div className="mb-5 flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary font-heading text-lg font-bold text-primary-foreground shadow-xs">
              P
            </div>
            <div>
              <h2 className="font-heading text-base font-bold leading-none text-foreground">Pinch Payments</h2>
              <p className="mt-1 text-xs text-muted-foreground">Hosted Checkout Portal</p>
            </div>
          </div>
          <span className="rounded-full bg-verified/15 px-2.5 py-0.5 text-[11px] font-semibold text-verified">
            Live Merchant API
          </span>
        </div>

        {/* one saved card; picking it pays straight away */}
        {cs.state === "IDLE" && (
          <SavedCardForm
            listing={listing}
            amountCents={agreedCents}
            card={card}
            email={email}
            forceOutcome={forceOutcome}
            fieldError={cs.fieldError}
            onForceOutcomeChange={setForceOutcome}
            onPay={() => void pay()}
          />
        )}

        {cs.state === "TOKENISING" && <ProcessingState message="Encrypting & tokenising card with Pinch SDK…" />}
        {cs.state === "SUBMITTING" && <ProcessingState message="Processing transaction on Pinch Payments…" />}

        {cs.state === "SUCCESS" && (
          <SuccessState listing={listing} amountCents={agreedCents} paymentId={cs.paymentId} onDone={onDone} />
        )}
        {cs.state === "SUCCESS_WITH_FLAG" && (
          <SuccessFlaggedState listing={listing} paymentId={cs.paymentId} onDone={onDone} />
        )}
        {cs.state === "PENDING" && <PendingState paymentId={cs.paymentId} onDone={onDone} />}
        {cs.state === "FAILED" && (
          <FailedState
            reason={cs.reason}
            paymentId={cs.paymentId}
            onRetry={retry}
            onCancel={() => setCs({ state: "IDLE" })}
          />
        )}
        {cs.state === "UNKNOWN" && <UnknownState paymentId={cs.paymentId} onDone={onDone} />}
      </div>
    </div>
  );
}
