import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getBrandDeals, type BrandDealView } from "@/api/brand-deals-api";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/session/SessionContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ShieldCheck, Copy, Sparkles } from "lucide-react";

function BrandLogo({ deal }: { deal: BrandDealView }) {
  // simple geometric marks so fictional brands still read as logos
  const base = "bg-white/90";
  return (
    <div className={cn("flex size-16 items-center justify-center rounded-2xl shadow-md", deal.tile)}>
      {deal.logo === "circle" && <div className={cn(base, "size-8 rounded-full")} />}
      {deal.logo === "square" && <div className={cn(base, "size-7 rounded-md")} />}
      {deal.logo === "diamond" && <div className={cn(base, "size-7 rotate-45 rounded-md")} />}
      {deal.logo === "ring" && <div className="size-8 rounded-full border-4 border-white/90" />}
      {deal.logo === "triangle" && (
        <div className="size-0 border-x-[14px] border-b-[24px] border-x-transparent border-b-white/90" />
      )}
      {deal.logo === "bolt" && <Sparkles className="size-8 text-white/90" />}
    </div>
  );
}

export function DealsPage() {
  const { state } = useSession();
  const signedIn = state.status === "signedIn";
  const verified = signedIn && state.user.verified;
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [deals, setDeals] = useState<BrandDealView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // codes come back null until the server sees a verified student
  useEffect(() => {
    let active = true;
    getBrandDeals()
      .then((d) => active && setDeals(d))
      .catch((e: unknown) => active && setError(e instanceof Error ? e.message : "failed"));
    return () => {
      active = false;
    };
  }, [signedIn, verified]);

  function reveal(deal: BrandDealView) {
    if (!deal.code) {
      toast.info("Sign in with a verified university email to unlock deals");
      return;
    }
    setRevealed((prev) => new Set(prev).add(deal.id));
  }

  function copy(deal: BrandDealView) {
    if (!deal.code) return;
    void navigator.clipboard
      .writeText(deal.code)
      .then(() => toast.success(`${deal.code} copied`))
      .catch(() => toast.error("Couldn't copy the code"));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-verified to-[oklch(0.5_0.1_190)] px-6 py-10 shadow-lg sm:px-10">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white">
          <ShieldCheck className="size-3.5" />
          Student only perks
        </span>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Student deals
        </h1>
        <p className="mt-2 max-w-xl text-white/85">
          Being a student doesn't just keep the marketplace safe, it unlocks discounts
          with partner brands.
        </p>
        {!verified && (
          <p className="mt-4 inline-block rounded-lg bg-white/10 px-3 py-2 text-sm text-white/90">
            {signedIn
              ? "Confirm your university email to unlock these codes."
              : "Sign in with your university email to unlock the codes below."}
          </p>
        )}
      </section>

      {error && <p className="text-destructive">Couldn't load deals: {error}</p>}

      {deals === null && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(deals ?? []).map((deal) => (
          <div key={deal.id} className="flex flex-col rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <BrandLogo deal={deal} />
              <Badge variant="secondary" className="border-transparent bg-gold/25 text-gold-foreground">
                {deal.discount}
              </Badge>
            </div>
            <h3 className="mt-4 font-heading text-lg font-semibold">{deal.brand}</h3>
            <p className="text-sm text-muted-foreground">{deal.tagline}</p>
            <p className="mt-1 text-xs text-muted-foreground">{deal.category}</p>

            <div className="mt-4 flex-1" />

            {revealed.has(deal.id) && deal.code ? (
              <button
                onClick={() => copy(deal)}
                className="flex items-center justify-between rounded-lg border border-dashed border-verified/60 bg-verified/8 px-3 py-2 font-mono text-sm font-semibold text-verified"
              >
                {deal.code}
                <Copy className="size-4" />
              </button>
            ) : (
              <Button variant="outline" onClick={() => reveal(deal)}>
                <ShieldCheck className="size-4 text-verified" />
                Reveal student code
              </Button>
            )}
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Partner brands shown are illustrative. Codes are issued to verified students only.
      </p>
    </div>
  );
}
