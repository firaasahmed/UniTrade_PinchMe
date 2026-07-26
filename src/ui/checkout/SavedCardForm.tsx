import type { Listing } from "@/types/Listing";
import type { CardInput } from "@/lib/capture";
import { formatPrice } from "@/utils/format";
import { ShieldCheck, Check, CreditCard, ChevronRight } from "lucide-react";

const FORCE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Approve" },
  { value: "insufficient-funds", label: "Insufficient funds" },
  { value: "invalid-card", label: "Invalid card" },
  { value: "blocked-by-bank", label: "Blocked by bank" },
];

// visa/mastercard from the leading digit, enough for a card-on-file row
function brandOf(cardNumber: string): string {
  if (cardNumber.startsWith("4")) return "Visa";
  if (cardNumber.startsWith("5")) return "Mastercard";
  return "Card";
}

// one saved card, and picking it is the payment
export function SavedCardForm({
  listing,
  amountCents,
  card,
  email,
  forceOutcome,
  fieldError,
  onForceOutcomeChange,
  onPay,
}: {
  listing: Listing;
  amountCents?: number;
  card: CardInput;
  email: string;
  forceOutcome: string;
  fieldError?: string;
  onForceOutcomeChange: (v: string) => void;
  onPay: () => void;
}) {
  const total = amountCents ?? listing.priceCents;
  const last4 = card.cardNumber.slice(-4);
  const expiry = `${card.expiryMonth.padStart(2, "0")}/${card.expiryYear.slice(-2)}`;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <span className="text-muted-foreground">Paying for {listing.title}</span>
        <span className="text-lg font-semibold">{formatPrice(total)}</span>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Select a payment method
        </p>

        <button
          type="button"
          onClick={onPay}
          className="group flex w-full items-center gap-3 rounded-xl border-2 border-primary bg-primary/5 p-3.5 text-left transition-colors hover:bg-primary/10"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CreditCard className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-semibold">
              {brandOf(card.cardNumber)}
              <span className="font-mono tracking-widest text-muted-foreground">•••• {last4}</span>
              <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                Default
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {card.cardHolderName} · Expires {expiry}
            </p>
            <p className="mt-1 text-xs font-semibold text-primary">
              Pay {formatPrice(total)} with this card
            </p>
          </div>
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-3.5 group-hover:hidden" />
            <ChevronRight className="hidden size-4 group-hover:block" />
          </span>
        </button>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs">
        <span className="text-muted-foreground">Receipt to</span>
        <span className="font-medium">{email}</span>
      </div>

      {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 text-verified" />
        Charged securely by Pinch. We never see your card number.
      </p>

      <div className="flex items-center justify-between rounded-md border border-dashed p-2 text-xs text-muted-foreground">
        <label htmlFor="forceOutcome">Test outcome</label>
        <select
          id="forceOutcome"
          value={forceOutcome}
          onChange={(e) => onForceOutcomeChange(e.target.value)}
          className="rounded border bg-background px-2 py-1"
        >
          {FORCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
