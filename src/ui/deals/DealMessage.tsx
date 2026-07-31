import { useState } from "react";
import { toast } from "sonner";
import type { DealView } from "@/types/Deal";
import { acceptDeal, declineDeal, counterDeal, reviseDeal, withdrawDeal } from "@/api/deals-api";
import { Input } from "@/components/ui/input";
import { startHostedCheckout } from "@/api/pinch-api";
import { formatPrice } from "@/utils/format";
import { toCents } from "@/utils/money";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Handshake, CalendarCheck, Check, X, Loader2, Lock, ArrowLeftRight, PlaneTakeoff } from "lucide-react";

// a deal shown inline in the conversation, with the actions the server says are open
export function DealMessage({
  deal,
  meId,
  onChanged,
}: {
  deal: DealView;
  meId: string;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [haggling, setHaggling] = useState(false);
  const [amount, setAmount] = useState("");
  const can = deal.actions;
  // once accepted the card reads as a message from whoever accepted it, not the proposer
  const accepted = deal.status === "accepted";
  const fromMe = accepted ? !can.mine : can.mine;
  // a moving-out bundle: one offer covering several listings, paid in one go
  const bundle = deal.bundleListings && deal.bundleListings.length > 1 ? deal.bundleListings : undefined;
  const Icon = deal.kind === "inspection" ? CalendarCheck : bundle ? PlaneTakeoff : Handshake;

  async function run(fn: () => Promise<unknown>, msg: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "something went wrong");
    } finally {
      setBusy(false);
    }
  }

  // countering answers their number, revising changes your own — the server picks the rules
  async function reprice() {
    const cents = toCents(amount);
    if (cents === undefined) {
      toast.error("Enter a valid amount");
      return;
    }
    await run(
      () => (can.mine ? reviseDeal : counterDeal)(deal.id, { amountCents: cents, note: "" }),
      can.mine ? "Amount updated" : "Counter sent",
    );
    setHaggling(false);
    setAmount("");
  }

  // straight to pinch's hosted portal; we come back on /checkout/return
  async function pay() {
    setBusy(true);
    try {
      const { url } = await startHostedCheckout(deal.listingId, deal.id);
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "couldn't open the payment page");
      setBusy(false);
    }
  }

  const headline = accepted
    ? deal.kind === "inspection"
      ? `Inspection confirmed for ${deal.scheduledFor ?? "the time you asked"}`
      : bundle
        ? `Bundle agreed at ${formatPrice(deal.amountCents ?? 0)} for ${bundle.length} items`
        : `Deal agreed at ${formatPrice(deal.amountCents ?? 0)}`
    : deal.kind === "inspection"
      ? `Inspection requested for ${deal.scheduledFor ?? "a time that suits"}`
      : bundle
        ? `Bundle offer of ${formatPrice(deal.amountCents ?? 0)} for ${bundle.length} items`
        : `${deal.kind === "quote" ? "Quote" : "Offer"} of ${formatPrice(deal.amountCents ?? 0)}`;

  const repriceLabel = can.mine ? "Change amount" : "Counter";
  const canReprice = can.canRevise || can.canCounter;

  return (
    <div className={cn("flex", fromMe ? "justify-end" : "justify-start")}>
      <div className="w-full max-w-[85%] overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b bg-muted/50 px-3.5 py-2">
          <Icon className="size-4 shrink-0 text-primary" />
          <p className="text-sm font-semibold">{headline}</p>
        </div>

        <div className="px-3.5 py-3">
          {bundle && (
            <div className="mb-2 divide-y overflow-hidden rounded-lg border bg-muted/30">
              {bundle.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs">
                  <span className="line-clamp-1">{item.title}</span>
                  <span className="shrink-0 text-muted-foreground">{formatPrice(item.priceCents)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold">
                <span>Asking total</span>
                <span>{formatPrice(bundle.reduce((sum, i) => sum + i.priceCents, 0))}</span>
              </div>
            </div>
          )}
          {deal.note && <p className="text-sm text-muted-foreground">{deal.note}</p>}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {can.canAccept && (
              <Button size="sm" disabled={busy} onClick={() => void run(() => acceptDeal(deal.id), "Accepted")}>
                <Check className="size-3.5" />
                Accept
              </Button>
            )}
            {can.mine && deal.status === "pending" && (
              <p className="text-xs text-muted-foreground">Waiting for a reply</p>
            )}
            {canReprice && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => setHaggling((h) => !h)}
              >
                <ArrowLeftRight className="size-3.5" />
                {repriceLabel}
              </Button>
            )}
            {can.canDecline && (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => void run(() => declineDeal(deal.id), "Declined")}
              >
                <X className="size-3.5" />
                Decline
              </Button>
            )}
            {can.canWithdraw && (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => void run(() => withdrawDeal(deal.id), "Withdrawn")}
              >
                Withdraw
              </Button>
            )}
          </div>

          {haggling && canReprice && (
            <div className="mt-3 flex items-center gap-2 border-t pt-3">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                autoFocus
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void reprice();
                  }
                }}
                placeholder={((deal.amountCents ?? 0) / 100).toString()}
                className="h-9"
              />
              <Button size="sm" disabled={busy || amount.trim() === ""} onClick={() => void reprice()}>
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : "Send"}
              </Button>
            </div>
          )}

          {can.canPay && (
            <div className="mt-3">
              <Button size="lg" className="w-full font-semibold" disabled={busy} onClick={() => void pay()}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
                Pay {formatPrice(deal.amountCents ?? 0)}
              </Button>
              <p className="mt-1.5 text-center text-xs text-muted-foreground">
                Secure checkout by Pinch Payments
              </p>
            </div>
          )}

          {accepted && !can.canPay && deal.buyerId !== meId && !can.locked && deal.kind !== "inspection" && (
            <p className="mt-2 text-xs text-muted-foreground">Waiting on payment</p>
          )}

          {can.locked && <p className="mt-2 text-xs font-medium text-verified">Paid, held until you confirm</p>}

          {accepted && deal.kind === "inspection" && (
            <p className="mt-2 text-xs font-medium text-verified">Inspection confirmed</p>
          )}

          {(deal.status === "declined" || deal.status === "withdrawn" || deal.status === "countered") && (
            <p className="mt-2 text-xs capitalize text-muted-foreground">{deal.status}</p>
          )}
        </div>
      </div>
    </div>
  );
}
