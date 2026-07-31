import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Listing } from "@/types/Listing";
import { getListings } from "@/api/listings-api";
import { categoryKind } from "@/utils/categories";
import { useSession } from "@/session/SessionContext";
import { HorizontalListingScroll } from "@/ui/HorizontalListingScroll";
import { Reveal } from "@/ui/Reveal";
import { PinchHeroPanel } from "@/ui/home/PinchShowcase";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  BadgeCheck,
  GraduationCap,
  Handshake,
  Lock,
  PlaneTakeoff,
  ShieldCheck,
  Sparkles,
  Tag,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatPrice, initials } from "@/utils/format";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; listings: Listing[] };

export function HomePage() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let active = true;
    getListings()
      .then((listings) => active && setState({ status: "loaded", listings }))
      .catch((e: unknown) =>
        active && setState({ status: "error", message: e instanceof Error ? e.message : "failed" }),
      );
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <Hero />
      <UniMarquee />

      <div className="mx-auto max-w-7xl px-4 pt-8 pb-6 sm:pt-10">
        <Reveal className="mb-6 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-verified">
              Fresh on campus
            </p>
            <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Live listings from verified students
            </h2>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link to="/buy">
              Browse all
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Link>
          </Button>
        </Reveal>

        {state.status === "loading" && <RowSkeleton />}
        {state.status === "error" && (
          <p className="text-destructive">Couldn't load listings: {state.message}</p>
        )}
        {state.status === "loaded" && (
          <>
            <Rows listings={state.listings} />
            <MovingOutSales listings={state.listings} />
          </>
        )}
      </div>

      <DealsBanner />
      <FinalCta />
    </div>
  );
}

/* ------------------------------ hero ------------------------------ */

