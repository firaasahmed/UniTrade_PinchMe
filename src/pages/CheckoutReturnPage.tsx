import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { CheckoutResult } from "@/types/CheckoutResult";
import { confirmHostedCheckout } from "@/api/pinch-api";
import { RequireAuth } from "@/ui/RequireAuth";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, HelpCircle, Clock } from "lucide-react";

type State =
  | { status: "confirming" }
  | { status: "error"; message: string }
  | { status: "done"; result: CheckoutResult };

// pinch sends the payer back here; we ask pinch what happened rather than trusting the redirect
export function CheckoutReturnPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "confirming" });
  const ran = useRef(false);

  const listingId = params.get("listing") ?? "";
  const dealId = params.get("deal") ?? undefined;
  const paymentId = params.get("paymentId") ?? "";

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!listingId || !paymentId) {
      setState({ status: "error", message: "we didn't get a payment reference back from Pinch" });
      return;
    }
    confirmHostedCheckout(listingId, paymentId, dealId)
      .then((result) => setState({ status: "done", result }))
      .catch((e: unknown) =>
        setState({ status: "error", message: e instanceof Error ? e.message : "failed" }),
      );
  }, [listingId, paymentId, dealId]);

  // a settled payment lands the buyer on their purchases, where the item now sits
  useEffect(() => {
    if (state.status !== "done") return;
    const good = state.result.outcome === "SUCCESS" || state.result.outcome === "SUCCESS_WITH_FLAG";
    if (!good) return;
    const timer = window.setTimeout(() => navigate("/sell/purchases"), 1800);
    return () => window.clearTimeout(timer);
  }, [state, navigate]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      {state.status === "confirming" && (
        <>
          <Loader2 className="size-10 animate-spin text-primary" />
          <h1 className="mt-5 font-heading text-xl font-semibold">Confirming your payment</h1>
          <p className="mt-1 text-sm text-muted-foreground">Checking with Pinch, one moment.</p>
        </>
      )}

      {state.status === "error" && (
        <>
          <AlertCircle className="size-10 text-destructive" />
          <h1 className="mt-5 font-heading text-xl font-semibold">We couldn't confirm that</h1>
          <p className="mt-1 text-sm text-muted-foreground">{state.message}</p>
          <Button className="mt-6" onClick={() => navigate("/sell/purchases")}>
            Go to my purchases
          </Button>
        </>
      )}

      {state.status === "done" && <Outcome result={state.result} onDone={() => navigate("/sell/purchases")} />}
    </div>
  );
}

function Outcome({ result, onDone }: { result: CheckoutResult; onDone: () => void }) {
  if (result.outcome === "SUCCESS" || result.outcome === "SUCCESS_WITH_FLAG") {
    return (
      <>
        <CheckCircle2 className="size-10 text-verified" />
        <h1 className="mt-5 font-heading text-xl font-semibold">Paid</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Payment {result.paymentId} confirmed by Pinch. Taking you to your purchases.
        </p>
      </>
    );
  }

  if (result.outcome === "PENDING") {
    return (
      <>
        <Clock className="size-10 text-gold-foreground" />
        <h1 className="mt-5 font-heading text-xl font-semibold">Payment processing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pinch is still clearing {result.paymentId}. No need to pay again.
        </p>
        <Button className="mt-6" onClick={onDone}>
          Go to my purchases
        </Button>
      </>
    );
  }

  if (result.outcome === "FAILED") {
    return (
      <>
        <AlertCircle className="size-10 text-destructive" />
        <h1 className="mt-5 font-heading text-xl font-semibold">Payment declined</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {result.reason ?? result.status}. Nothing has been charged.
        </p>
        <Button className="mt-6" onClick={onDone}>
          Back to my purchases
        </Button>
      </>
    );
  }

  return (
    <>
      <HelpCircle className="size-10 text-muted-foreground" />
      <h1 className="mt-5 font-heading text-xl font-semibold">We're confirming this payment</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pinch returned {result.status} for {result.paymentId}. Don't pay again, quote that reference
        if you need help.
      </p>
      <Button className="mt-6" onClick={onDone}>
        Go to my purchases
      </Button>
    </>
  );
}
