import type { ReactNode } from "react";
import type { Listing } from "@/types/Listing";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Package, BedDouble, Bath, PlaneTakeoff } from "lucide-react";
import { formatListingPrice, formatDate } from "@/utils/format";
import { categoryIcon, categoryKind, kindAccent } from "@/utils/categories";
import { ListingMedia } from "@/ui/ListingMedia";
import { WatchlistButton } from "@/ui/WatchlistButton";
import { cn } from "@/lib/utils";

// image-first marketplace card: full-bleed photo with the category chip on it,
// then price loudest, title second, one quiet meta line.
// tile = stacked, for grids/carousels; row = image left, for the watchlist
export function ListingCard({
  listing,
  onOpen,
  variant = "tile",
  topRight,
}: {
  listing: Listing;
  onOpen: (id: string) => void;
  variant?: "tile" | "row";
  topRight?: ReactNode;
}) {
  const Icon = categoryIcon(listing.category);
  const kind = categoryKind(listing.category);
  const accent = kindAccent(kind);
  const sold = listing.status === "sold";
  const row = variant === "row";

  return (
    <div
      onClick={() => onOpen(listing.id)}
      className={cn(
        "group flex h-full cursor-pointer select-none overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-lg",
        row ? "flex-col sm:flex-row" : "flex-col",
      )}
    >
      <div className={cn("relative shrink-0 overflow-hidden", row && "sm:w-60 md:w-64")}>
        <div
          className={cn(
            "overflow-hidden bg-muted",
            row ? "aspect-[4/3] sm:h-full sm:w-full" : "aspect-[4/3]",
          )}
        >
          <div className="size-full transition-transform duration-300 group-hover:scale-[1.04]">
            <ListingMedia listing={listing} />
          </div>
        </div>

        <Badge
          variant="secondary"
          className={cn(
            "absolute bottom-2.5 left-2.5 gap-1 border-transparent bg-background/85 shadow-sm backdrop-blur-sm",
            accent.text,
          )}
        >
          <Icon className="size-3" />
          {listing.category}
        </Badge>

        {/* the seller is leaving — their whole profile is a moving-out sale */}
        {listing.seller.movingOut && !sold && (
          <Badge className="absolute left-2.5 top-2.5 gap-1 border-transparent bg-gold text-gold-foreground shadow-sm">
            <PlaneTakeoff className="size-3" />
            Moving-out sale
          </Badge>
        )}

        <div className="absolute right-2.5 top-2.5 z-10">
          {topRight ?? <WatchlistButton listingId={listing.id} overlay />}
        </div>

        {sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <span className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold uppercase tracking-wide text-background">
              Sold
            </span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3.5 sm:p-4">
        <p className="font-heading text-lg font-bold tracking-tight">
          {formatListingPrice(listing)}
        </p>
        <h3
          className={cn(
            "mt-0.5 text-sm font-medium leading-snug text-foreground/90",
            row ? "line-clamp-1" : "line-clamp-2",
          )}
        >
          {listing.title}
        </h3>

        {/* description only on the wide row card — tiles stay minimal */}
        {row && listing.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{listing.description}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2.5 text-xs text-muted-foreground">
          {kind === "accommodation" ? (
            <>
              {listing.bedrooms !== undefined && (
                <span className="flex items-center gap-1">
                  <BedDouble className="size-3.5" />
                  {listing.bedrooms} bed
                </span>
              )}
              {listing.bathrooms !== undefined && (
                <span className="flex items-center gap-1">
                  <Bath className="size-3.5" />
                  {listing.bathrooms} bath
                </span>
              )}
            </>
          ) : (
            listing.condition && (
              <span className="flex items-center gap-1">
                <Package className="size-3.5" />
                {listing.condition}
              </span>
            )
          )}
          <span className="flex min-w-0 items-center gap-1">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{listing.location}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {formatDate(listing.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
