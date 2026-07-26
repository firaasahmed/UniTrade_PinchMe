import type { Listing } from "@/types/Listing";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { formatPrice } from "@/utils/format";

// money moved and the buyer is confirmed; the flag is an internal-only note
export function SuccessFlaggedState({
  listing,
  paymentId,
  onDone,
}: {
  listing: Listing;
  paymentId: string;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <CheckCircle2 className="size-12 text-verified" />
      <h2 className="font-heading text-xl font-semibold">Paid</h2>
      <p className="text-muted-foreground">
        You paid <span className="font-medium text-foreground">{formatPrice(listing.priceCents)}</span> for{" "}
        {listing.title}.
      </p>
      <p className="text-xs text-muted-foreground">Payment ID: {paymentId}</p>
      <Button className="mt-2 w-full" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}
