import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { Listing, TransitMode } from "@/types/Listing";
import { getListing } from "@/api/listings-api";
import { listingImages } from "@/types/Listing";
import { useSession } from "@/session/SessionContext";
import { rememberViewed } from "@/utils/recently-viewed";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Breadcrumbs } from "@/ui/Breadcrumbs";
import { WatchlistButton } from "@/ui/WatchlistButton";
import { DealDialog } from "@/ui/deals/DealDialog";
import { journeyFor } from "@/utils/deal-journey";
import { ListingGallery } from "@/ui/listing/ListingGallery";
import { useCampusDistance } from "@/ui/listing/useCampusDistance";
import { formatListingPrice, formatPrice, formatDate } from "@/utils/format";
import { categoryIcon, categoryKind, kindAccent, type ListingKind } from "@/utils/categories";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Handshake,
  ShieldCheck,
  Tag,
  BedDouble,
  Bath,
  CalendarDays,
  Banknote,
  Sofa,
  Share2,
  Pencil,
  GraduationCap,
  Footprints,
  Bus,
  TrainFront,
  TramFront,
  Ship,
  FileText,
  type LucideIcon,
} from "lucide-react";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; listing: Listing };

const KIND_PATH: Record<ListingKind, string> = {
  item: "/items",
  service: "/services",
  accommodation: "/accommodation",
};

// a sensible opening offer, rounded to a clean number so it reads like a person
function suggestedOfferCents(priceCents: number, kind: ListingKind): number | undefined {
  if (kind === "accommodation") return undefined;
  // a service is booked at the advertised rate — knocking 10% off an hourly rate
  // and rounding to $50 was suggesting $50 for a $60/hr job
  if (kind === "service") return priceCents;
  // items are negotiable, so open slightly under asking
  const target = Math.round((priceCents * 0.9) / 5000) * 5000;
  return Math.max(target, 500);
}

function dealNote(kind: ListingKind): string {
  if (kind === "accommodation") return "Keen to have a look through if it's still available.";
  if (kind === "service") return "Here's what I need — let me know if that time works.";
  return "Can pick up on campus this week.";
}

