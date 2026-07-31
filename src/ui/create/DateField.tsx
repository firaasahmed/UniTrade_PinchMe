import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";

// the native date input renders in browser chrome we can't theme, so it ends up
// dark against a light app. this keeps the picker inside our own tokens
export function DateField({
  id,
  value,
  onChange,
  fromDate,
  placeholder = "Pick a date",
}: {
  id: string;
  // "YYYY-MM-DD", empty when unset
  value: string;
  onChange: (next: string) => void;
  fromDate?: Date;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = toDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn("w-full justify-start font-normal", !selected && "text-muted-foreground")}
        >
          <CalendarDays className="size-4 shrink-0" />
          {selected ? formatDate(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          disabled={fromDate ? { before: fromDate } : undefined}
          onSelect={(d) => {
            onChange(d ? toIso(d) : "");
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

// parsed and formatted from local parts, so a timezone can't shift the day
function toDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : undefined;
}

function toIso(d: Date): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
