import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { BookingView } from "@/types/Booking";
import type { MerchantView } from "@/types/Merchant";
import { getSales } from "@/api/bookings-api";
import { getMyMerchant } from "@/api/merchants-api";
import { canBePaid } from "@/types/Merchant";
import { formatPrice, formatDate } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/ui/EmptyState";
import { Landmark, CheckCircle2, AlertCircle, Wallet } from "lucide-react";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; sales: BookingView[]; merchant: MerchantView };

export function MySales() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let active = true;
    Promise.all([getSales(), getMyMerchant()])
      .then(([sales, merchant]) => active && setState({ status: "ready", sales, merchant }))
      .catch(
        (e: unknown) =>
          active &&
          setState({ status: "error", message: e instanceof Error ? e.message : "couldn't load" }),
      );
    return () => {
      active = false;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (state.status === "error") {
    return <p className="py-12 text-center text-destructive">{state.message}</p>;
  }

  const { sales, merchant } = state;
  // what buyers actually paid. the platform fee comes off at settlement, so this is
  // gross — the exact net is on the pinch statement
  const total = sales.reduce((sum, s) => sum + s.amountCents, 0);
  const ready = canBePaid(merchant.state);

  return (
    <div className="space-y-5">
      <PayoutBanner merchant={merchant} ready={ready} />

      {sales.length > 0 && (
        <div className="flex flex-wrap items-center gap-6 rounded-xl border bg-muted/40 p-4">
          <Figure label="Sales" value={String(sales.length)} />
          <Figure label="Paid by buyers" value={formatPrice(total)} icon={<Wallet className="size-4" />} />
        </div>
      )}

      {sales.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No sales yet"
          description={
            ready
              ? "When someone pays for one of your listings it'll show up here."
              : "Set up your payout account so people can pay you."
          }
          action={
            ready ? (
              <Button asChild variant="outline">
                <Link to="/sell/new">Create a listing</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/payouts">Set up payouts</Link>
              </Button>
            )
          }
        />
      ) : (
        <ul className="space-y-3">
          {sales.map((s) => (
            <li key={s.id} className="flex items-center gap-4 rounded-xl border bg-card p-4">
              <div className="min-w-0 flex-1">
                <Link to={`/listing/${s.listingId}`} className="font-medium hover:underline">
                  {s.listing.title}
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDate(s.createdAt)} · paid to your account
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatPrice(s.amountCents)}</p>
                <Badge variant="secondary" className="mt-1">
                  {s.status}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Figure({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 font-heading text-xl font-semibold">{value}</p>
    </div>
  );
}

// the one thing that gates everything else, so it sits above the numbers
function PayoutBanner({ merchant, ready }: { merchant: MerchantView; ready: boolean }) {
  if (ready) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-verified/30 bg-verified/5 p-4">
        <CheckCircle2 className="size-5 shrink-0 text-verified" />
        <p className="min-w-0 flex-1 text-sm">
          Money from your listings goes straight to your account
          {merchant.bankAccountTail ? ` ending ${merchant.bankAccountTail}` : ""}.
        </p>
        <Button asChild size="sm" variant="ghost">
          <Link to="/payouts">Manage</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gold/40 bg-gold/5 p-4">
      {merchant.state === "not-registered" ? (
        <Landmark className="size-5 shrink-0 text-gold-foreground" />
      ) : (
        <AlertCircle className="size-5 shrink-0 text-gold-foreground" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {merchant.state === "not-registered"
            ? "You can't be paid yet"
            : "Your payout account is still being checked"}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {merchant.state === "not-registered"
            ? "Add an ABN and your bank details, and Pinch registers you as a merchant."
            : "Your listings stay up while this clears."}
        </p>
      </div>
      <Button asChild size="sm">
        <Link to="/payouts">{merchant.state === "not-registered" ? "Set up" : "View"}</Link>
      </Button>
    </div>
  );
}
