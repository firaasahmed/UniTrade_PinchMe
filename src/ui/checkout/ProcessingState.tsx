import { Loader2 } from "lucide-react";

// shared view for the transient states: TOKENISING and SUBMITTING
export function ProcessingState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
