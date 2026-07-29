import { useNavigate } from "react-router-dom";
import type { Listing } from "@/types/Listing";
import { ListingCard } from "@/ui/ListingCard";
import { ServiceRow } from "@/ui/browse/ServiceRow";
import { EmptyState } from "@/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchX } from "lucide-react";

export type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; listings: Listing[] };

// every browse screen renders results the same way, including when there aren't any
export function ResultsList({
  state,
  results,
  services,
  onReset,
}: {
  state: LoadState;
  results: Listing[];
  // services read as rows with a rate rather than cards with a price
  services: boolean;
  onReset: () => void;
}) {
  const navigate = useNavigate();

  if (state.status === "loading") {
    return services ? (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return <p className="text-destructive">Couldn't load listings: {state.message}</p>;
  }

  if (results.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="Nothing matches those filters"
        description="Try widening your price range, or clearing a filter."
        action={
          <Button variant="outline" onClick={onReset}>
            Clear filters
          </Button>
        }
      />
    );
  }

  const open = (id: string) => navigate(`/listing/${id}`);

  // services read as rows (rate + provider), everything else as an image-first grid
  if (services) {
    return (
      <div className="space-y-3">
        {results.map((l) => (
          <ServiceRow key={l.id} listing={l} onOpen={open} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {results.map((l) => (
        <ListingCard key={l.id} listing={l} onOpen={open} />
      ))}
    </div>
  );
}
