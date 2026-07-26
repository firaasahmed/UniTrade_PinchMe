import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { BookingView } from "@/types/Booking";
import { getPurchases, confirmPurchase, refundPurchase } from "@/api/bookings-api";
import { ListingMedia } from "@/ui/ListingMedia";
import { EmptyState } from "@/ui/EmptyState";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatDate } from "@/utils/format";
import { categoryKind } from "@/utils/categories";
import { ShoppingBag, CheckCircle2, Clock, RotateCcw, Undo2 } from "lucide-react";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; bookings: BookingView[] };

const STATUS_META: Record<string, { label: string; className: string; icon?: typeof CheckCircle2 }> = {
  HELD: { label: "Confirmed", className: "bg-verified/15 text-verified font-semibold", icon: CheckCircle2 },
  RELEASED: { label: "Completed", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold", icon: CheckCircle2 },
  REFUNDED: { label: "Refunded", className: "bg-muted text-muted-foreground", icon: RotateCcw },
  PENDING_PAYMENT: { label: "In Process", className: "bg-primary/10 text-primary font-semibold", icon: Clock },
};

const FALLBACK_META = { label: "In Process", className: "bg-primary/10 text-primary font-semibold", icon: Clock };

function confirmLabel(category: string): string {
  const kind = categoryKind(category);
  if (kind === "accommodation") return "Confirm moved in";
  if (kind === "service") return "Confirm completed";
  return "Confirm received";
}

export function MyPurchases() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    let active = true;
    getPurchases()
      .then((bookings) => active && setState({ status: "loaded", bookings }))
      .catch((e: unknown) =>
        active && setState({ status: "error", message: e instanceof Error ? e.message : "failed" }),
      );
    return () => {
      active = false;
    };
  }, []);

  async function release(id: string) {
    try {
      const updated = await confirmPurchase(id);
      setState((s) =>
        s.status === "loaded"
          ? { status: "loaded", bookings: s.bookings.map((b) => (b.id === id ? updated : b)) }
          : s,
      );
      toast.success("Transaction completed! Seller notified.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "couldn't confirm");
    }
  }

  // real refund: pinch reverses the charge and the item goes back on the market
  async function revertPayment(id: string) {
    try {
      const updated = await refundPurchase(id);
      setState((s) =>
        s.status === "loaded"
          ? { status: "loaded", bookings: s.bookings.map((b) => (b.id === id ? updated : b)) }
          : s,
      );
      toast.success("Refunded via Pinch. The listing is back on the marketplace.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "couldn't refund");
    }
  }

  const filteredBookings =
    state.status === "loaded"
      ? state.bookings.filter((b) => {
          if (filter === "confirmed") return b.status === "HELD";
          if (filter === "in_process") return b.status === "PENDING_PAYMENT";
          if (filter === "completed") return b.status === "RELEASED";
          if (filter === "refunded") return b.status === "REFUNDED";
          return true;
        })
      : [];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div>
          <h2 className="font-heading text-xl font-bold">My Purchases</h2>
          <p className="text-sm text-muted-foreground">
            Manage your active orders, confirm received items, and track payments
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {[
            { id: "all", label: "All Purchases" },
            { id: "confirmed", label: "Confirmed" },
            { id: "in_process", label: "In Process" },
            { id: "completed", label: "Completed" },
            { id: "refunded", label: "Refunded" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={
                filter === f.id
                  ? "rounded-lg bg-primary px-3 py-1.5 font-semibold text-primary-foreground"
                  : "rounded-lg border bg-card px-3 py-1.5 font-medium text-muted-foreground hover:bg-accent"
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {state.status === "loading" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] w-full rounded-2xl" />
          ))}
        </div>
      )}

      {state.status === "error" && (
        <p className="text-destructive">Couldn't load your purchases: {state.message}</p>
      )}

      {state.status === "loaded" &&
        (filteredBookings.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No purchases found"
            description="When you buy or reserve something, it shows up here."
            action={
              <Button asChild>
                <Link to="/buy">Browse the marketplace</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBookings.map((b) => {
              const meta = STATUS_META[b.status] ?? FALLBACK_META;
              const StatusIcon = meta.icon ?? Clock;

              return (
                <div
                  key={b.id}
                  className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-xs transition-all"
                >
                  {/* Card Header Media */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                    <Link to={`/listing/${b.listing.id}`}>
                      <ListingMedia listing={b.listing} iconClass="size-8" />
                    </Link>
                    <div className="absolute right-3 top-3 z-10">
                      <Badge
                        variant="secondary"
                        className={`gap-1.5 px-2.5 py-1 text-xs border-transparent shadow-xs backdrop-blur-xs ${meta.className}`}
                      >
                        <StatusIcon className="size-3.5" />
                        {meta.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="flex flex-1 flex-col p-4">
                    <Link
                      to={`/listing/${b.listing.id}`}
                      className="line-clamp-1 font-heading text-base font-semibold hover:underline"
                    >
                      {b.listing.title}
                    </Link>
                    <p className="mt-1 text-base font-bold text-primary">{formatPrice(b.amountCents)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Seller: <span className="font-medium text-foreground">{b.listing.seller.name}</span> · {formatDate(b.createdAt)}
                    </p>

                    <div className="mt-3 border-t pt-2 text-[11px] font-mono text-muted-foreground">
                      Ref: {b.pinchPaymentId}
                    </div>

                    {/* Action Buttons Section */}
                    <div className="mt-auto pt-4 space-y-2">
                      {b.status === "HELD" ? (
                        <>
                          <ConfirmDialog
                            trigger={
                              <Button size="default" className="w-full font-bold shadow-xs">
                                <CheckCircle2 className="size-4" />
                                {confirmLabel(b.listing.category)}
                              </Button>
                            }
                            title={confirmLabel(b.listing.category) + "?"}
                            description="Confirming completes the purchase and marks the order as fulfilled."
                            confirmLabel="Confirm & Complete"
                            onConfirm={() => void release(b.id)}
                          />

                          <ConfirmDialog
                            trigger={
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40"
                              >
                                <Undo2 className="size-3.5" />
                                Request Refund / Revert
                              </Button>
                            }
                            title="Revert Payment & Request Refund?"
                            description="This will revert the transaction and issue a refund on Pinch Payments."
                            confirmLabel="Revert Payment"
                            destructive
                            onConfirm={() => void revertPayment(b.id)}
                          />
                        </>
                      ) : b.status === "RELEASED" ? (
                        <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-4" />
                          Completed & Verified
                        </div>
                      ) : b.status === "REFUNDED" ? (
                        <div className="flex items-center justify-center gap-1.5 rounded-xl bg-muted py-2.5 text-xs font-medium text-muted-foreground">
                          <Undo2 className="size-4" />
                          Payment Reverted / Refunded
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 py-2.5 text-xs font-semibold text-primary">
                          <Clock className="size-4 animate-spin" />
                          Processing via Pinch...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
    </div>
  );
}
