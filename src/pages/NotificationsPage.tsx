import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Notification } from "@/types/Notification";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/api/notifications-api";
import { RequireAuth } from "@/ui/RequireAuth";
import { EmptyState } from "@/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";
import { Bell, MessageCircle, ShoppingBag } from "lucide-react";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; notifications: Notification[] };

export function NotificationsPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}

function describe(n: Notification): { title: string; body: string; to: string; icon: typeof Bell } {
  if (n.type === "message") {
    return {
      title: `New message from ${n.payload.fromName ?? "a student"}`,
      body: n.payload.preview ?? "",
      to: `/messages?listing=${n.payload.listingId ?? ""}&user=${n.payload.fromId ?? ""}`,
      icon: MessageCircle,
    };
  }
  return {
    title: `Your "${n.payload.listingTitle ?? "listing"}" sold`,
    body: `${n.payload.buyerName ?? "A student"} paid through UniTrade`,
    to: `/sell?tab=sold`,
    icon: ShoppingBag,
  };
}

function Inner() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    getNotifications()
      .then((notifications) => setState({ status: "loaded", notifications }))
      .catch((e: unknown) =>
        setState({ status: "error", message: e instanceof Error ? e.message : "failed" }),
      );
  }, []);

  async function open(n: Notification) {
    const { to } = describe(n);
    if (!n.readAt) {
      try {
        await markNotificationRead(n.id);
      } catch {
        /* non-critical */
      }
    }
    navigate(to);
  }

  async function markAll() {
    await markAllNotificationsRead().catch(() => {});
    setState((s) =>
      s.status === "loaded"
        ? {
            status: "loaded",
            notifications: s.notifications.map((n) => ({ ...n, readAt: n.readAt ?? "read" })),
          }
        : s,
    );
  }

  const hasUnread =
    state.status === "loaded" && state.notifications.some((n) => !n.readAt);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Notifications</h1>
        {hasUnread && (
          <Button variant="outline" size="sm" onClick={() => void markAll()}>
            Mark all read
          </Button>
        )}
      </div>

      {state.status === "loading" && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {state.status === "error" && (
        <p className="text-destructive">Couldn't load notifications: {state.message}</p>
      )}

      {state.status === "loaded" &&
        (state.notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="You're all caught up"
            description="Messages and sales will show up here."
            action={
              <Button asChild>
                <Link to="/buy">Browse the marketplace</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {state.notifications.map((n) => {
              const d = describe(n);
              return (
                <button
                  key={n.id}
                  onClick={() => void open(n)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent/50",
                    !n.readAt && "border-primary/30 bg-accent/40",
                  )}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                    <d.icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{d.title}</p>
                    {d.body && <p className="truncate text-sm text-muted-foreground">{d.body}</p>}
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(n.createdAt)}</p>
                  </div>
                  {!n.readAt && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
        ))}
    </div>
  );
}
