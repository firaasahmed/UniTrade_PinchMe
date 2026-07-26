import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { Journey } from "@/utils/deal-journey";
import type { DealView } from "@/types/Deal";
import { createDeal, counterDeal } from "@/api/deals-api";
import { useSession } from "@/session/SessionContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

function toCents(v: string): number | undefined {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : undefined;
}

// opens a new proposal, or counters an existing one when counterOf is given
export function DealDialog({
  listingId,
  journey,
  trigger,
  buyerId,
  counterOf,
  onDone,
  defaultAmountCents,
  defaultNote,
  defaultWhen,
}: {
  listingId: string;
  journey: Journey;
  trigger: ReactNode;
  buyerId?: string;
  counterOf?: DealView;
  onDone?: (deal: DealView) => void;
  // prefilled so the buyer can send in one tap
  defaultAmountCents?: number;
  defaultNote?: string;
  defaultWhen?: string;
  // wipes the conversation first so a re-recorded take looks brand new
}) {
  const { state } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(
    defaultAmountCents !== undefined ? String(defaultAmountCents / 100) : "",
  );
  const [when, setWhen] = useState(defaultWhen ?? "");
  const [note, setNote] = useState(defaultNote ?? "");
  const [busy, setBusy] = useState(false);

  function onOpenChange(next: boolean) {
    if (next && state.status !== "signedIn") {
      toast.info("Sign in to continue");
      navigate("/login");
      return;
    }
    setOpen(next);
  }

  const needsAmount = journey.amountLabel !== null;
  const needsTime = journey.timeLabel !== null;
  const valid = (!needsAmount || toCents(amount) !== undefined) && (!needsTime || when.trim() !== "");

  async function submit() {
    if (!valid) {
      toast.error(needsAmount ? "Enter a valid amount" : "Suggest a time");
      return;
    }
    setBusy(true);
    try {
      // clear anything from a previous take so each run starts from an empty thread
      const payload = {
        amountCents: needsAmount ? toCents(amount) : undefined,
        scheduledFor: needsTime ? when.trim() : undefined,
        note: note.trim(),
      };
      const deal = counterOf
        ? await counterDeal(counterOf.id, payload)
        : await createDeal({ listingId, kind: journey.deal, buyerId, ...payload });
      toast.success(counterOf ? "Counter sent" : "Sent");
      setOpen(false);
      onDone?.(deal);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{counterOf ? "Send a counter" : journey.dialogTitle}</DialogTitle>
          <DialogDescription>{journey.ctaHint}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {needsAmount && (
            <div className="grid gap-2">
              <Label htmlFor="deal-amount">{journey.amountLabel}</Label>
              <Input
                id="deal-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>
          )}
          {needsTime && (
            <div className="grid gap-2">
              <Label htmlFor="deal-when">{journey.timeLabel}</Label>
              <Input
                id="deal-when"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                placeholder="e.g. Saturday 2 Aug, 10am"
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="deal-note">Message (optional)</Label>
            <Textarea
              id="deal-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything they should know"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => void submit()} disabled={busy || !valid}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {counterOf ? "Send counter" : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
