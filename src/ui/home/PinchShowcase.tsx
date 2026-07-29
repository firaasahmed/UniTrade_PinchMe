import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PinchSecureLine } from "@/ui/brand/PinchLogo";
import { cn } from "@/lib/utils";
import { Handshake, Laptop, Lock, ShieldCheck } from "lucide-react";

const OFFERS = [520, 540, 560] as const;
const ASKING = 620;

/**
 * Pinch demo for the navy hero — breakdown + browser mockup side by side.
 * Browser card sits slightly crooked and snaps straight on hover.
 */
export function PinchHeroPanel() {
  const [offer, setOffer] = useState<(typeof OFFERS)[number]>(520);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
    const timers = [400, 1100, 1900, 2700].map((ms, i) =>
      window.setTimeout(() => setStep(i + 1), ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [offer]);

  const held = step >= 3;

  return (
    <div className="relative w-full animate-in fade-in zoom-in-95 duration-1000">
      {/* clear gap between the two cards — no squeeze */}
      <div className="flex flex-col items-stretch gap-6 sm:flex-row sm:items-center sm:gap-8">
        {/* money breakdown */}
        <div className="w-full shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-card text-foreground shadow-2xl shadow-black/30 sm:w-[15.5rem] lg:w-[16.5rem]">
          <div className="divide-y">
            <BreakdownRow
              icon={Laptop}
              label="Listing asking price"
              value={`$${ASKING}.00`}
              chip="bg-primary/15 text-primary/70"
              show={step >= 1}
            />
            <BreakdownRow
              icon={Handshake}
              label="You and the seller agree"
              value={`$${offer}.00`}
              valueClass="text-primary"
              chip="bg-primary text-primary-foreground"
              show={step >= 2}
            />
            <BreakdownRow
              icon={Lock}
              label="Charged once via Pinch"
              value={`$${offer}.00`}
              valueClass="text-verified"
              chip="bg-verified text-verified-foreground"
              show={step >= 3}
            />
          </div>

          <div className="px-3.5 pt-1.5">
            <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={cn("bg-primary/30 transition-all duration-700", step >= 1 ? "w-[35%]" : "w-0")} />
              <div className={cn("bg-primary transition-all duration-700", step >= 2 ? "w-[35%]" : "w-0")} />
              <div className={cn("bg-verified transition-all duration-700", step >= 3 ? "w-[30%]" : "w-0")} />
            </div>
          </div>

          <div
            className={cn(
              "m-3 mt-2.5 flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-500",
              held ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide">
              <ShieldCheck className="size-3.5" />
              {held ? "Deal locked in" : "Waiting…"}
            </span>
            <span className="font-heading text-sm font-bold">
              {held ? `$${offer}.00 paid` : "—"}
            </span>
          </div>
        </div>

        {/* browser mockup — crooked until hover; no overlapping badge */}
        <div
          className={cn(
            "group w-full min-w-0 flex-1 origin-center transition-transform duration-300 ease-out",
            "sm:rotate-2 sm:hover:rotate-0",
          )}
        >
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card text-foreground shadow-2xl shadow-black/40 transition-shadow duration-300 group-hover:shadow-[0_20px_50px_rgb(0,0,0,0.35)]">
            <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-2.5">
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
              <div className="ml-1.5 flex-1 truncate rounded-md bg-background px-2.5 py-1 text-[11px] text-muted-foreground">
                unitrade.app/messages · deal with Aiko
              </div>
            </div>

            <div className="space-y-3.5 p-4 sm:p-5">
              <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-2.5">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Laptop className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">Laptop, great for uni work</p>
                  <p className="text-xs text-muted-foreground">Asking ${ASKING} · Kensington</p>
                </div>
                <span className="rounded-full bg-verified/12 px-2 py-0.5 text-[10px] font-semibold text-verified">
                  Offer accepted
                </span>
              </div>

              <div>
                <p className="text-sm font-semibold">Your settled offer</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Aiko accepted. Pick a number to see how Pinch charges it.
                </p>
                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  {OFFERS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setOffer(n)}
                      className={cn(
                        "rounded-xl border py-2.5 text-sm font-semibold transition-all",
                        offer === n
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-background hover:border-primary/40",
                      )}
                    >
                      ${n}.00
                    </button>
                  ))}
                </div>
              </div>

              <div
                className={cn(
                  "rounded-xl border p-3 transition-all duration-500",
                  held ? "border-verified/40 bg-verified/5" : "border-border/70 bg-muted/20",
                )}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">You pay via Pinch</span>
                  <span className="font-heading text-lg font-bold">${offer}.00</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Held until you confirm meetup</span>
                  <span className="font-medium text-verified">Protected</span>
                </div>
              </div>

              <Button asChild size="lg" className="w-full font-semibold">
                <Link to="/register">
                  <Lock className="size-4" />
                  Pay ${offer}.00 securely
                </Link>
              </Button>

              <PinchSecureLine label="Processed securely by" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BreakdownRow({
  icon: Icon,
  label,
  value,
  valueClass,
  chip,
  show,
}: {
  icon: typeof Laptop;
  label: string;
  value: string;
  valueClass?: string;
  chip: string;
  show: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 px-3.5 py-3 transition-all duration-500",
        show ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0",
      )}
    >
      <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", chip)}>
        <Icon className="size-3.5" />
      </div>
      <p className="min-w-0 flex-1 text-xs leading-snug text-muted-foreground sm:text-[0.8rem]">
        {label}
      </p>
      <p className={cn("shrink-0 font-heading text-sm font-bold", valueClass)}>{value}</p>
    </div>
  );
}
