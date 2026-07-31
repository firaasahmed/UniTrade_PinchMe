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
import { InspectionPicker, type InspectionChoice } from "@/ui/deals/InspectionPicker";
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
  const [choice, setChoice] = useState<InspectionChoice>({ kind: "none" });
  const [busy, setBusy] = useState(false);

  function onOpenChange(next: boolean) {
    if (next && state.status !== "signedIn") {
      toast.info("Sign in to continue");
      navigate("/login");
      return;
    }
    // the picker remounts empty, so the pending choice has to go with it
    if (!next) setChoice({ kind: "none" });
    setOpen(next);
  }

  const needsAmount = journey.amountLabel !== null;
  const isInspection = journey.deal === "inspection";
  const needsTime = journey.timeLabel !== null && !isInspection;
  const valid =
    (!needsAmount || toCents(amount) !== undefined) &&
    (!needsTime || when.trim() !== "") &&
    (!isInspection || choice.kind !== "none");

  async function submit() {
    if (!valid) {
      toast.error(needsAmount ? "Enter a valid amount" : "Pick a time");
      return;
    }
    setBusy(true);
    try {
      // clear anything from a previous take so each run starts from an empty thread
      const payload = {
        amountCents: needsAmount ? toCents(amount) : undefined,
        scheduledFor: isInspection
          ? choice.kind === "request"
            ? choice.text
            : undefined
          : needsTime
            ? when.trim()
            : undefined,
        scheduledAt: choice.kind === "slot" ? choice.at : undefined,
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

        {/* min-w-0 or a wide child (the inspection day strip) stretches the dialog */}
        <div className="min-w-0 space-y-4">
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
          {isInspection && (
            <InspectionPicker listingId={listingId} value={choice} onChange={setChoice} />
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
