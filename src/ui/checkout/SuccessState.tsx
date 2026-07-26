import type { Listing } from "@/types/Listing";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { formatPrice } from "@/utils/format";

// Official Pinch Payments Portal success confirmation screen
export function SuccessState({
  listing,
  amountCents,
  paymentId,
  onDone,
}: {
  listing: Listing;
  amountCents?: number;
  paymentId: string;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      {/* Pinch Payments Portal Badge & Header */}
      <div className="mb-5 flex w-full flex-col items-center rounded-2xl border border-verified/30 bg-verified/10 p-5">
        <div className="flex size-14 items-center justify-center rounded-full bg-verified text-verified-foreground shadow-md">
          <CheckCircle2 className="size-8" />
        </div>
        <span className="mt-3 text-xs font-bold uppercase tracking-wider text-verified">Pinch Payments Portal</span>
        <h2 className="font-heading text-2xl font-bold text-foreground">Payment Success</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Transaction approved & settled via Pinch Payments
        </p>
      </div>

      {/* Transaction Summary Table */}
      <div className="w-full space-y-2.5 rounded-xl border bg-muted/40 p-4 text-left text-xs">
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Item</span>
          <span className="font-semibold text-foreground truncate max-w-[200px]">{listing.title}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Amount Paid</span>
          <span className="font-bold text-primary">{formatPrice(amountCents ?? listing.priceCents)}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Payment Provider</span>
          <span className="font-semibold text-foreground">Pinch Payments</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Payment Reference</span>
          <span className="font-mono font-medium text-foreground">{paymentId}</span>
        </div>
      </div>

      <Button className="mt-6 w-full font-semibold" size="lg" onClick={onDone}>
        View My Purchases Dashboard
        <ArrowRight className="ml-2 size-4" />
      </Button>
    </div>
  );
}
