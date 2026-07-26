import { repo } from "../data/index.ts";
import type { Notification } from "../../src/types/Notification.ts";
import { NotFoundError } from "../lib/errors.ts";

export function list(userId: string): Notification[] {
  return repo.getNotifications(userId);
}

export function unreadCount(userId: string): number {
  return repo.getNotifications(userId).filter((n) => !n.readAt).length;
}

export function markRead(userId: string, id: string): Notification {
  const owned = repo.getNotifications(userId).some((n) => n.id === id);
  if (!owned) throw new NotFoundError("notification not found");
  const updated = repo.markNotificationRead(id);
  if (!updated) throw new NotFoundError("notification not found");
  return updated;
}

export function markAllRead(userId: string): Notification[] {
  for (const n of repo.getNotifications(userId)) {
    if (!n.readAt) repo.markNotificationRead(n.id);
  }
  return repo.getNotifications(userId);
}
