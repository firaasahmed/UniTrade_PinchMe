import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import type { Listing } from "@/types/Listing";
import { getListing } from "@/api/listings-api";
import { getMyDeals } from "@/api/deals-api";
import { Checkout } from "@/ui/checkout/Checkout";
import { RequireAuth } from "@/ui/RequireAuth";
import { Loader2 } from "lucide-react";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; listing: Listing };

export function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [state, setState] = useState<State>({ status: "loading" });
  const dealId = params.get("deal") ?? undefined;
  const [agreedCents, setAgreedCents] = useState<number | undefined>(undefined);

  // show the agreed price when paying an accepted offer/quote
  useEffect(() => {
    if (!dealId) return;
    let active = true;
    void getMyDeals()
      .then((deals) => {
        const deal = deals.find((d) => d.id === dealId);
        if (active && deal?.amountCents !== undefined) setAgreedCents(deal.amountCents);
      })
      .catch(() => {
        /* falls back to list price display; server still charges the agreed amount */
      });
    return () => {
      active = false;
    };
  }, [dealId]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setState({ status: "loading" });
    getListing(id)
      .then((listing) => active && setState({ status: "loaded", listing }))
      .catch((e: unknown) =>
        active && setState({ status: "error", message: e instanceof Error ? e.message : "failed" }),
      );
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <RequireAuth>
      <div className="mx-auto max-w-7xl px-4 py-6">
        {state.status === "loading" && (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {state.status === "error" && (
          <p className="text-destructive">Couldn't start checkout: {state.message}</p>
        )}
        {state.status === "loaded" && (
          <Checkout
            listing={state.listing}
            dealId={dealId}
            agreedCents={agreedCents}
            onBack={() => navigate(`/listing/${state.listing.id}`)}
            onDone={() => navigate("/sell/purchases")}
          />
        )}
      </div>
    </RequireAuth>
  );
}
