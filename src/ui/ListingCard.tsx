import type { ReactNode } from "react";
import type { Listing } from "@/types/Listing";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Package, BedDouble, Bath, GraduationCap } from "lucide-react";
import { formatListingPrice, formatDate } from "@/utils/format";
import { categoryIcon, categoryKind, kindAccent } from "@/utils/categories";
import { ListingMedia } from "@/ui/ListingMedia";
import { WatchlistButton } from "@/ui/WatchlistButton";
import { useCampusDistance } from "@/ui/listing/useCampusDistance";
import { cn } from "@/lib/utils";

// unit-main style: flat white card, plain border, image inset with its own radius
// row = image left, content right (stacks on mobile); tile = always stacked, for carousels/grids
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
  const distance = useCampusDistance(listing);

  return (
    <div
      onClick={() => onOpen(listing.id)}
      className={cn(
        "flex h-full cursor-pointer select-none overflow-hidden rounded-xl border border-border/70 bg-card shadow-md transition-colors hover:border-primary/50",
        row ? "flex-col sm:flex-row" : "flex-col",
      )}
    >
      <div className={cn("relative shrink-0 p-2", row && "sm:w-64 md:w-72")}>
        <div
          className={cn(
            "overflow-hidden rounded-md bg-muted",
            row ? "aspect-[3/2] sm:h-44 sm:w-full md:h-48" : "aspect-[4/3]",
          )}
        >
          <ListingMedia listing={listing} />
        </div>
        <div className="absolute right-4 top-4 z-10">
          {topRight ?? <WatchlistButton listingId={listing.id} overlay />}
        </div>
        {sold && (
          <div className="absolute inset-2 flex items-center justify-center rounded-md bg-background/60 backdrop-blur-[1px]">
            <span className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold uppercase tracking-wide text-background">
              Sold
            </span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4 pt-2 sm:pt-4">
        <h3 className={cn("font-semibold leading-snug", row ? "line-clamp-1" : "line-clamp-2")}>
          {listing.title}
        </h3>

        {/* description only on the wide row card — tiles stay minimal */}
        {row && listing.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{listing.description}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 text-xs text-muted-foreground">
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
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {listing.location}
          </span>
          {kind === "accommodation" && distance && (
            <span className="flex items-center gap-1">
              <GraduationCap className="size-3.5" />
              {distance.label}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {formatDate(listing.createdAt)}
          </span>
          <Badge variant="secondary" className={cn("gap-1 border-transparent", accent.badge)}>
            <Icon className="size-3" />
            {listing.category}
          </Badge>
        </div>

        <div className="mt-2 pt-1">
          <p className="whitespace-nowrap text-sm font-bold text-price">{formatListingPrice(listing)}</p>
        </div>
      </div>
    </div>
  );
}
