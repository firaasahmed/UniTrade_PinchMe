import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Listing } from "@/types/Listing";
import { createDeal } from "@/api/deals-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ListingMedia } from "@/ui/ListingMedia";
import { formatPrice } from "@/utils/format";
import { Loader2, PlaneTakeoff } from "lucide-react";

function toCents(v: string): number | undefined {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : undefined;
}

// a friendly opening number for the lot: 85% of the combined asking price, rounded to $5
function suggestedCents(totalCents: number): number {
  return Math.max(Math.round((totalCents * 0.85) / 500) * 500, 500);
}

// one offer covering several listings from a moving-out seller.
// the first item anchors the deal, so the conversation lands on its thread
export function BundleOfferDialog({
  items,
  sellerName,
  open,
  onOpenChange,
  onDone,
}: {
  items: Listing[];
  sellerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: (anchorListingId: string) => void;
}) {
  const total = useMemo(() => items.reduce((sum, l) => sum + l.priceCents, 0), [items]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("Happy to take the lot off your hands before you fly out.");
  const [busy, setBusy] = useState(false);

  // refresh the suggestion whenever the dialog opens on a new selection
  function handleOpenChange(next: boolean) {
    if (next) setAmount(String(suggestedCents(total) / 100));
    onOpenChange(next);
  }

  const cents = toCents(amount);

  async function submit() {
    const anchor = items[0];
    if (cents === undefined || items.length < 2 || !anchor) {
      toast.error("Enter a valid amount");
      return;
    }
    setBusy(true);
    try {
      await createDeal({
        listingId: anchor.id,
        kind: "offer",
        amountCents: cents,
        note: note.trim(),
        bundleListingIds: items.map((l) => l.id),
      });
      toast.success("Bundle offer sent");
      onOpenChange(false);
      onDone(anchor.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlaneTakeoff className="size-4 text-gold-foreground" />
            Offer for the lot
          </DialogTitle>
          <DialogDescription>
            One offer to {sellerName} covering all {items.length} items — they can accept or
            counter, and one payment settles the lot.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-48 divide-y overflow-y-auto rounded-xl border border-border/70 bg-muted/40">
          {items.map((l) => (
            <div key={l.id} className="flex items-center gap-2.5 p-2">
              <div className="size-10 shrink-0 overflow-hidden rounded-md">
                <ListingMedia listing={l} iconClass="size-4" />
              </div>
              <p className="min-w-0 flex-1 truncate text-sm">{l.title}</p>
              <p className="shrink-0 text-sm text-muted-foreground">{formatPrice(l.priceCents)}</p>
            </div>
          ))}
          <div className="flex items-center justify-between p-2 px-2.5 text-sm font-semibold">
            <span>Asking total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="bundle-amount">Your offer for everything ($)</Label>
            <Input
              id="bundle-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
            {cents !== undefined && cents < total && (
              <p className="text-xs text-muted-foreground">
                {formatPrice(total - cents)} under the combined asking price
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bundle-note">Message (optional)</Label>
            <Textarea
              id="bundle-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything they should know"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => void submit()} disabled={busy || cents === undefined}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            Send bundle offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
