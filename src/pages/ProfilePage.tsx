import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { ProfileView } from "@/types/User";
import { getProfile } from "@/api/users-api";
import { useSession } from "@/session/SessionContext";
import { ListingCard } from "@/ui/ListingCard";
import { EmptyState } from "@/ui/EmptyState";
import { Breadcrumbs } from "@/ui/Breadcrumbs";
import { BundleOfferDialog } from "@/ui/deals/BundleOfferDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatPrice } from "@/utils/format";
import { hubFor } from "@/utils/hubs";
import { categoryKind } from "@/utils/categories";
import { cn } from "@/lib/utils";
import { ShieldCheck, PackageOpen, Settings, MapPin, PlaneTakeoff, Check, X } from "lucide-react";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; profile: ProfileView };

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state: session } = useSession();
  const [state, setState] = useState<State>({ status: "loading" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setState({ status: "loading" });
    setSelected(new Set());
    getProfile(id)
      .then((profile) => active && setState({ status: "loaded", profile }))
      .catch((e: unknown) =>
        active && setState({ status: "error", message: e instanceof Error ? e.message : "failed" }),
      );
    return () => {
      active = false;
    };
  }, [id]);

  const isMe = session.status === "signedIn" && session.user.id === id;
  const profile = state.status === "loaded" ? state.profile : null;
  const movingOut = profile?.user.movingOut ?? false;

  // only plain items can go in a bundle — rooms and services follow their own journeys
  const bundleable = useMemo(
    () =>
      (profile?.listings ?? []).filter(
        (l) => categoryKind(l.category) === "item" && l.status === "active",
      ),
    [profile],
  );
  // buyers see selection circles when there's genuinely a lot to bundle
  const canBundle = movingOut && !isMe && bundleable.length >= 2;

  const selectedItems = bundleable.filter((l) => selected.has(l.id));
  const selectedTotal = selectedItems.reduce((sum, l) => sum + l.priceCents, 0);

  function toggle(listingId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(listingId)) next.delete(listingId);
      else next.add(listingId);
      return next;
    });
  }

  function openOffer() {
    if (session.status !== "signedIn") {
      toast.info("Sign in to make a bundle offer");
      navigate("/login");
      return;
    }
    setDialogOpen(true);
  }

  return (
    <div className={cn("mx-auto max-w-7xl px-4 py-6", selectedItems.length > 0 && "pb-28")}>
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Profile" }]} />

      {state.status === "loading" && (
        <div className="space-y-6">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {state.status === "error" && (
        <p className="text-destructive">Couldn't load this profile: {state.message}</p>
      )}

      {profile && (
        <>
          <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
                  {profile.user.name.split(" ").map((s) => s.charAt(0)).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-heading text-xl font-semibold sm:text-2xl">{profile.user.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>{profile.user.university}</span>
                  {profile.location && (
                    <Badge variant="secondary" className="gap-1 border-transparent bg-primary/10 text-primary">
                      <MapPin className="size-3" />
                      {hubFor(profile.location)}
                    </Badge>
                  )}
                  {profile.user.verified && (
                    <Badge variant="secondary" className="gap-1 border-transparent bg-verified/12 text-verified">
                      <ShieldCheck className="size-3" />
                      Student checked
                    </Badge>
                  )}
                  {movingOut && (
                    <Badge className="gap-1 border-transparent bg-gold text-gold-foreground">
                      <PlaneTakeoff className="size-3" />
                      Moving out
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Joined {formatDate(profile.joinedAt)}</p>
              </div>
            </div>
            {isMe && (
              <Button variant="outline" onClick={() => navigate("/account")}>
                <Settings className="size-4" />
                Edit profile
              </Button>
            )}
          </div>

          {movingOut && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-r from-gold/25 via-gold/10 to-transparent p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold text-gold-foreground shadow-sm">
                    <PlaneTakeoff className="size-5" />
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-bold">
                      {isMe ? "Your moving-out sale is live" : "Moving-out sale — everything must go"}
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {isMe
                        ? "Buyers can pick several of your items and send one offer for the lot. Turn this off any time in account settings."
                        : canBundle
                          ? `${profile.user.name.split(" ")[0]} is leaving soon. Tick the items you want and make one offer for the lot.`
                          : `${profile.user.name.split(" ")[0]} is leaving soon — grab their things before they're gone.`}
                    </p>
                  </div>
                </div>
                {canBundle && selectedItems.length === 0 && (
                  <Button
                    variant="outline"
                    className="shrink-0 border-gold/50 bg-background/70"
                    onClick={() => setSelected(new Set(bundleable.map((l) => l.id)))}
                  >
                    <Check className="size-4" />
                    Select all {bundleable.length} items
                  </Button>
                )}
              </div>
            </div>
          )}

          <h2 className="mb-4 mt-8 font-heading text-lg font-semibold">
            {isMe ? "Your active listings" : `Listings from ${profile.user.name.split(" ")[0]}`}
          </h2>

          {profile.listings.length === 0 ? (
            <EmptyState
              icon={PackageOpen}
              title="No active listings"
              description={isMe ? "Anything you publish will show up here." : "This student has nothing listed right now."}
              action={
                isMe ? (
                  <Button asChild>
                    <Link to="/sell/new">Create a listing</Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {profile.listings.map((l) => {
                const selectable = canBundle && bundleable.some((b) => b.id === l.id);
                const isSelected = selected.has(l.id);
                return (
                  <div
                    key={l.id}
                    className={cn(
                      "rounded-2xl transition-shadow",
                      isSelected && "ring-2 ring-gold ring-offset-2 ring-offset-background",
                    )}
                  >
                    <ListingCard
                      listing={l}
                      onOpen={(lid) => navigate(`/listing/${lid}`)}
                      topRight={
                        selectable ? (
                          <SelectCircle selected={isSelected} onToggle={() => toggle(l.id)} />
                        ) : undefined
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* the running tally — slides up once something is ticked */}
          {selectedItems.length > 0 && (
            <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 shadow-[0_-8px_30px_rgb(0,0,0,0.08)] backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">
                    {selectedItems.length} item{selectedItems.length === 1 ? "" : "s"} selected
                    <span className="ml-2 font-normal text-muted-foreground">
                      asking {formatPrice(selectedTotal)} combined
                    </span>
                  </p>
                  {selectedItems.length < 2 && (
                    <p className="text-xs text-muted-foreground">Pick at least one more to bundle</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                    <X className="size-4" />
                    Clear
                  </Button>
                  <Button
                    className="bg-gold font-semibold text-gold-foreground hover:bg-gold/90"
                    disabled={selectedItems.length < 2}
                    onClick={openOffer}
                  >
                    <PlaneTakeoff className="size-4" />
                    Offer for the lot
                  </Button>
                </div>
              </div>
            </div>
          )}

          <BundleOfferDialog
            items={selectedItems}
            sellerName={profile.user.name.split(" ")[0] ?? profile.user.name}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onDone={(anchorId) => navigate(`/messages?listing=${anchorId}&user=${profile.user.id}`)}
          />
        </>
      )}
    </div>
  );
}

// the tick circle on each selectable card — stops the click from opening the listing
function SelectCircle({ selected, onToggle }: { selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label={selected ? "Remove from bundle" : "Add to bundle"}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "flex size-8 items-center justify-center rounded-full border-2 shadow-sm transition-all",
        selected
          ? "border-gold bg-gold text-gold-foreground"
          : "border-border bg-background/90 text-transparent backdrop-blur-sm hover:border-gold hover:text-gold/50",
      )}
    >
      <Check className="size-4" strokeWidth={3} />
    </button>
  );
}
