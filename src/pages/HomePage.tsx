import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Listing } from "@/types/Listing";
import { getListings } from "@/api/listings-api";
import { categoryKind, type ListingKind } from "@/utils/categories";
import { useSession } from "@/session/SessionContext";
import { HorizontalListingScroll } from "@/ui/HorizontalListingScroll";
import { ItemCategoriesModal } from "@/ui/ItemCategoriesModal";
import { Reveal } from "@/ui/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BadgeCheck,
  GraduationCap,
  Handshake,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  type LucideIcon,
} from "lucide-react";

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
      <CategoryShowcase />
      <HowItWorks />

      <div className="mx-auto max-w-7xl px-4 pt-4 pb-6">
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
        {state.status === "loaded" && <Rows listings={state.listings} />}
      </div>

      <DealsBanner />
      <FinalCta />
    </div>
  );
}

/* ------------------------------ hero ------------------------------ */

const HERO_SHOTS = [
  { src: "/listings/room-balcony.jpg", alt: "Room with a balcony", label: "Rooms near campus" },
  { src: "/listings/laptop-1.jpg", alt: "Laptop for sale", label: "Laptops & tech" },
  { src: "/listings/tutoring-1.jpg", alt: "Tutoring session", label: "Tutoring & services" },
];

const STATS = [
  { value: "100%", label: "verified students" },
  { value: "14", label: "universities recognised" },
  { value: "$0", label: "to join and list" },
  { value: "1 thread", label: "from offer to payment" },
];