const FLOW_STEPS = [
  { icon: ShieldCheck, label: "Verify uni email" },
  { icon: Handshake, label: "Agree the deal" },
  { icon: Lock, label: "Pay via Pinch" },
] as const;

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-nav-from to-nav-to text-primary-foreground">
      <div className="pointer-events-none absolute -top-32 -left-32 size-[30rem] rounded-full bg-gold/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-32 size-[30rem] rounded-full bg-verified/15 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto grid max-w-[90rem] grid-cols-1 items-center gap-10 px-6 pt-12 pb-12 sm:px-8 sm:pt-16 sm:pb-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,40rem)] lg:gap-14 xl:gap-16">
        <div className="min-w-0 max-w-xl lg:max-w-none">
          <h1 className="animate-in fade-in slide-in-from-bottom-4 font-heading text-4xl font-extrabold leading-[1.1] tracking-tight duration-700 sm:text-5xl lg:text-[2.75rem] xl:text-5xl 2xl:text-6xl">
            Everything you need
            <br />
            for uni life,{" "}
            <span className="bg-gradient-to-r from-gold via-amber-200 to-gold bg-clip-text text-transparent">
              student to student
            </span>
          </h1>

          <p className="mt-5 max-w-xl animate-in fade-in slide-in-from-bottom-4 text-base text-primary-foreground/70 duration-1000 sm:text-lg">
            Verified students. Protected payments. No strangers, no cash drama.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-2.5 text-sm text-primary-foreground/65">
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="size-4 text-verified" />
              Verified uni emails only
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="size-4 text-gold" />
              Secure payments via Pinch
            </span>
          </div>
        </div>

        <div className="relative min-w-0 pb-6 lg:pb-4">
          <PinchHeroPanel />
        </div>
      </div>

      <div className="relative border-t border-primary-foreground/10 bg-primary-foreground/[0.04]">
        <ol className="mx-auto flex max-w-3xl flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-center sm:gap-2 sm:px-8 sm:py-6">
          {FLOW_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={step.label} className="flex items-center gap-3 sm:gap-2">
                <div className="flex items-center gap-3 sm:flex-col sm:gap-2 sm:px-3 sm:text-center">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10 ring-1 ring-primary-foreground/15">
                    <Icon className="size-4 text-gold" />
                  </span>
                  <span className="text-sm font-medium text-primary-foreground/85">{step.label}</span>
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <ArrowRight
                    className="size-4 shrink-0 text-primary-foreground/35 sm:mx-1"
                    aria-hidden
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* --------------------------- university marquee --------------------------- */

const UNIS = [
  "UNSW Sydney",
  "University of Sydney",
  "University of Melbourne",
  "Monash University",
  "University of Newcastle",
  "UTS",
  "ANU",
  "University of Queensland",
  "RMIT",
  "Macquarie University",
  "Deakin University",
  "University of Adelaide",
  "Griffith University",
  "Curtin University",
];

function UniMarquee() {
  const row = UNIS.map((u) => (
    <span key={u} className="flex shrink-0 items-center gap-3 pr-10">
      <GraduationCap className="size-4 text-muted-foreground/50" />
      <span className="whitespace-nowrap text-sm font-medium text-muted-foreground">{u}</span>
    </span>
  ));

  return (
    <section className="border-b bg-background py-5" aria-label="Recognised universities">
      <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
        Recognised across 14 Australian universities
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex w-max animate-marquee">
          {row}
          {UNIS.map((u) => (
            <span key={`${u}-dup`} className="flex shrink-0 items-center gap-3 pr-10" aria-hidden>
              <GraduationCap className="size-4 text-muted-foreground/50" />
              <span className="whitespace-nowrap text-sm font-medium text-muted-foreground">{u}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------- moving-out storefronts ---------------------- */

type MovingOutSale = {
  sellerId: string;
  name: string;
  university: string;
  verified: boolean;
  items: Listing[];
  totalCents: number;
};

function MovingOutSales({ listings }: { listings: Listing[] }) {
  const sales = useMemo(() => {
    const bySeller = new Map<string, MovingOutSale>();
    for (const l of listings) {
      if (!l.seller.movingOut || l.status !== "active") continue;
      if (categoryKind(l.category) !== "item") continue;
      const existing = bySeller.get(l.sellerId);
      if (existing) {
        existing.items.push(l);
        existing.totalCents += l.priceCents;
      } else {
        bySeller.set(l.sellerId, {
          sellerId: l.sellerId,
          name: l.seller.name,
          university: l.seller.university,
          verified: l.seller.verified,
          items: [l],
          totalCents: l.priceCents,
        });
      }
    }
    return [...bySeller.values()].filter((s) => s.items.length >= 2);
  }, [listings]);

  if (sales.length === 0) return null;

  return (
    <Reveal className="mt-12 mb-4">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-gold-foreground">
            Leaving soon
          </p>
          <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Moving-out sales
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Students flying home. Pick several items and make one offer for the lot.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sales.map((sale) => (
          <Link
            key={sale.sellerId}
            to={`/profile/${sale.sellerId}`}
            className="group relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-gold/20 via-card to-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-12 ring-2 ring-gold/40">
                  <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                    {initials(sale.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-heading text-base font-bold">{sale.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    {sale.verified && <ShieldCheck className="size-3 text-verified" />}
                    {sale.university}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold text-gold-foreground">
                <PlaneTakeoff className="size-3" />
                Moving out
              </span>
            </div>

            <div className="mt-4 flex -space-x-2">
              {sale.items.slice(0, 4).map((l) => (
                <div
                  key={l.id}
                  className="size-14 overflow-hidden rounded-xl border-2 border-card shadow-sm sm:size-16"
                >
                  <img src={l.imageUrl} alt={l.title} className="size-full object-cover" />
                </div>
              ))}
              {sale.items.length > 4 && (
                <div className="flex size-14 items-center justify-center rounded-xl border-2 border-card bg-muted text-xs font-semibold text-muted-foreground sm:size-16">
                  +{sale.items.length - 4}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{sale.items.length} items</span>
                {" · "}asking {formatPrice(sale.totalCents)}
              </p>
              <span className="flex items-center gap-1 text-sm font-semibold text-gold-foreground transition-transform group-hover:translate-x-0.5">
                Browse the sale
                <ArrowRight className="size-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Reveal>
  );
}

/* ---------------------------- listing rows ---------------------------- */

function Rows({ listings }: { listings: Listing[] }) {
  const rows = useMemo(() => {
    const byKind = (k: string) => listings.filter((l) => categoryKind(l.category) === k);
    return {
      accommodation: byKind("accommodation"),
      services: byKind("service"),
      items: byKind("item"),
    };
  }, [listings]);

  return (
    <>
      <Reveal>
        <HorizontalListingScroll title="Rooms & rentals" listings={rows.accommodation} />
      </Reveal>
      <Reveal>
        <HorizontalListingScroll title="Student services" listings={rows.services} />
      </Reveal>
      <Reveal>
        <HorizontalListingScroll title="Kit out your place" listings={rows.items} />
      </Reveal>
    </>
  );
}

function RowSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-48" />
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] flex-1 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/* ---------------------------- deals banner ---------------------------- */

function DealsBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16">
      <Reveal>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-nav-from to-nav-to px-6 py-10 text-primary-foreground sm:px-10">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-gold/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/4 size-56 rounded-full bg-verified/15 blur-3xl" />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-gold">
              <Sparkles className="size-3.5" />
              Student deals
            </span>
            <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Discounts unlocked by your student status
            </h2>
            <p className="mt-2 text-sm text-primary-foreground/75 sm:text-base">
              Verified students get exclusive codes for software, food, and travel —
              released only after your uni email checks out.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="shrink-0 rounded-xl bg-gold text-gold-foreground shadow-lg hover:bg-gold/90"
          >
            <Link to="/deals">
              See student deals
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------ final cta ------------------------------ */

function FinalCta() {
  const { state } = useSession();
  const signedIn = state.status === "signedIn";

  return (
    <section className="border-t bg-hero">
      <Reveal className="mx-auto max-w-3xl px-4 py-16 text-center">
        <GraduationCap className="mx-auto size-10 text-primary" />
        <h2 className="mt-4 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          {signedIn
            ? "Finished with something? Someone's arriving who needs it."
            : "Join with your uni email — takes a minute"}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          {signedIn
            ? "List it in a couple of minutes — photos come straight off your device."
            : "Any recognised Australian university address works. Verify once, then buy, sell and message freely."}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {signedIn ? (
            <>
              <Button asChild size="lg" className="rounded-xl">
                <Link to="/sell/new">
                  <Tag className="size-4" />
                  List something
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl">
                <Link to="/buy">Browse the marketplace</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="lg" className="rounded-xl">
                <Link to="/register">Create your account</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl">
                <Link to="/buy">Browse first</Link>
              </Button>
            </>
          )}
        </div>
      </Reveal>
    </section>
  );
}
