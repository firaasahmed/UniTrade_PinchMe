import type { Listing } from "@/types/Listing";
import { ListingMedia } from "@/ui/ListingMedia";
import { formatListingPrice } from "@/utils/format";
import { ShieldCheck, MapPin, ChevronRight } from "lucide-react";

// services are priced by the hour and led by the provider, so they get their own row:
// photo left, title + provider in the middle, the rate loudest on the right
export function ServiceRow({ listing, onOpen }: { listing: Listing; onOpen: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(listing.id)}
      className="group flex w-full items-center gap-4 rounded-2xl border border-border/60 bg-card p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-verified/40 hover:shadow-md sm:gap-5 sm:p-4"
    >
      <div className="size-20 shrink-0 overflow-hidden rounded-xl sm:size-24">
        <div className="size-full transition-transform duration-300 group-hover:scale-[1.05]">
          <ListingMedia listing={listing} iconClass="size-6" />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 font-heading text-[0.95rem] font-semibold leading-tight">
          {listing.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{listing.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            {listing.seller.verified && <ShieldCheck className="size-3.5 text-verified" />}
            {listing.seller.name}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {listing.location}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 self-center sm:gap-3">
        <span className="whitespace-nowrap font-heading text-base font-bold text-verified sm:text-lg">
          {formatListingPrice(listing)}
        </span>
        <ChevronRight className="size-5 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}
