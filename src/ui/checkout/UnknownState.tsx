import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

// pinch returned a status we don't map — never a stuck spinner, always this screen
export function UnknownState({ paymentId, onDone }: { paymentId: string; onDone: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <HelpCircle className="size-12 text-muted-foreground" />
      <h2 className="font-heading text-xl font-semibold">We're confirming this payment</h2>
      <p className="text-muted-foreground">
        Your payment went through but we're still confirming its status. Don't pay again. Quote the
        ID below if you contact support.
      </p>
      <p className="text-xs text-muted-foreground">Payment ID: {paymentId}</p>
      <Button variant="outline" className="mt-2 w-full" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}
