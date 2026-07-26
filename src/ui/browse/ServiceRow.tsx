import type { Listing } from "@/types/Listing";
import { ListingMedia } from "@/ui/ListingMedia";
import { Badge } from "@/components/ui/badge";
import { formatListingPrice } from "@/utils/format";
import { ShieldCheck, ChevronRight } from "lucide-react";

// services are priced by the hour and have no condition, so they get their own row
export function ServiceRow({ listing, onOpen }: { listing: Listing; onOpen: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(listing.id)}
      className="flex w-full items-center gap-4 rounded-xl border bg-card p-3 text-left shadow-sm transition-colors hover:border-verified/50"
    >
      <div className="size-16 shrink-0 overflow-hidden rounded-lg sm:size-20">
        <ListingMedia listing={listing} iconClass="size-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h3 className="font-medium leading-tight">{listing.title}</h3>
          <span className="text-sm font-semibold text-verified">{formatListingPrice(listing)}</span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{listing.description}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {listing.condition && (
            <Badge variant="secondary" className="border-transparent bg-verified/12 text-verified">
              {listing.condition}
            </Badge>
          )}
          <span>{listing.location}</span>
          <span className="flex items-center gap-1">
            {listing.seller.verified && <ShieldCheck className="size-3 text-verified" />}
            {listing.seller.name}
          </span>
        </div>
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </button>
  );
}
