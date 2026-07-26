import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { ConversationView, ThreadView } from "@/types/Message";
import { getConversations, getThread, sendMessage } from "@/api/messages-api";
import { useSession } from "@/session/SessionContext";
import { RequireAuth } from "@/ui/RequireAuth";
import { EmptyState } from "@/ui/EmptyState";
import { DealMessage } from "@/ui/deals/DealMessage";
import { ProductDealSidebar } from "@/ui/deals/ProductDealSidebar";
import { getThreadDeals } from "@/api/deals-api";
import type { DealView } from "@/types/Deal";
import type { Message } from "@/types/Message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatPrice, initials } from "@/utils/format";
import { cn } from "@/lib/utils";
import { MessagesSquare, ArrowLeft, Send, ShieldCheck, Package, ExternalLink, RotateCw } from "lucide-react";

type ListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; conversations: ConversationView[] };

export function MessagesPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const [params, setParams] = useSearchParams();
  const [list, setList] = useState<ListState>({ status: "loading" });

  const selectedListing = params.get("listing");
  const selectedUser = params.get("user");

  function loadConversations() {
    getConversations()
      .then((conversations) => setList({ status: "loaded", conversations }))
      .catch((e: unknown) =>
        setList({ status: "error", message: e instanceof Error ? e.message : "failed" }),
      );
  }

  useEffect(() => {
    loadConversations();
  }, []);

  function select(c: ConversationView) {
    setParams({ listing: c.listingId, user: c.otherUserId });
  }

  const hasSelection = Boolean(selectedListing && selectedUser);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-5 font-heading text-2xl font-semibold sm:text-3xl">Messages</h1>

      {list.status === "loading" && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {list.status === "error" && (
        <p className="text-destructive">Couldn't load messages: {list.message}</p>
      )}

      {list.status === "loaded" &&
        (list.conversations.length === 0 && !hasSelection ? (
          <EmptyState
            icon={MessagesSquare}
            title="No messages yet"
            description="Message a seller from any listing and your conversations will appear here."
            action={
              <Button asChild>
                <Link to="/buy">Browse the marketplace</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
            <div className={cn("space-y-1", hasSelection && "hidden lg:block")}>
              {list.conversations.map((c) => {
                const active = c.listingId === selectedListing && c.otherUserId === selectedUser;
                return (
                  <button
                    key={`${c.listingId}:${c.otherUserId}`}
                    onClick={() => select(c)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-3 text-left shadow-sm transition-colors",
                      active ? "border-primary bg-accent" : "bg-card hover:bg-accent/50",
                    )}
                  >
                    {/* the item is what the conversation is about, so lead with it */}
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {c.listingImageUrl ? (
                        <img src={c.listingImageUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                          <Package className="size-5" />
                        </div>
                      )}
                      <Avatar className="absolute -bottom-0.5 -right-0.5 size-6 ring-2 ring-card">
                        <AvatarFallback className="bg-primary text-[9px] font-semibold text-primary-foreground">
                          {initials(c.otherUser.name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{c.otherUser.name}</p>
                        {c.unreadCount > 0 && (
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{c.listingTitle}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.lastMessage}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className={cn(!hasSelection && "hidden lg:block")}>
              {hasSelection ? (
                <Thread
                  key={`${selectedListing}:${selectedUser}`}
                  listingId={selectedListing as string}
                  otherUserId={selectedUser as string}
                  onBack={() => setParams({})}
                  onSent={loadConversations}
                />
              ) : (
                <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border text-sm text-muted-foreground">
                  Select a conversation
                </div>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}

type ThreadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; thread: ThreadView };

const QUICK_REPLIES = [
  "Is this still available?",
  "Can we meet on campus?",
  "Would you take a bit less?",
  "Sounds good, thanks!",
];

type Entry =
  | { kind: "message"; at: string; message: Message }
  | { kind: "deal"; at: string; deal: DealView };

// one chronological stream; a superseded deal drops out so only the live one shows
// an accepted deal sits at the moment it was accepted, so the pay prompt lands last
function timeline(messages: Message[], deals: DealView[]): Entry[] {
  const live = deals.filter((d) => d.status !== "countered");
  const entries: Entry[] = [
    ...messages.map((m): Entry => ({ kind: "message", at: m.createdAt, message: m })),
    ...live.map((d): Entry => ({
      kind: "deal",
      at: d.status === "accepted" ? d.updatedAt : d.createdAt,
      deal: d,
    })),
  ];
  return entries.sort((a, b) => a.at.localeCompare(b.at));
}

function Thread({
  listingId,
  otherUserId,
  onBack,
  onSent,
}: {
  listingId: string;
  otherUserId: string;
  onBack: () => void;
  onSent: () => void;
}) {
  const { state } = useSession();
  const meId = state.status === "signedIn" ? state.user.id : "";
  const [ts, setTs] = useState<ThreadState>({ status: "loading" });
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [deals, setDeals] = useState<DealView[]>([]);
  const [version, setVersion] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  function load(quiet = false) {
    if (!quiet) setTs({ status: "loading" });
    getThread(listingId, otherUserId)
      .then((thread) => {
        setTs({ status: "loaded", thread });
      })
      .catch((e: unknown) =>
        !quiet && setTs({ status: "error", message: e instanceof Error ? e.message : "failed" }),
      );
    void getThreadDeals(listingId, otherUserId).then(setDeals);
    setVersion((v) => v + 1);
  }

  useEffect(() => {
    load();
    // light poll so the other side's reply lands without a manual refresh
    const timer = window.setInterval(() => load(true), 6000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId, otherUserId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [ts]);

  // coming back from checkout or another tab should show the latest state
  useEffect(() => {
    function onFocus() {
      if (!document.hidden) load(true);
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId, otherUserId]);

  async function send(text: string) {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      await sendMessage(listingId, otherUserId, body);
      setDraft("");
      load(true);
      onSent();
    } finally {
      setBusy(false);
    }
  }

  const submit = () => send(draft);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      {/* Left/Middle: Chat Stream */}
      <div className="flex h-[70vh] flex-col rounded-2xl border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b p-3">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onBack} aria-label="Back">
            <ArrowLeft className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto order-last"
            onClick={() => load(true)}
            aria-label="Refresh conversation"
          >
            <RotateCw className="size-4" />
          </Button>
          {ts.status === "loaded" && (
            <>
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                  {initials(ts.thread.otherUser.name)}
                </AvatarFallback>
              </Avatar>
              <p className="flex min-w-0 items-center gap-1 text-sm font-medium">
                <span className="truncate">{ts.thread.otherUser.name}</span>
                {ts.thread.otherUser.verified && <ShieldCheck className="size-3.5 shrink-0 text-verified" />}
              </p>
            </>
          )}
        </div>

        {/* what the conversation is about, with a way back to it */}
        {ts.status === "loaded" && (
          <Link
            to={`/listing/${listingId}`}
            className="flex items-center gap-3 border-b bg-muted/40 p-3 transition-colors hover:bg-accent/50"
          >
            <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
              {ts.thread.listingImageUrl ? (
                <img src={ts.thread.listingImageUrl} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <Package className="size-5" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{ts.thread.listingTitle}</p>
              {ts.thread.listingPriceCents !== undefined && (
                <p className="text-xs font-semibold text-price">{formatPrice(ts.thread.listingPriceCents)}</p>
              )}
            </div>
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
              View listing
              <ExternalLink className="size-3.5" />
            </span>
          </Link>
        )}

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {ts.status === "loading" && <p className="text-sm text-muted-foreground">Loading…</p>}
          {ts.status === "error" && <p className="text-sm text-destructive">{ts.message}</p>}
          {ts.status === "loaded" && (
            <>
              {ts.thread.messages.length === 0 && deals.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">Say hello 👋</p>
              ) : (
                // messages and deals share one timeline so the pay button lands in the chat
                timeline(ts.thread.messages, deals).map((entry) =>
                  entry.kind === "deal" ? (
                    <DealMessage
                      key={entry.deal.id}
                      deal={entry.deal}
                      meId={meId}
                      onChanged={() => load(true)}
                    />
                  ) : (
                    <div
                      key={entry.message.id}
                      className={cn("flex", entry.message.senderId === meId ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                          entry.message.senderId === meId
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted",
                        )}
                      >
                        <p className="whitespace-pre-wrap">{entry.message.body}</p>
                        <p
                          className={cn(
                            "mt-1 text-[10px]",
                            entry.message.senderId === meId
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground",
                          )}
                        >
                          {formatDate(entry.message.createdAt)}
                        </p>
                      </div>
                    </div>
                  ),
                )
              )}
            </>
          )}
          <div ref={endRef} />
        </div>

        {/* one-tap replies so nothing has to be typed on camera */}
        <div className="flex flex-wrap gap-1.5 border-t px-3 pt-2.5">
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => void send(q)}
              disabled={busy}
              className="rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 p-3 pt-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder="Type a message…"
          />
          <Button onClick={() => void submit()} disabled={busy || draft.trim() === ""} size="icon" aria-label="Send">
            <Send className="size-4" />
          </Button>
        </div>
      </div>

      {/* right column: what's being traded, and the price controls */}
      {ts.status === "loaded" && (
        <ProductDealSidebar
          listingId={listingId}
          otherUserId={otherUserId}
          listingTitle={ts.thread.listingTitle}
          listingImageUrl={ts.thread.listingImageUrl}
          listingPriceCents={ts.thread.listingPriceCents}
          sellerId={ts.thread.listingSellerId}
          version={version}
          onUpdate={() => load(true)}
        />
      )}
    </div>
  );
}
