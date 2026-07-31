import type { InspectionAvailability, InspectionDay, Slot, SlotState } from "@/types/Inspection";

// date maths on "YYYY-MM-DD" via UTC, so a timezone can never shift a day
function parseDate(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(date: string, days: number): string {
  const t = new Date(parseDate(date) + days * 86400000);
  return t.toISOString().slice(0, 10);
}

export function weekdayOf(date: string): number {
  return new Date(parseDate(date)).getUTCDay();
}

// "2026-08-02T10:00"
export function slotAt(date: string, time: string): string {
  return `${date}T${time}`;
}

type Held = { at: string; state: Exclude<SlotState, "open" | "past"> };

// the whole calendar, derived — same inputs always give the same grid
export function inspectionDays(
  availability: InspectionAvailability,
  today: string,
  held: Held[],
): InspectionDay[] {
  const heldBy = new Map(held.map((h) => [h.at, h.state]));
  const blackout = new Set(availability.blackout);
  const days: InspectionDay[] = [];

  for (let i = 0; i < availability.horizonDays; i++) {
    const date = addDays(today, i);
    const weekday = weekdayOf(date);
    const inPattern = availability.weekdays.includes(weekday) && !blackout.has(date);

    const slots: Slot[] = inPattern
      ? availability.times.map((time) => {
          const at = slotAt(date, time);
          return { at, time, state: heldBy.get(at) ?? "open" };
        })
      : [];

    days.push({
      date,
      weekday,
      inPattern,
      slots,
      hasOpen: slots.some((s) => s.state === "open"),
    });
  }

  return days;
}
