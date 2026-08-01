import type { BookingView } from "@/types/Booking";
import { apiFetch, errorMessage } from "@/lib/api";

export async function getPurchases(): Promise<BookingView[]> {
  const res = await apiFetch("/api/me/purchases");
  if (!res.ok) throw new Error(`failed to load your purchases (${res.status})`);
  return (await res.json()) as BookingView[];
}

export async function getSales(): Promise<BookingView[]> {
  const res = await apiFetch("/api/me/sales");
  if (!res.ok) throw new Error("couldn't load your sales");
  return (await res.json()) as BookingView[];
}

export async function refundPurchase(bookingId: string): Promise<BookingView> {
  const res = await apiFetch(`/api/me/purchases/${bookingId}/refund`, { method: "POST" });
  if (!res.ok) throw new Error(await errorMessage(res, "failed to refund"));
  return (await res.json()) as BookingView;
}

export async function confirmPurchase(bookingId: string): Promise<BookingView> {
  const res = await apiFetch(`/api/me/purchases/${bookingId}/confirm`, { method: "POST" });
  if (!res.ok) throw new Error(await errorMessage(res, "failed to confirm"));
  return (await res.json()) as BookingView;
}
