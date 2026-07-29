import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { Listing } from "@/types/Listing";
import { getListing, getListings } from "@/api/listings-api";
import { listingImages } from "@/types/Listing";
import { useSession } from "@/session/SessionContext";
import { rememberViewed } from "@/utils/recently-viewed";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Breadcrumbs } from "@/ui/Breadcrumbs";
import { WatchlistButton } from "@/ui/WatchlistButton";
import { ListingCard } from "@/ui/ListingCard";
import { DealDialog } from "@/ui/deals/DealDialog";
import { journeyFor } from "@/utils/deal-journey";
import { ListingGallery } from "@/ui/listing/ListingGallery";
import { formatListingPrice, formatPrice, formatDate, initials } from "@/utils/format";
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
  Lock,
  Clock,
  PlaneTakeoff,
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
  const target = Math.round((priceCents * 0.9) / 5000) * 5000;
  return Math.max(target, 500);
}

function dealNote(kind: ListingKind): string {
  if (kind === "accommodation") return "Keen to have a look through if it's still available.";
  if (kind === "service") return "Here's what I need, let me know what you'd charge.";
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
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <p className="text-destructive">Couldn't load this listing: {state.message}</p>
      </div>
    );

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

  const journey = journeyFor(kind);

  function share() {
    void navigator.clipboard
      .writeText(window.location.href)
      .then(() => toast.success("Link copied to clipboard"))
      .catch(() => toast.error("Couldn't copy the link"));
  }

  const dealProps = {
    listingId: listing.id,
    listing,
    journey,
    defaultAmountCents: suggestedOfferCents(listing.priceCents, kind),
    defaultNote: dealNote(kind),
    defaultWhen: kind === "item" ? undefined : "This week, whenever suits you",
    onDone: () => navigate(`/messages?listing=${listing.id}&user=${listing.sellerId}`),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-24 lg:pb-10">
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: accent.label, to: KIND_PATH[kind] },
          { label: listing.title },
        ]}
      />

      <div className="mt-2 grid gap-8 lg:grid-cols-2 lg:gap-10">
        {/* gallery stays in view while the right column scrolls */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ListingGallery images={listingImages(listing)} alt={listing.title} icon={Icon} />
        </div>

        <div className="min-w-0">
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

          <h1 className="mt-3 font-heading text-2xl font-semibold leading-snug sm:text-3xl">
            {listing.title}
          </h1>

          {/* price is the decision — it leads, big and dark */}
          <p className="mt-2 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            {formatListingPrice(listing)}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="size-4" />
              {listing.location}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-4" />
              Posted {formatDate(listing.createdAt)}
            </span>
          </div>

          {/* the transaction panel — CTA, journey, trust — before any long text */}
          <div className="mt-5 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
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
              <>
                {/* one door into the transaction: opening a deal starts the conversation too */}
                <DealDialog
                  {...dealProps}
                  trigger={
                    <Button size="lg" className="w-full text-base font-semibold" disabled={!available}>
                      <Handshake className="size-4" />
                      {available
                        ? journey.cta
                        : listing.status === "sold"
                          ? "Sold"
                          : "Unavailable"}
                    </Button>
                  }
                />
                <p className="mt-2 text-center text-xs text-muted-foreground">{journey.ctaHint}</p>

                <ol className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t pt-4 sm:grid-cols-4">
                  {journey.steps.map((step, i) => (
                    <li key={step} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                          accent.badge,
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="leading-tight">{step}</span>
                    </li>
                  ))}
                </ol>

                <p className="mt-4 flex items-center justify-center gap-x-4 border-t pt-3.5 text-xs font-medium text-muted-foreground">
                  <span className="flex items-center gap-1.5 text-verified">
                    <ShieldCheck className="size-3.5" />
                    Verified student seller
                  </span>
                  {journey.paysOnAccept && (
                    <span className="flex items-center gap-1.5">
                      <Lock className="size-3.5" />
                      Paid securely via Pinch
                    </span>
                  )}
                </p>
              </>
            )}
          </div>

          {/* seller */}
          <div className="mt-4 rounded-2xl border border-border/70 bg-card p-3 shadow-sm">
            <Link
              to={`/profile/${listing.sellerId}`}
              className="flex items-center justify-between rounded-xl p-1.5 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-11">
                  <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                    {initials(listing.seller.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-semibold">{listing.seller.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    {listing.seller.verified && <ShieldCheck className="size-3 text-verified" />}
                    {listing.seller.university}
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-primary">View profile</span>
            </Link>

            {/* leaving soon — steer buyers to the storefront where they can bundle */}
            {listing.seller.movingOut && !isOwner && (
              <Link
                to={`/profile/${listing.sellerId}`}
                className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-gold/40 bg-gold/10 p-3 transition-colors hover:bg-gold/20"
              >
                <div className="flex items-center gap-2.5">
                  <PlaneTakeoff className="size-4 shrink-0 text-gold-foreground" />
                  <p className="text-xs leading-relaxed text-foreground/80">
                    <span className="font-semibold">
                      {listing.seller.name.split(" ")[0]} is moving out.
                    </span>{" "}
                    Bundle several of their items into one offer for a better price.
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-gold-foreground">See the sale</span>
              </Link>
            )}
          </div>

          {/* long-form content after the decision block */}
          <div className="mt-6">
            <h2 className="font-heading text-base font-semibold">
              {kind === "accommodation"
                ? "About this place"
                : kind === "service"
                  ? "About this service"
                  : "About this item"}
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {listing.description || "No description provided."}
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <h2 className="mb-3 font-heading text-base font-semibold text-foreground">
              {kind === "accommodation" ? "Property details" : "Details"}
            </h2>
            <DetailTable listing={listing} kind={kind} />
          </div>
        </div>
      </div>

      <MoreLikeThis current={listing} kind={kind} />

      {/* mobile: the decision follows you down the page */}
      {!isOwner && available && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-4 py-3 shadow-[0_-4px_16px_rgb(0_0_0/0.06)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-heading text-lg font-bold leading-tight">
                {formatListingPrice(listing)}
              </p>
              <p className="truncate text-xs text-muted-foreground">{listing.title}</p>
            </div>
            <DealDialog
              {...dealProps}
              trigger={
                <Button size="lg" className="shrink-0 font-semibold">
                  <Handshake className="size-4" />
                  {journey.cta}
                </Button>
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

// four more from the same kind, so the page never dead-ends
function MoreLikeThis({ current, kind }: { current: Listing; kind: ListingKind }) {
  const navigate = useNavigate();
  const [related, setRelated] = useState<Listing[]>([]);

  useEffect(() => {
    let active = true;
    getListings()
      .then((all) => {
        if (!active) return;
        setRelated(
          all.filter(
            (l) =>
              l.id !== current.id && l.status === "active" && categoryKind(l.category) === kind,
          ),
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [current.id, kind]);

  const shown = useMemo(() => related.slice(0, 4), [related]);
  if (shown.length === 0) return null;

  return (
    <section className="mt-12 border-t pt-8">
      <div className="mb-5 flex items-end justify-between gap-3">
        <h2 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">More like this</h2>
        <Button asChild variant="outline" size="sm">
          <Link to={KIND_PATH[kind]}>View all</Link>
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {shown.map((l) => (
          <ListingCard key={l.id} listing={l} onOpen={(id) => navigate(`/listing/${id}`)} />
        ))}
      </div>
    </section>
  );
}

type Row = { icon: LucideIcon; label: string; value: string };

// plain two-column table — no oversized icon tiles
function DetailTable({ listing, kind }: { listing: Listing; kind: ListingKind }) {
  const rows: Row[] = [];

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
  if (listing.meetup) {
    rows.push({
      icon: Handshake,
      label: kind === "accommodation" ? "Inspection" : "Meetup",
      value: listing.meetup,
    });
  }
  rows.push({ icon: CalendarDays, label: "Posted", value: formatDate(listing.createdAt) });

  return (
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
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Skeleton className="mb-4 hidden h-5 w-64 sm:block" />
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <Skeleton className="aspect-[4/3] rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
