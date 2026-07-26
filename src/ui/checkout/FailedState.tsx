import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export function FailedState({
  reason,
  paymentId,
  onRetry,
  onCancel,
}: {
  reason: string;
  paymentId: string;
  onRetry: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <XCircle className="size-12 text-destructive" />
      <h2 className="font-heading text-xl font-semibold">Payment failed</h2>
      <p className="text-muted-foreground">
        Your payment was declined. <span className="text-foreground">{reason}</span>.
      </p>
      {paymentId && <p className="text-xs text-muted-foreground">Payment ID: {paymentId}</p>}
      <div className="mt-2 flex w-full gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
}
