import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Listing } from "@/types/Listing";
import { getListings } from "@/api/listings-api";
import { categoryKind, type ListingKind } from "@/utils/categories";
import { HorizontalListingScroll } from "@/ui/HorizontalListingScroll";
import { ItemCategoriesModal } from "@/ui/ItemCategoriesModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  BadgeCheck,
  Lock,
  MapPin,
  Armchair,
  Wrench,
  Home,
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
      {/* full-bleed so it continues straight out of the navbar */}
      <Hero />
      <div className="mx-auto max-w-7xl px-4 py-6">
        {state.status === "loading" && <RowSkeleton />}
        {state.status === "error" && (
          <p className="text-destructive">Couldn't load listings: {state.message}</p>
        )}
        {state.status === "loaded" && <Rows listings={state.listings} />}
      </div>
    </div>
  );
}

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
      <HorizontalListingScroll
        title="Rooms & rentals"
        listings={rows.accommodation}
      />
      <HorizontalListingScroll
        title="Student services"
        listings={rows.services}
      />
      <HorizontalListingScroll title="Kit out your place" listings={rows.items} />
    </>
  );
}

type Pathway = {
  kind: ListingKind;
  title: string;
  blurb: string;
  icon: LucideIcon;
  chip: string;
  topBar: string;
};

// literal colour classes so tailwind's scanner keeps them
const PATHWAYS: Pathway[] = [
  {
    kind: "accommodation",
    title: "Accommodation",
    blurb: "Rooms, sublets, and semester leases near campus.",
    icon: Home,
    chip: "bg-gold/25 text-gold-foreground",
    topBar: "bg-gold",
  },
  {
    kind: "item",
    title: "Items",
    blurb: "Desks, laptops, textbooks, furniture, and more.",
    icon: Armchair,
    chip: "bg-primary/10 text-primary",
    topBar: "bg-primary",
  },
  {
    kind: "service",
    title: "Services",
    blurb: "Tutoring, moving help, cleaning, and repairs.",
    icon: Wrench,
    chip: "bg-verified/12 text-verified",
    topBar: "bg-verified",
  },
];

function Hero() {
  return (
    <section className="bg-[#f0f1ff] text-foreground px-4 pb-10 pt-8 sm:pt-12">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Your <span className="text-primary">University</span> Marketplace
        </h1>
        <TrustBand />
      </div>

      {/* the three pathways live inside the hero itself */}
      <div className="mx-auto mt-8 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3">
        {PATHWAYS.map((p) => (
          <PathwayCard key={p.kind} pathway={p} />
        ))}
      </div>
    </section>
  );
}

const KIND_PATH: Record<ListingKind, string> = {
  item: "/items",
  service: "/services",
  accommodation: "/accommodation",
};

function PathwayCard({ pathway }: { pathway: Pathway }) {
  const navigate = useNavigate();
  const Icon = pathway.icon;
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-lg">
      <div className="flex h-full flex-col p-5 pb-4">
        <div className={cn("flex size-10 items-center justify-center rounded-xl", pathway.chip)}>
          <Icon className="size-5" />
        </div>
        <h3 className="mt-3 font-heading text-lg font-semibold">{pathway.title}</h3>
        <p className="mt-1 flex-1 text-sm text-muted-foreground">{pathway.blurb}</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {pathway.kind === "item" ? (
            <ItemCategoriesModal trigger={<Button size="sm">Browse</Button>} />
          ) : (
            <Button size="sm" onClick={() => navigate(KIND_PATH[pathway.kind])}>
              Browse
            </Button>
          )}
          <Button asChild size="sm" variant="outline">
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

function TrustBand() {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground sm:gap-x-8">
      <span className="flex items-center gap-1.5">
        <BadgeCheck className="size-4 text-verified" />
        Verified students
      </span>
      <span className="flex items-center gap-1.5">
        <Lock className="size-4 text-primary" />
        Secure payments via Pinch
      </span>
      <span className="flex items-center gap-1.5">
        <MapPin className="size-4 text-gold-foreground" />
        On-campus meetups
      </span>
    </div>
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
