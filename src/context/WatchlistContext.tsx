import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useSession } from "@/session/SessionContext";
import { getWatchlist, addWatch, removeWatch } from "@/api/watchlist-api";

type WatchlistContextValue = {
  ids: Set<string>;
  count: number;
  isWatched: (id: string) => boolean;
  toggle: (id: string) => void;
};

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const { state } = useSession();
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (state.status !== "signedIn") {
      setIds(new Set());
      return;
    }
    let active = true;
    getWatchlist()
      .then((bundle) => active && setIds(new Set(bundle.ids)))
      .catch(() => {
        /* watchlist is non-critical — leave empty on failure */
      });
    return () => {
      active = false;
    };
  }, [state.status]);

  function toggle(id: string) {
    const watched = ids.has(id);
    // optimistic — flip locally, revert on failure
    setIds((prev) => {
      const next = new Set(prev);
      if (watched) next.delete(id);
      else next.add(id);
      return next;
    });
    const request = watched ? removeWatch(id) : addWatch(id);
    request
      .then(() => toast.success(watched ? "Removed from watchlist" : "Saved to watchlist"))
      .catch((e: unknown) => {
        setIds((prev) => {
          const next = new Set(prev);
          if (watched) next.add(id);
          else next.delete(id);
          return next;
        });
        toast.error(e instanceof Error ? e.message : "couldn't update watchlist");
      });
  }

  const value: WatchlistContextValue = {
    ids,
    count: ids.size,
    isWatched: (id) => ids.has(id),
    toggle,
  };

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist(): WatchlistContextValue {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error("useWatchlist must be used within WatchlistProvider");
  return ctx;
}
