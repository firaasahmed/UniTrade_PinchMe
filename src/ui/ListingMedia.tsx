import { useState } from "react";
import type { Listing } from "@/types/Listing";
import { categoryIcon } from "@/utils/categories";

// listing image with a clean category placeholder fallback (also used if the image fails to load)
export function ListingMedia({ listing, iconClass = "size-10" }: { listing: Listing; iconClass?: string }) {
  const [failed, setFailed] = useState(false);
  const Icon = categoryIcon(listing.category);
  const showImage = listing.imageUrl !== "" && !failed;

  return (
    <div className="flex size-full items-center justify-center bg-muted">
      {showImage ? (
        <img
          src={listing.imageUrl}
          alt={listing.title}
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
          <Icon className={iconClass} />
          <span className="text-xs font-medium">{listing.category}</span>
        </div>
      )}
    </div>
  );
}
