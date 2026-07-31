import type { InspectionAvailability } from "@/types/Inspection";
import { Switch } from "@/components/ui/switch";
import { formatSlotTime } from "@/utils/format-slot";
import { cn } from "@/lib/utils";
import { CalendarCheck } from "lucide-react";

// what the host sets here is exactly what a buyer's inspection calendar reads
export type InspectionDraft = Pick<
  InspectionAvailability,
  "weekdays" | "times" | "acceptsRequests"
>;

export const EMPTY_INSPECTION: InspectionDraft = {
  weekdays: [],
  times: [],
  acceptsRequests: true,
};

// 0=sun..6=sat to match Date.getDay, shown starting monday the way people think of a week
const DAYS: { value: number; label: string }[] = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

const TIMES = ["09:00", "09:30", "10:00", "10:30", "11:00", "12:00", "14:00", "16:00", "17:30", "18:00"];

const DAY_NAME: Record<number, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function InspectionAvailabilityField({
  value,
  onChange,
}: {
  value: InspectionDraft;
  onChange: (next: InspectionDraft) => void;
}) {
  const days = [...value.weekdays].sort();
  const times = [...value.times].sort();
  const ready = days.length > 0 && times.length > 0;

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium">Which days can people inspect?</p>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <button
              key={d.value}
              type="button"
              aria-pressed={value.weekdays.includes(d.value)}
              onClick={() => onChange({ ...value, weekdays: toggle(value.weekdays, d.value) })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                value.weekdays.includes(d.value)
                  ? "border-primary bg-accent font-medium"
                  : "text-muted-foreground hover:bg-accent/50",
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">What times?</p>
        <div className="flex flex-wrap gap-2">
          {TIMES.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={value.times.includes(t)}
              onClick={() => onChange({ ...value, times: toggle(value.times, t) })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                value.times.includes(t)
                  ? "border-primary bg-accent font-medium"
                  : "text-muted-foreground hover:bg-accent/50",
              )}
            >
              {formatSlotTime(t)}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          These times are offered on each day you picked
        </p>
      </div>

      <label className="flex items-start gap-3 text-sm">
        <Switch
          checked={value.acceptsRequests}
          onCheckedChange={(v) => onChange({ ...value, acceptsRequests: v })}
        />
        <span>
          Also consider requests for other times
          <span className="block text-xs text-muted-foreground">
            Buyers can ask about a day you haven&apos;t listed, and you can accept or decline
          </span>
        </span>
      </label>

      {/* the host should see exactly what the buyer's calendar will show */}
      <div className="rounded-lg border border-dashed p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <CalendarCheck className="size-3.5" />
          What buyers will see
        </p>
        {ready ? (
          <p className="mt-1.5 text-sm">
            Inspections on <span className="font-medium">{days.map((d) => DAY_NAME[d]).join(", ")}</span>{" "}
            at <span className="font-medium">{times.map(formatSlotTime).join(", ")}</span>
          </p>
        ) : (
          <p className="mt-1.5 text-sm text-muted-foreground">
            {value.acceptsRequests
              ? "No set times — buyers can pick any day and ask you"
              : "No inspection times set yet"}
          </p>
        )}
      </div>
    </div>
  );
}
