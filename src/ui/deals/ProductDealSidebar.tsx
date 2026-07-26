import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { DealView } from "@/types/Deal";
import { isLive } from "@/types/Deal";
import {
  getThreadDeals,
  createDeal,
  counterDeal,
  reviseDeal,
  acceptDeal,
  declineDeal,
  withdrawDeal,
} from "@/api/deals-api";
import { useSession } from "@/session/SessionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/utils/format";
import { toCents } from "@/utils/money";
import { cn } from "@/lib/utils";
import { Package, Check, X, Handshake, ExternalLink, Loader2, CalendarCheck } from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-gold/25 text-gold-foreground",
  accepted: "bg-verified/15 text-verified",
  declined: "bg-muted text-muted-foreground",
  withdrawn: "bg-muted text-muted-foreground",
};

// the item under discussion, plus the controls for moving the price around
export function ProductDealSidebar({
  listingId,
  otherUserId,
  listingTitle,
  listingImageUrl,
  listingPriceCents,
  sellerId,
  version = 0,
  onUpdate,
}: {
  listingId: string;
  otherUserId: string;
  listingTitle: string;
  listingImageUrl: string;
  listingPriceCents?: number;
  sellerId?: string;
  version?: number;
  onUpdate?: () => void;
}) {
  const { state } = useSession();
  const meId = state.status === "signedIn" ? state.user.id : "";
  const [deals, setDeals] = useState<DealView[]>([]);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getThreadDeals(listingId, otherUserId).then(setDeals);
  }, [listingId, otherUserId, version]);

  // the one still on the table, or the last paid one so the outcome stays on screen
  const live = [...deals].reverse().find((d) => isLive(d) || d.paidAt !== null);
  const can = live?.actions;
  const isSeller = meId === sellerId;

  function refresh() {
    void getThreadDeals(listingId, otherUserId).then(setDeals);
    onUpdate?.();
  }

  async function run(fn: () => Promise<unknown>, msg: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      setAmount("");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function propose() {
    const cents = toCents(amount);
    if (cents === undefined) {
      toast.error("Enter a valid amount");
      return;
    }
    if (live && can?.canCounter) {
      void run(() => counterDeal(live.id, { amountCents: cents, note: "" }), "Counter sent");
      return;
    }
    if (live && can?.canRevise) {
      void run(() => reviseDeal(live.id, { amountCents: cents, note: "" }), "Amount updated");
      return;
    }
    void run(
      () =>
        createDeal({
          listingId,
          kind: "offer",
          amountCents: cents,
          note: "",
          buyerId: isSeller ? otherUserId : undefined,
        }),
      "Offer sent",
    );
  }

  const Icon = live?.kind === "inspection" ? CalendarCheck : Handshake;
  const canReprice = Boolean(can?.canCounter || can?.canRevise);

  return (
    <aside className="flex flex-col gap-3 lg:max-h-[70vh] lg:overflow-y-auto">
      {/* the deal comes first — it's the thing you act on */}
      <div className="rounded-2xl border bg-card p-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Icon className="size-3.5" />
            Deal
          </p>
          {live && (
            <Badge
              variant="secondary"
              className={cn("border-transparent text-[10px] capitalize", STATUS_STYLE[live.status])}
            >
              {live.paidAt ? "paid" : live.status}
            </Badge>
          )}
        </div>

        {live ? (
          <div className="mt-2.5">
            <p className="text-2xl font-bold text-price">
              {live.amountCents !== undefined ? formatPrice(live.amountCents) : live.scheduledFor}
            </p>
            {listingPriceCents !== undefined && live.amountCents !== undefined && (
              <p className="text-xs text-muted-foreground">
                {live.amountCents < listingPriceCents
                  ? `${formatPrice(listingPriceCents - live.amountCents)} under the ${formatPrice(listingPriceCents)} asking price`
                  : live.amountCents > listingPriceCents
                    ? `${formatPrice(live.amountCents - listingPriceCents)} over the ${formatPrice(listingPriceCents)} asking price`
                    : `Full asking price`}
              </p>
            )}

            {can?.canAccept && (
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => void run(() => acceptDeal(live.id), "Accepted")}
                >
                  <Check className="size-3.5" />
                  Accept
                </Button>
                {can.canDecline && (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Decline"
                    disabled={busy}
                    onClick={() => void run(() => declineDeal(live.id), "Declined")}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            )}

            {can?.mine && live.status === "pending" && (
              <p className="mt-2 text-xs text-muted-foreground">Waiting for a reply</p>
            )}

            {live.status === "accepted" && !live.paidAt && (
              <p className="mt-2 text-xs font-medium text-verified">
                {live.kind === "inspection"
                  ? "Inspection confirmed"
                  : can?.canPay
                    ? "Agreed. Pay from the message on the left — or change the number below"
                    : "Agreed. Waiting on payment — you can still change the number below"}
              </p>
            )}

            {live.paidAt && <p className="mt-2 text-xs font-medium text-verified">Paid, held until confirmed</p>}

            {canReprice && (
              <PriceField
                label={can?.canCounter ? "Counter with" : "Change your amount"}
                value={amount}
                onChange={setAmount}
                onSubmit={propose}
                busy={busy}
                cta={can?.canCounter ? "Send counter" : "Update amount"}
              />
            )}

            {can?.canWithdraw && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full"
                disabled={busy}
                onClick={() => void run(() => withdrawDeal(live.id), "Withdrawn")}
              >
                Withdraw
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-2.5">
            {listingPriceCents !== undefined && (
              <>
                <p className="text-2xl font-bold text-price">{formatPrice(listingPriceCents)}</p>
                <p className="text-xs text-muted-foreground">Asking price</p>
              </>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {isSeller ? "Send them a price to lock this in." : "Name your price and see what they say."}
            </p>
            <PriceField
              label={isSeller ? "Your price" : "Your offer"}
              value={amount}
              onChange={setAmount}
              onSubmit={propose}
              busy={busy}
              cta={isSeller ? "Send price" : "Send offer"}
            />
          </div>
        )}
      </div>

      {/* what's being traded, kept compact so the deal stays above the fold */}
      <Link
        to={`/listing/${listingId}`}
        className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm transition-colors hover:bg-accent/50"
      >
        <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
          {listingImageUrl ? (
            <img src={listingImageUrl} alt={listingTitle} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <Package className="size-6" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold">{listingTitle}</p>
          {listingPriceCents !== undefined && (
            <p className="text-xs text-muted-foreground">Listed at {formatPrice(listingPriceCents)}</p>
          )}
        </div>
        <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </aside>
  );
}

function PriceField({
  label,
  value,
  onChange,
  onSubmit,
  busy,
  cta,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  cta: string;
}) {
  return (
    <div className="mt-3 space-y-2">
      <Label htmlFor="deal-price" className="text-xs">
        {label}
      </Label>
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted-foreground">$</span>
        <Input
          id="deal-price"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder="0"
          className="h-9"
        />
      </div>
      <Button size="sm" className="w-full" disabled={busy || value.trim() === ""} onClick={onSubmit}>
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Handshake className="size-3.5" />}
        {cta}
      </Button>
    </div>
  );
}
