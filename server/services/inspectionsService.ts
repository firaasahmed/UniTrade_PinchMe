import { repo } from "../data/index.ts";
import type { InspectionCalendar, InspectionAvailability, SlotState } from "../../src/types/Inspection.ts";
import { DEFAULT_HORIZON_DAYS } from "../../src/types/Inspection.ts";
import { inspectionDays } from "../../src/utils/inspection-slots.ts";
import { isLive } from "../../src/types/Deal.ts";
import { NotFoundError, ValidationError } from "../lib/errors.ts";

// a host who hasn't set a pattern still takes requests — the calendar just has no open slots
const OPEN_TO_REQUESTS: InspectionAvailability = {
  weekdays: [],
  times: [],
  horizonDays: DEFAULT_HORIZON_DAYS,
  blackout: [],
  acceptsRequests: true,
};

export function calendarFor(listingId: string, today: string): InspectionCalendar {
  const listing = repo.getListing(listingId);
  if (!listing) throw new NotFoundError("listing not found");

  const availability = listing.inspectionAvailability ?? OPEN_TO_REQUESTS;

  // a slot another buyer already holds isn't offered again
  const held = repo
    .getDealsForListing(listingId)
    .filter((d) => d.kind === "inspection" && d.scheduledAt && isLive(d))
    .map((d) => ({
      at: d.scheduledAt as string,
      state: (d.status === "accepted" ? "confirmed" : "requested") as Exclude<
        SlotState,
        "open" | "past"
      >,
    }));

  return {
    days: inspectionDays(availability, today, held),
    acceptsRequests: availability.acceptsRequests,
  };
}

// hosts on fixed times (agencies, housing offices) don't field off-pattern asks
export function assertRequestAllowed(listingId: string): void {
  const listing = repo.getListing(listingId);
  if (!listing) throw new NotFoundError("listing not found");
  const availability = listing.inspectionAvailability ?? OPEN_TO_REQUESTS;
  if (!availability.acceptsRequests) {
    throw new ValidationError("this host only takes the inspection times listed");
  }
}

// the slot a buyer asked for has to still be open — checked here, not in the ui
export function assertSlotBookable(listingId: string, at: string, today: string): void {
  const { days } = calendarFor(listingId, today);
  const slot = days.flatMap((d) => d.slots).find((s) => s.at === at);
  if (!slot) throw new ValidationError("that time isn't one of the host's inspection slots");
  if (slot.state !== "open") throw new ValidationError("that time has already been taken");
}
