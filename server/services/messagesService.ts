import { repo } from "../data/index.ts";
import type { Message, ConversationView, ThreadView } from "../../src/types/Message.ts";
import { publicUser } from "./listingsService.ts";
import { NotFoundError, ValidationError, ForbiddenError } from "../lib/errors.ts";

function otherId(m: Message, userId: string): string {
  return m.senderId === userId ? m.recipientId : m.senderId;
}

function context(listingId: string): { title: string; imageUrl: string } {
  const listing = repo.getListing(listingId);
  if (listing) return { title: listing.title, imageUrl: listing.imageUrl };
  return { title: "Listing removed", imageUrl: "" };
}

// the current user's conversations, one per (context, other person), newest activity first
export function listConversations(userId: string): ConversationView[] {
  const groups = new Map<string, Message[]>();
  for (const m of repo.getMessagesForUser(userId)) {
    const key = `${m.listingId}:${otherId(m, userId)}`;
    const arr = groups.get(key) ?? [];
    arr.push(m);
    groups.set(key, arr);
  }

  const views: ConversationView[] = [];
  for (const msgs of groups.values()) {
    const last = msgs[msgs.length - 1];
    if (!last) continue;
    const other = otherId(last, userId);
    const ctx = context(last.listingId);
    views.push({
      listingId: last.listingId,
      otherUserId: other,
      listingTitle: ctx.title,
      listingImageUrl: ctx.imageUrl,
      otherUser: publicUser(other),
      lastMessage: last.body,
      lastAt: last.createdAt,
      unreadCount: msgs.filter((m) => m.recipientId === userId && !m.readAt).length,
    });
  }

  return views.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

// a thread between the user and one other person about a listing — marks it read
export function getThread(userId: string, listingId: string, otherUserId: string): ThreadView {
  repo.markThreadRead(listingId, userId, otherUserId);
  const ctx = context(listingId);
  const messages = repo
    .getMessages(listingId, userId)
    .filter((m) => m.senderId === otherUserId || m.recipientId === otherUserId);
  const listing = repo.getListing(listingId);
  return {
    listingId,
    otherUser: publicUser(otherUserId),
    listingTitle: ctx.title,
    listingImageUrl: ctx.imageUrl,
    listingPriceCents: listing?.priceCents,
    listingCategory: listing?.category,
    listingSellerId: listing?.sellerId,
    messages,
  };
}

export function send(senderId: string, listingId: string, recipientId: string, body: string): Message {
  const text = body.trim();
  if (!text) throw new ValidationError("message cannot be empty");
  if (!repo.getListing(listingId)) throw new NotFoundError("listing not found");
  if (recipientId === senderId) throw new ForbiddenError("you can't message yourself");
  if (!repo.getUser(recipientId)) throw new NotFoundError("recipient not found");

  const message = repo.createMessage({ listingId, senderId, recipientId, body: text });
  const sender = repo.getUser(senderId);
  repo.createNotification({
    userId: recipientId,
    type: "message",
    payload: {
      listingId,
      listingTitle: context(listingId).title,
      fromId: senderId,
      fromName: sender?.name ?? "A student",
      preview: text.slice(0, 80),
    },
  });
  return message;
}

// total unread across all conversations, for the navbar dot
export function unreadCount(userId: string): number {
  return repo.getMessagesForUser(userId).filter((m) => m.recipientId === userId && !m.readAt).length;
}
