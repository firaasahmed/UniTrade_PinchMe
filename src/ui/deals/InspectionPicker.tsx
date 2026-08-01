import { useEffect, useMemo, useState } from "react";
import type { InspectionCalendar, InspectionDay } from "@/types/Inspection";
import { getInspectionCalendar } from "@/api/listings-api";
import { formatSlotTime } from "@/utils/format-slot";
import { formatDate } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Loader2, CalendarOff, ChevronLeft, ChevronRight } from "lucide-react";

// what the buyer picked: a real slot, or a time they typed for a day the host doesn't normally do
export type InspectionChoice =
  | { kind: "slot"; at: string }
  | { kind: "request"; text: string }
  | { kind: "none" };

function toDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function InspectionPicker({
  listingId,
  value,
  onChange,
}: {
  listingId: string;
  value: InspectionChoice;
  onChange: (choice: InspectionChoice) => void;
}) {
  const [calendar, setCalendar] = useState<InspectionCalendar | null>(null);
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [requestText, setRequestText] = useState("");
  const [weekIndex, setWeekIndex] = useState(0);

  useEffect(() => {
    let live = true;
    void getInspectionCalendar(listingId).then((c) => {
      if (!live) return;
      setCalendar(c);
      const initial = c.days.find((d) => d.hasOpen)?.date ?? c.days[0]?.date ?? null;
      setOpenDate(initial);
    });
    return () => {
      live = false;
    };
  }, [listingId]);

  const byDate = useMemo(
    () => new Map((calendar?.days ?? []).map((d) => [d.date, d])),
    [calendar],
  );

  // Group days into 7-day chunks (weeks)
  const weeks = useMemo(() => {
    const days = calendar?.days ?? [];
    const result: InspectionDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [calendar]);

  // Adjust weekIndex if initial openDate is in week 1 or week 2
  useEffect(() => {
    if (openDate && weeks.length > 0) {
      const foundWeek = weeks.findIndex((w) => w.some((d) => d.date === openDate));
      if (foundWeek >= 0) {
        setWeekIndex(foundWeek);
      }
    }
  }, [openDate, weeks]);

  if (!calendar) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading inspection dates...
      </div>
    );
  }

  const currentWeekDays = weeks[weekIndex] ?? [];
  const day: InspectionDay | null = openDate ? (byDate.get(openDate) ?? null) : null;
  const offPattern = day !== null && !day.inPattern;

  // Compute header label for current week (e.g. "Aug 2 – Aug 8, 2026")
  const weekRangeLabel = (() => {
    const firstDay = currentWeekDays[0];
    const lastDay = currentWeekDays[currentWeekDays.length - 1];
    if (!firstDay || !lastDay) return "";
    const firstDate = toDate(firstDay.date);
    const lastDate = toDate(lastDay.date);
    const m1 = firstDate.toLocaleDateString("en-US", { month: "short" });
    const m2 = lastDate.toLocaleDateString("en-US", { month: "short" });
    const year = firstDate.getFullYear();
    if (m1 === m2) {
      return `${m1} ${firstDate.getDate()} – ${lastDate.getDate()}, ${year}`;
    }
    return `${m1} ${firstDate.getDate()} – ${m2} ${lastDate.getDate()}, ${year}`;
  })();

  return (
    <div className="min-w-0 space-y-4">
      {/* 1-Row Compact Weekly Calendar Strip */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-2">

            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Open slots
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="mr-1 text-xs font-semibold text-foreground">
              {weekRangeLabel}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7 rounded-lg"
              disabled={weekIndex === 0}
              onClick={() => setWeekIndex((w) => Math.max(0, w - 1))}
              aria-label="Previous week"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7 rounded-lg"
              disabled={weekIndex >= weeks.length - 1}
              onClick={() => setWeekIndex((w) => Math.min(weeks.length - 1, w + 1))}
              aria-label="Next week"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* 1-Row 7-Day Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {currentWeekDays.map((d) => {
            const dateObj = toDate(d.date);
            const isSelected = openDate === d.date;
            const hasOpen = d.hasOpen;
            const dayName = WEEKDAY_NAMES[d.weekday] ?? "";
            const dayNum = dateObj.getDate();

            return (
              <button
                key={d.date}
                type="button"
                onClick={() => {
                  setOpenDate(d.date);
                  setRequestText("");
                  onChange({ kind: "none" });
                }}
                className={cn(
                  "relative flex flex-col items-center justify-between rounded-xl border p-2 text-center transition-all hover:scale-[1.02]",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                    : hasOpen
                      ? "border-emerald-500/40 bg-emerald-500/5 text-foreground hover:bg-emerald-500/15"
                      : "border-border/60 bg-muted/20 text-muted-foreground opacity-75 hover:bg-accent/30",
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wide",
                    isSelected ? "text-primary-foreground/80" : "text-muted-foreground",
                  )}
                >
                  {dayName}
                </span>

                <span className="my-1 font-heading text-base font-bold leading-none">
                  {dayNum}
                </span>

                {/* Available inspection indicator */}
                {hasOpen ? (
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      isSelected ? "bg-primary-foreground" : "bg-emerald-500 animate-pulse",
                    )}
                    title="Open inspection slots available"
                  />
                ) : (
                  <span className="size-1.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Available Time Slots Section */}
      {day && day.slots.length > 0 && (
        <div className="rounded-xl border bg-card/60 p-3 shadow-2xs">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Available Times ({formatDate(day.date)})
          </Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {day.slots.map((s) => {
              const taken = s.state !== "open";
              const selected = value.kind === "slot" && value.at === s.at;
              return (
                <button
                  key={s.at}
                  type="button"
                  disabled={taken}
                  onClick={() => onChange({ kind: "slot", at: s.at })}
                  className={cn(
                    "rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-all",
                    selected && "border-primary bg-primary text-primary-foreground font-bold shadow-xs",
                    !selected && !taken && "border-border/80 bg-background hover:border-primary/50 hover:bg-accent/50",
                    taken && "cursor-not-allowed border-transparent bg-muted text-muted-foreground line-through opacity-50",
                  )}
                >
                  {formatSlotTime(s.time)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Off-pattern request option */}
      {offPattern && calendar.acceptsRequests && (
        <div className="grid gap-2 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">
            The host doesn&apos;t usually hold inspections on this date, but you can suggest a custom time below.
          </p>
          <Input
            value={requestText}
            onChange={(e) => {
              setRequestText(e.target.value);
              const text = e.target.value.trim();
              onChange(text ? { kind: "request", text } : { kind: "none" });
            }}
            placeholder="e.g. any evening that week, after 6pm"
            aria-label="Suggest a time"
          />
        </div>
      )}

      {offPattern && !calendar.acceptsRequests && (
        <p className="flex items-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 p-3 text-xs text-muted-foreground">
          <CalendarOff className="size-3.5 shrink-0" />
          This host only takes the inspection times listed on available days.
        </p>
      )}
    </div>
  );
}
