import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import type { ProfileView } from "@/types/User";
import { getProfile } from "@/api/users-api";
import { useSession } from "@/session/SessionContext";
import { ListingCard } from "@/ui/ListingCard";
import { EmptyState } from "@/ui/EmptyState";
import { Breadcrumbs } from "@/ui/Breadcrumbs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/utils/format";
import { hubFor } from "@/utils/hubs";
import { ShieldCheck, PackageOpen, Settings, MapPin } from "lucide-react";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; profile: ProfileView };

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state: session } = useSession();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!id) return;
    let active = true;
    setState({ status: "loading" });
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
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

      {state.status === "loaded" && (
        <>
          <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
                  {state.profile.user.name.split(" ").map((s) => s.charAt(0)).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-heading text-xl font-semibold sm:text-2xl">{state.profile.user.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>{state.profile.user.university}</span>
                  {state.profile.location && (
                    <Badge variant="secondary" className="gap-1 border-transparent bg-primary/10 text-primary">
                      <MapPin className="size-3" />
                      {hubFor(state.profile.location)}
                    </Badge>
                  )}
                  {state.profile.user.verified && (
                    <Badge variant="secondary" className="gap-1 border-transparent bg-verified/12 text-verified">
                      <ShieldCheck className="size-3" />
                      Student checked
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Joined {formatDate(state.profile.joinedAt)}</p>
              </div>
            </div>
            {isMe && (
              <Button variant="outline" onClick={() => navigate("/account")}>
                <Settings className="size-4" />
                Edit profile
              </Button>
            )}
          </div>

          <h2 className="mb-4 mt-8 font-heading text-lg font-semibold">
            {isMe ? "Your active listings" : `Listings from ${state.profile.user.name.split(" ")[0]}`}
          </h2>

          {state.profile.listings.length === 0 ? (
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
              {state.profile.listings.map((l) => (
                <ListingCard key={l.id} listing={l} onOpen={(lid) => navigate(`/listing/${lid}`)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
