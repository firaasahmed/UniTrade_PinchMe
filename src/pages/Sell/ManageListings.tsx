import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import type { Listing, ListingStatus } from "@/types/Listing";
import { getMyListings, markListingSold, updateListing, deleteListing } from "@/api/listings-api";
import { ListingMedia } from "@/ui/ListingMedia";
import { EmptyState } from "@/ui/EmptyState";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatListingPrice, formatDate } from "@/utils/format";
import { PackageOpen, Pencil, CheckCircle2, Archive, Trash2, Upload, RotateCcw, Eye } from "lucide-react";

type TabKey = "active" | "draft" | "sold" | "removed";

const TABS: { key: TabKey; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "draft", label: "Drafts" },
  { key: "sold", label: "Sold" },
  { key: "removed", label: "Archived" },
];

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; listings: Listing[] };

export function ManageListings() {
  const [params, setParams] = useSearchParams();
  const [state, setState] = useState<State>({ status: "loading" });

  const tabParam = params.get("tab");
  const tab: TabKey = TABS.some((t) => t.key === tabParam) ? (tabParam as TabKey) : "active";

  useEffect(() => {
    let active = true;
    getMyListings()
      .then((listings) => active && setState({ status: "loaded", listings }))
      .catch((e: unknown) =>
        active && setState({ status: "error", message: e instanceof Error ? e.message : "failed" }),
      );
    return () => {
      active = false;
    };
  }, []);

  function replace(updated: Listing) {
    setState((s) =>
      s.status === "loaded"
        ? { status: "loaded", listings: s.listings.map((l) => (l.id === updated.id ? updated : l)) }
        : s,
    );
  }
  function remove(id: string) {
    setState((s) =>
      s.status === "loaded" ? { status: "loaded", listings: s.listings.filter((l) => l.id !== id) } : s,
    );
  }

  async function run(action: Promise<Listing>, message: string) {
    try {
      replace(await action);
      toast.success(message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "something went wrong");
    }
  }

  const grouped = useMemo(() => {
    const g: Record<TabKey, Listing[]> = { active: [], draft: [], sold: [], removed: [] };
    if (state.status === "loaded") {
      for (const l of state.listings) {
        const key = (["active", "draft", "sold", "removed"] as TabKey[]).includes(l.status as TabKey)
          ? (l.status as TabKey)
          : "active";
        g[key].push(l);
      }
    }
    return g;
  }, [state]);

  return (
    <div>
      <h2 className="mb-4 font-heading text-xl font-semibold">My listings</h2>

      {state.status === "loading" && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      )}

      {state.status === "error" && (
        <p className="text-destructive">Couldn't load your listings: {state.message}</p>
      )}

      {state.status === "loaded" && (
        <Tabs value={tab} onValueChange={(v) => setParams({ tab: v }, { replace: true })}>
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key}>
                {t.label}
                {grouped[t.key].length > 0 && (
                  <span className="ml-1.5 rounded-full bg-muted px-1.5 text-xs text-muted-foreground">
                    {grouped[t.key].length}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map((t) => (
            <TabsContent key={t.key} value={t.key} className="mt-5">
              {grouped[t.key].length === 0 ? (
                <EmptyState
                  icon={PackageOpen}
                  title={`No ${t.label.toLowerCase()} listings`}
                  description={t.key === "active" ? "List something to reach students on your campus." : undefined}
                  action={
                    t.key === "active" ? (
                      <Button asChild>
                        <Link to="/sell/new">Create a listing</Link>
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="space-y-3">
                  {grouped[t.key].map((l) => (
                    <Row key={l.id} listing={l} status={t.key} run={run} remove={remove} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}

function Row({
  listing,
  status,
  run,
  remove,
}: {
  listing: Listing;
  status: TabKey;
  run: (action: Promise<Listing>, message: string) => Promise<void>;
  remove: (id: string) => void;
}) {
  const navigate = useNavigate();
  const setStatus = (s: ListingStatus, msg: string) => run(updateListing(listing.id, { status: s }), msg);

  async function del() {
    try {
      await deleteListing(listing.id);
      remove(listing.id);
      toast.success("Listing deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "couldn't delete");
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-3 shadow-sm">
      <div className="size-16 shrink-0 overflow-hidden rounded-lg">
        <ListingMedia listing={listing} iconClass="size-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{listing.title}</p>
        <p className="text-sm text-muted-foreground">
          {formatListingPrice(listing)} · {listing.category || "Draft"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">Updated {formatDate(listing.updatedAt)}</p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {status === "sold" && <Badge variant="secondary">Sold</Badge>}

        {(status === "active" || status === "draft" || status === "removed") && (
          <Button variant="outline" size="sm" onClick={() => navigate(`/sell/edit/${listing.id}`)}>
            <Pencil className="size-3.5" />
            Edit
          </Button>
        )}

        {status === "draft" && (
          <Button size="sm" onClick={() => setStatus("active", "Listing published")}>
            <Upload className="size-3.5" />
            Publish
          </Button>
        )}

        {status === "active" && (
          <>
            <Button variant="outline" size="sm" onClick={() => run(markListingSold(listing.id), "Marked as sold")}>
              <CheckCircle2 className="size-3.5" />
              Mark sold
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setStatus("removed", "Listing archived")}>
              <Archive className="size-3.5" />
              Archive
            </Button>
          </>
        )}

        {status === "removed" && (
          <Button variant="outline" size="sm" onClick={() => setStatus("active", "Listing restored")}>
            <RotateCcw className="size-3.5" />
            Restore
          </Button>
        )}

        {status === "sold" && (
          <Button variant="outline" size="sm" onClick={() => navigate(`/listing/${listing.id}`)}>
            <Eye className="size-3.5" />
            View
          </Button>
        )}

        {(status === "draft" || status === "removed" || status === "sold") && (
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="size-3.5" />
              </Button>
            }
            title="Delete this listing?"
            description="This can't be undone."
            confirmLabel="Delete"
            destructive
            onConfirm={() => void del()}
          />
        )}
      </div>
    </div>
  );
}