function Hero() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    navigate(q.trim() ? `/buy?q=${encodeURIComponent(q.trim())}` : "/buy");
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-nav-from to-nav-to text-primary-foreground">
      {/* atmosphere: soft colour glows + faint dot grid */}
      <div className="pointer-events-none absolute -top-32 -left-32 size-[30rem] rounded-full bg-gold/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-32 size-[30rem] rounded-full bg-verified/15 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pt-16 pb-16 sm:pt-24 sm:pb-20 lg:grid-cols-[1.1fr_minmax(0,26rem)] lg:items-center lg:gap-20">
        <div className="max-w-2xl">
          <span className="inline-flex animate-in fade-in slide-in-from-bottom-3 items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-gold duration-700">
            <GraduationCap className="size-3.5" />
            The marketplace for Australian uni students
          </span>

          <h1 className="mt-6 animate-in fade-in slide-in-from-bottom-4 font-heading text-4xl font-extrabold leading-[1.08] tracking-tight duration-700 sm:text-6xl">
            Everything you need
            <br />
            for uni life,{" "}
            <span className="bg-gradient-to-r from-gold via-amber-200 to-gold bg-clip-text text-transparent">
              student to student
            </span>
          </h1>

          <p className="mt-5 max-w-xl animate-in fade-in slide-in-from-bottom-4 text-base leading-relaxed text-primary-foreground/70 duration-1000 sm:text-lg">
            Rooms, textbooks, laptops and a hand moving in. Every account is a
            verified student and every payment is protected — no strangers, no
            cash, no bond scams.
          </p>

          <form
            onSubmit={submit}
            className="mt-8 flex max-w-xl animate-in fade-in slide-in-from-bottom-4 gap-2 duration-1000"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Try “desk”, “chem textbook”, “room near UNSW”…"
                className="h-13 rounded-2xl border-transparent bg-primary-foreground pl-11 text-foreground shadow-xl shadow-black/20 placeholder:text-muted-foreground focus-visible:ring-gold/40"
                aria-label="Search listings"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-13 rounded-2xl bg-gold px-7 font-semibold text-gold-foreground shadow-xl shadow-gold/20 transition-transform hover:scale-[1.03] hover:bg-gold/90"
            >
              Search
            </Button>
          </form>

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

        {/* photo stack — desktop only, stays inside its own column */}
        <div className="relative hidden h-[27rem] animate-in fade-in zoom-in-95 duration-1000 lg:block" aria-hidden>
          {HERO_SHOTS.map((shot, i) => (
            <figure
              key={shot.src}
              className={cn(
                "absolute w-60 overflow-hidden rounded-2xl bg-card shadow-2xl shadow-black/40 ring-1 ring-primary-foreground/15 transition-transform duration-300 hover:z-10 hover:scale-105 hover:rotate-0",
                i === 0 && "left-0 top-2 -rotate-3",
                i === 1 && "right-0 top-28 rotate-2",
                i === 2 && "left-14 bottom-0 -rotate-2",
              )}
            >
              <img src={shot.src} alt={shot.alt} className="aspect-[4/3] w-full object-cover" />
              <figcaption className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-foreground">
                <BadgeCheck className="size-3.5 text-verified" />
                {shot.label}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      {/* stats band anchoring the hero */}
      <div className="relative border-t border-primary-foreground/10 bg-primary-foreground/[0.04]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 py-6 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="px-3 text-center">
              <p className="font-heading text-2xl font-extrabold text-gold sm:text-3xl">{s.value}</p>
              <p className="mt-0.5 text-xs text-primary-foreground/60 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
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

/* --------------------------- category showcase --------------------------- */

type Pathway = {
  kind: ListingKind;
  title: string;
  blurb: string;
  image: string;
  chip: string;
};

// literal colour classes so tailwind's scanner keeps them
const PATHWAYS: Pathway[] = [
  {
    kind: "accommodation",
    title: "Accommodation",
    blurb: "Rooms, sublets and semester leases near campus.",
    image: "/listings/room-furnished.jpg",
    chip: "bg-gold text-gold-foreground",
  },
  {
    kind: "item",
    title: "Items",
    blurb: "Desks, laptops, textbooks, furniture and more.",
    image: "/listings/monitor-1.jpg",
    chip: "bg-primary-foreground text-primary",
  },
  {
    kind: "service",
    title: "Services",
    blurb: "Tutoring, moving help, cleaning and repairs.",
    image: "/listings/moving-1.jpg",
    chip: "bg-verified text-verified-foreground",
  },
];

const KIND_PATH: Record<ListingKind, string> = {
  item: "/items",
  service: "/services",
  accommodation: "/accommodation",
};

function CategoryShowcase() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-16 pb-4">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-verified">
          Start anywhere
        </p>
        <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Three ways in
        </h2>
      </Reveal>

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {PATHWAYS.map((p, i) => (
          <Reveal key={p.kind} delay={i * 130}>
            <PathwayCard pathway={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function PathwayCard({ pathway }: { pathway: Pathway }) {
  const navigate = useNavigate();
  return (
    <div className="group relative h-80 overflow-hidden rounded-3xl shadow-lg ring-1 ring-black/5">
      <img
        src={pathway.image}
        alt={pathway.title}
        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/5" />

      <div className="absolute inset-x-0 bottom-0 p-5 text-primary-foreground">
        <span
          className={cn(
            "inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
            pathway.chip,
          )}
        >
          {pathway.title}
        </span>
        <p className="mt-2.5 text-sm text-primary-foreground/85">{pathway.blurb}</p>

        <div className="mt-4 flex gap-2">
          {pathway.kind === "item" ? (
            <ItemCategoriesModal
              trigger={
                <Button size="sm" className="flex-1 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                  Browse
                </Button>
              }
            />
          ) : (
            <Button
              size="sm"
              className="flex-1 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              onClick={() => navigate(KIND_PATH[pathway.kind])}
            >
              Browse
            </Button>
          )}
          <Button
            asChild
            size="sm"
            className="flex-1 border border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground backdrop-blur-sm hover:bg-primary-foreground/20"
          >
            <Link to={`/sell/new?kind=${pathway.kind}`}>
              <Tag className="size-3.5" />
              Sell
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- how it works ---------------------------- */

const STEPS: { icon: LucideIcon; title: string; body: string; accent: string }[] = [
  {
    icon: ShieldCheck,
    title: "Verify with your uni email",
    body: "Sign up with any recognised Australian university address. Everyone you deal with is a real student.",
    accent: "bg-verified/12 text-verified",
  },
  {
    icon: Handshake,
    title: "Agree the deal in messages",
    body: "Make an offer, counter, and settle on a price — the whole negotiation lives in one thread.",
    accent: "bg-primary/10 text-primary",
  },
  {
    icon: Lock,
    title: "Pay safely through Pinch",
    body: "Card details go straight to Pinch's hosted checkout and never touch our servers. No cash handovers.",
    accent: "bg-gold/25 text-gold-foreground",
  },
];

function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-16 pb-12">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-verified">
          How it works
        </p>
        <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Three steps, and the money is the safe part
        </h2>
      </Reveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <Reveal key={step.title} delay={i * 130} className="h-full">
              <div className="relative h-full rounded-3xl border border-border/70 bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                <span className="absolute right-6 top-4 font-heading text-5xl font-extrabold text-muted-foreground/10">
                  {i + 1}
                </span>
                <div className={cn("flex size-11 items-center justify-center rounded-xl", step.accent)}>
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 font-heading text-base font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
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
