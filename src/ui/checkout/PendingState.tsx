import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

// payment is in progress (e.g. direct debit) — not failed, resolves later
export function PendingState({ paymentId, onDone }: { paymentId: string; onDone: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <Clock className="size-12 text-amber-500" />
      <h2 className="font-heading text-xl font-semibold">Payment processing</h2>
      <p className="text-muted-foreground">
        This payment is being processed. We'll confirm it once it clears. No need to pay again.
      </p>
      <p className="text-xs text-muted-foreground">Payment ID: {paymentId}</p>
      <Button variant="outline" className="mt-2 w-full" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}