export function ListingDetail({ id }: { id: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    getListing(id)
      .then((listing) => {
        if (active) setState({ status: "loaded", listing });
      })
      .catch((e: unknown) => {
        if (active) setState({ status: "error", message: e instanceof Error ? e.message : "failed" });
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    rememberViewed(id);
  }, [id]);

  if (state.status === "loading") return <DetailSkeleton />;
  if (state.status === "error")
    return <p className="text-destructive">Couldn't load this listing: {state.message}</p>;

  return <Loaded listing={state.listing} />;
}

function Loaded({ listing }: { listing: Listing }) {
  const navigate = useNavigate();
  const { state } = useSession();
  const Icon = categoryIcon(listing.category);
  const kind = categoryKind(listing.category);
  const accent = kindAccent(kind);
  const me = state.status === "signedIn" ? state.user : null;
  const isOwner = me?.id === listing.sellerId;
  const available = listing.status === "active";
  // items are handed over in person and take no payment, so they need no merchant.
  // anything that ends in a charge needs the seller to be able to receive it
  const sellerCanTransact = kind === "item" || listing.seller.payoutReady;

  const journey = journeyFor(kind);

  function share() {
    void navigator.clipboard
      .writeText(window.location.href)
      .then(() => toast.success("Link copied to clipboard"))
      .catch(() => toast.error("Couldn't copy the link"));
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: accent.label, to: KIND_PATH[kind] },
          { label: listing.title },
        ]}
      />

      {/* Top Hero Section: Photo Gallery + Action Details */}
      <div className="mt-4 grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* Gallery column */}
        <div>
          <ListingGallery images={listingImages(listing)} alt={listing.title} icon={Icon} />
        </div>

        {/* Listing Details & Actions Column */}
        <div className="space-y-4">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className={cn("gap-1 border-transparent", accent.badge)}>
                  <Icon className="size-3" />
                  {listing.category}
                </Badge>
                {!available && (
                  <Badge variant="outline" className="uppercase">
                    {listing.status === "sold" ? "Sold" : "Unavailable"}
                  </Badge>
                )}
              </div>
              {/* compact, equal-sized actions sit up here instead of eating a row below */}
              <div className="flex shrink-0 items-center gap-1.5">
                <WatchlistButton listingId={listing.id} className="size-9 rounded-lg" />
                <Button
                  size="icon"
                  variant="outline"
                  className="size-9"
                  onClick={share}
                  aria-label="Share listing"
                >
                  <Share2 className="size-4" />
                </Button>
              </div>
            </div>

            <h1 className="mt-2 font-heading text-2xl font-semibold sm:text-3xl">{listing.title}</h1>
            <p className="mt-1 text-2xl font-bold text-primary">{formatListingPrice(listing)}</p>
          </div>

          {/* Seller Card */}
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
            <Link
              to={`/profile/${listing.sellerId}`}
              className="flex items-center justify-between rounded-lg p-1 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                    {listing.seller.name.split(" ").map((s) => s.charAt(0)).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium">{listing.seller.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    {listing.seller.verified && <ShieldCheck className="size-3 text-verified" />}
                    {listing.seller.university}
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-primary">View profile</span>
            </Link>
          </div>

          {/* Action Buttons Section */}
          <div className="space-y-2.5">
            {isOwner ? (
              <div className="flex gap-2">
                <Button size="lg" className="flex-1" onClick={() => navigate(`/sell/edit/${listing.id}`)}>
                  <Pencil className="size-4" />
                  Edit listing
                </Button>
                <Button size="lg" variant="outline" onClick={share} aria-label="Share listing">
                  <Share2 className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {/* one door into the transaction: opening a deal starts the conversation too */}
                <DealDialog
                  listingId={listing.id}
                  journey={journey}
                  defaultAmountCents={suggestedOfferCents(listing.priceCents, kind)}
                  defaultNote={dealNote(kind)}
                  defaultWhen={kind === "item" ? undefined : "This week, whenever suits you"}
                  onDone={() => navigate(`/messages?listing=${listing.id}&user=${listing.sellerId}`)}
                  trigger={
                    <Button
                      size="lg"
                      className="w-full text-base font-semibold"
                      disabled={!available || !sellerCanTransact}
                    >
                      <Handshake className="size-4" />
                      {!available
                        ? listing.status === "sold"
                          ? "Sold"
                          : "Unavailable"
                        : sellerCanTransact
                          ? journey.cta
                          : "Not taking bookings yet"}
                    </Button>
                  }
                />

                <p className="text-center text-xs text-muted-foreground">
                  {sellerCanTransact
                    ? journey.ctaHint
                    : "This seller hasn't finished setting up payments, so they can't be paid yet."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full-width 2-column information section for Description & Property Details */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* Left Column: Description Card */}
        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 font-heading text-base font-semibold text-foreground">
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            {kind === "accommodation" ? "About this property" : "Description"}
          </h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {listing.description || "No description provided."}
          </p>
        </div>

        {/* Right Column: Property details / Specifications Card */}
        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
          <h2 className="mb-3 font-heading text-base font-semibold text-foreground">
            {kind === "accommodation" ? "Property details" : "Details"}
          </h2>
          <DetailTable listing={listing} kind={kind} />
          <p className="mt-4 flex items-center gap-2 border-t pt-3 text-sm font-medium text-verified">
          </p>
        </div>
      </div>
    </div>
  );
}

type Row = { icon: LucideIcon; label: string; value: string };

// plain two-column table — no oversized icon tiles
function DetailTable({ listing, kind }: { listing: Listing; kind: ListingKind }) {
  const rows: Row[] = [];
  const distance = useCampusDistance(listing);

  if (kind === "accommodation") {
    if (listing.bedrooms !== undefined) rows.push({ icon: BedDouble, label: "Bedrooms", value: String(listing.bedrooms) });
    if (listing.bathrooms !== undefined) rows.push({ icon: Bath, label: "Bathrooms", value: String(listing.bathrooms) });
    rows.push({ icon: Sofa, label: "Furnished", value: listing.furnished ? "Yes" : "No" });
    if (listing.bondCents !== undefined) rows.push({ icon: Banknote, label: "Bond", value: formatPrice(listing.bondCents) });
    if (listing.availableFrom) rows.push({ icon: CalendarDays, label: "Available from", value: formatDate(listing.availableFrom) });
    if (listing.leaseTerm) rows.push({ icon: CalendarDays, label: "Lease", value: listing.leaseTerm });
  } else if (listing.condition) {
    rows.push({
      icon: Tag,
      label: kind === "service" ? "Availability" : "Condition",
      value: listing.condition,
    });
  }

  rows.push({ icon: MapPin, label: "Location", value: listing.location });
  if (kind === "accommodation" && distance) {
    rows.push({
      icon: GraduationCap,
      label: "From campus",
      value: `${distance.label} in a straight line`,
    });
  }
  if (listing.meetup) {
    rows.push({
      icon: Handshake,
      label: kind === "accommodation" ? "Inspection" : "Meetup",
      value: listing.meetup,
    });
  }
  rows.push({ icon: CalendarDays, label: "Posted", value: formatDate(listing.createdAt) });

  return (
    <>
      <dl className="divide-y text-sm">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[9rem_1fr] gap-4 py-2.5">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <r.icon className="size-3.5 shrink-0" />
              {r.label}
            </dt>
            <dd className="font-medium">{r.value}</dd>
          </div>
        ))}
      </dl>
      <TransitChips listing={listing} />
    </>
  );
}

const TRANSIT_ICON: Record<TransitMode, LucideIcon> = {
  walk: Footprints,
  bus: Bus,
  train: TrainFront,
  tram: TramFront,
  ferry: Ship,
};

// travel times come from the host — we say so rather than passing them off as measured
function TransitChips({ listing }: { listing: Listing }) {
  if (!listing.transit || listing.transit.length === 0) return null;
  return (
    <div className="mt-4 border-t pt-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Getting around
      </p>
      <ul className="flex flex-wrap gap-2">
        {listing.transit.map((t) => {
          const Icon = TRANSIT_ICON[t.mode];
          return (
            <li
              key={`${t.mode}-${t.to}`}
              className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-xs"
            >
              <Icon className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="font-medium">{t.minutes} min</span>
              <span className="text-muted-foreground">
                {t.mode === "walk" ? "walk" : `by ${t.mode}`} to {t.to}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">Times as stated by the TFNSW</p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div>
      <Skeleton className="mb-4 h-5 w-64" />
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-[4/3] rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  );
}
