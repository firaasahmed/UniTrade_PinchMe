import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Listing } from "@/types/Listing";
import { getWatchlist } from "@/api/watchlist-api";
import { useWatchlist } from "@/context/WatchlistContext";
import { RequireAuth } from "@/ui/RequireAuth";
import { ListingCard } from "@/ui/ListingCard";
import { EmptyState } from "@/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HeartOff } from "lucide-react";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; listings: Listing[] };

export function WatchlistPage() {
  const navigate = useNavigate();
  const { ids } = useWatchlist();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let active = true;
    getWatchlist()
      .then((bundle) => active && setState({ status: "loaded", listings: bundle.listings }))
      .catch((e: unknown) =>
        active && setState({ status: "error", message: e instanceof Error ? e.message : "failed" }),
      );
    return () => {
      active = false;
    };
  }, []);

  // reflect live toggles — a removed listing drops out immediately
  const shown = state.status === "loaded" ? state.listings.filter((l) => ids.has(l.id)) : [];

  return (
    <RequireAuth>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="mb-1 font-heading text-2xl font-semibold sm:text-3xl">Watchlist</h1>
        <p className="mb-6 text-sm text-muted-foreground">Listings you've saved to keep an eye on.</p>

        {state.status === "loading" && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-lg" />
            ))}
          </div>
        )}

        {state.status === "error" && (
          <p className="text-destructive">Couldn't load your watchlist: {state.message}</p>
        )}

        {state.status === "loaded" &&
          (shown.length === 0 ? (
            <EmptyState
              icon={HeartOff}
              title="Nothing saved yet"
              description="Tap the heart on any listing to save it here for later."
              action={
                <Button asChild>
                  <Link to="/buy">Browse the marketplace</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {shown.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  variant="row"
                  onOpen={(id) => navigate(`/listing/${id}`)}
                />
              ))}
            </div>
          ))}
      </div>
    </RequireAuth>
  );
}
