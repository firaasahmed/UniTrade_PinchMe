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
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-xl" />
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
  return (
    <div className="space-y-3">
      {results.map((l) =>
        services ? (
          <ServiceRow key={l.id} listing={l} onOpen={open} />
        ) : (
          <ListingCard key={l.id} listing={l} variant="row" onOpen={open} />
        ),
      )}
    </div>
  );
}
