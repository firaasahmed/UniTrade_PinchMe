import { useEffect, useState } from "react";
import type { MerchantView } from "@/types/Merchant";
import { getMyMerchant } from "@/api/merchants-api";
import { useSession } from "@/session/SessionContext";
import { RequireAuth } from "@/ui/RequireAuth";
import { PayoutSetup } from "@/ui/merchant/PayoutSetup";
import { PayoutStatus } from "@/ui/merchant/PayoutStatus";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type Load =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; merchant: MerchantView };

export function PayoutsPage() {
  return (
    <RequireAuth>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Payouts />
      </div>
    </RequireAuth>
  );
}

function Payouts() {
  const { state } = useSession();
  const [load, setLoad] = useState<Load>({ status: "loading" });

  useEffect(() => {
    let active = true;
    getMyMerchant()
      .then((merchant) => active && setLoad({ status: "ready", merchant }))
      .catch((e: unknown) =>
        active &&
        setLoad({ status: "error", message: e instanceof Error ? e.message : "couldn't load payouts" }),
      );
    return () => {
      active = false;
    };
  }, []);

  if (load.status === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (load.status === "error") {
    return (
      <div className="py-16 text-center">
        <p className="text-destructive">{load.message}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  const user = state.status === "signedIn" ? state.user : null;
  const registered = load.merchant.state !== "not-registered";

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold">Getting paid</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {registered
            ? "Where money from your listings lands."
            : "Add the account you'd like to be paid into."}
        </p>
      </div>

      {registered ? (
        <PayoutStatus merchant={load.merchant} />
      ) : (
        <PayoutSetup
          defaultName={user?.name ?? ""}
          defaultEmail={user?.email ?? ""}
          onDone={(merchant) => setLoad({ status: "ready", merchant })}
        />
      )}
    </div>
  );
}
