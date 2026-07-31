// when a host will show the place — a weekly pattern, not a list of dates
export type InspectionAvailability = {
  // 0=sun .. 6=sat
  weekdays: number[];
  // "10:00" 24h, offered on each matching weekday
  times: string[];
  // how far ahead the calendar opens
  horizonDays: number;
  // dates switched off despite matching the pattern
  blackout: string[];
  // host will consider times outside the pattern
  acceptsRequests: boolean;
};

// every slot is exactly one of these — no combination, no unhandled fourth case
export type SlotState = "open" | "requested" | "confirmed" | "past";

export type Slot = {
  // "2026-08-02T10:00" — local, matches DealRow.scheduledAt
  at: string;
  time: string;
  state: SlotState;
};

export type InspectionDay = {
  date: string;
  weekday: number;
  // matches the host's pattern and isn't blacked out
  inPattern: boolean;
  slots: Slot[];
  hasOpen: boolean;
};

// what the buyer's calendar renders — computed server-side
export type InspectionCalendar = {
  days: InspectionDay[];
  // off-pattern days can still be asked about
  acceptsRequests: boolean;
};

export const DEFAULT_HORIZON_DAYS = 21;
