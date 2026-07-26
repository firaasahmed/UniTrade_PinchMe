import type { ConversationView, ThreadView, Message } from "@/types/Message";
import { apiFetch, errorMessage } from "@/lib/api";

export async function getConversations(): Promise<ConversationView[]> {
  const res = await apiFetch("/api/messages");
  if (!res.ok) throw new Error(`failed to load conversations (${res.status})`);
  return (await res.json()) as ConversationView[];
}

export async function getThread(listingId: string, otherUserId: string): Promise<ThreadView> {
  const qs = new URLSearchParams({ listingId, otherUserId });
  const res = await apiFetch(`/api/messages/thread?${qs.toString()}`);
  if (!res.ok) throw new Error(`failed to load conversation (${res.status})`);
  return (await res.json()) as ThreadView;
}

export async function sendMessage(listingId: string, recipientId: string, body: string): Promise<Message> {
  const res = await apiFetch("/api/messages", {
    method: "POST",
    body: JSON.stringify({ listingId, recipientId, body }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "failed to send message"));
  return (await res.json()) as Message;
}

export async function getMessagesUnread(): Promise<number> {
  const res = await apiFetch("/api/messages/unread");
  if (!res.ok) return 0;
  return ((await res.json()) as { count: number }).count;
}
