import type { Notification } from "@/types/Notification";
import { apiFetch, errorMessage } from "@/lib/api";

export async function getNotifications(): Promise<Notification[]> {
  const res = await apiFetch("/api/notifications");
  if (!res.ok) throw new Error(`failed to load notifications (${res.status})`);
  return (await res.json()) as Notification[];
}

export async function getNotificationsUnread(): Promise<number> {
  const res = await apiFetch("/api/notifications/unread");
  if (!res.ok) return 0;
  return ((await res.json()) as { count: number }).count;
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await apiFetch(`/api/notifications/${id}/read`, { method: "POST" });
  if (!res.ok) throw new Error(await errorMessage(res, "failed to update notification"));
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await apiFetch("/api/notifications/read-all", { method: "POST" });
  if (!res.ok) throw new Error(await errorMessage(res, "failed to update notifications"));
}
