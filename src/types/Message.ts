import type { PublicUser } from "./User.ts";

export type Message = {
  id: string;
  listingId: string;
  senderId: string;
  recipientId: string;
  body: string;
  // set when this message only echoes a deal — the deal card renders instead
  dealId?: string;
  createdAt: string;
  readAt: string | null;
};

export type NewMessage = {
  listingId: string;
  senderId: string;
  recipientId: string;
  body: string;
  // a deal echo: keeps the thread in the inbox with a readable preview, but the
  // thread itself renders the deal card rather than this text
  dealId?: string;
};

// one row in the conversations list, from the current user's perspective
export type ConversationView = {
  listingId: string;
  otherUserId: string;
  listingTitle: string;
  listingImageUrl: string;
  otherUser: PublicUser;
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
};

// a full thread with one other person about one listing
export type ThreadView = {
  listingId: string;
  otherUser: PublicUser;
  listingTitle: string;
  listingImageUrl: string;
  listingPriceCents?: number;
  // drives the deal journey shown in the thread
  listingCategory?: string;
  listingSellerId?: string;
  messages: Message[];
};
