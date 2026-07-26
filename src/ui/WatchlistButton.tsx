import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { useSession } from "@/session/SessionContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { cn } from "@/lib/utils";

// overlay = circular button for cards; otherwise an outlined square button for detail
export function WatchlistButton({
  listingId,
  overlay = false,
  className,
}: {
  listingId: string;
  overlay?: boolean;
  className?: string;
}) {
  const { state } = useSession();
  const { isWatched, toggle } = useWatchlist();
  const navigate = useNavigate();
  const watched = isWatched(listingId);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (state.status !== "signedIn") {
      toast.info("Sign in to save listings");
      navigate("/login");
      return;
    }
    toggle(listingId);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={watched ? "Remove from watchlist" : "Save to watchlist"}
      aria-pressed={watched}
      className={cn(
        "inline-flex items-center justify-center transition-colors",
        overlay
          ? "size-9 rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur hover:bg-background"
          : "size-11 rounded-lg border hover:bg-accent",
        className,
      )}
    >
      <Heart className={cn("size-5", watched ? "fill-destructive text-destructive" : "text-foreground")} />
    </button>
  );
}
