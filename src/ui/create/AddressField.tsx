import { useEffect, useRef, useState } from "react";
import type { AddressSuggestion, PlaceRef } from "@/types/Place";
import { suggestAddresses, resolveAddress, resolveManual } from "@/api/addresses-api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Loader2, MapPin, Check, PencilLine } from "lucide-react";

const MIN_CHARS = 4;
const DEBOUNCE_MS = 320;

// the states a postal address can carry
const STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"] as const;

// "6 TIMMINS ST, MAYFIELD NSW 2304" -> "Mayfield, NSW" — what the listing shows publicly
export function publicLocation(formatted: string): string {
  const parts = formatted.split(",");
  // no comma means no street line, so the whole string is already the suburb part
  const tail = (parts.length > 1 ? parts[1] : parts[0])?.trim() ?? "";
  const withoutPostcode = tail.replace(/\s+\d{4}$/, "");
  const words = withoutPostcode.split(/\s+/);
  const state = words.length > 1 ? (words.pop() as string).toUpperCase() : "";
  const suburb = words
    .join(" ")
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length > 0 ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
  if (!suburb) return formatted;
  return state ? `${suburb}, ${state}` : suburb;
}

type Manual = { street: string; suburb: string; state: string; postcode: string };

const EMPTY_MANUAL: Manual = { street: "", suburb: "", state: "NSW", postcode: "" };

export function AddressField({
  id,
  place,
  onPick,
  invalid,
}: {
  id: string;
  place: PlaceRef | null;
  onPick: (place: PlaceRef | null) => void;
  invalid?: boolean;
}) {
  const [query, setQuery] = useState(place?.formatted ?? "");
  const [options, setOptions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(0);
  const [byHand, setByHand] = useState(false);
  const [manual, setManual] = useState<Manual>(EMPTY_MANUAL);
  const [searched, setSearched] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  // shortest query that matched nothing — typing further can only miss too
  const deadEnd = useRef<string | null>(null);
  // latest manual value, so a burst of edits doesn't merge off a stale render
  const manualRef = useRef<Manual>(EMPTY_MANUAL);
  // only the newest resolve may write the place
  const pickSeq = useRef(0);

  // a picked address is settled — typing again is what reopens the search
  const settled = place !== null && query === place.formatted;

  useEffect(() => {
    const q = query.trim();
    if (settled || q.length < MIN_CHARS) {
      setOptions([]);
      return;
    }
    if (deadEnd.current !== null && q.toLowerCase().startsWith(deadEnd.current)) {
      setOptions([]);
      setOpen(false);
      setSearched(true);
      return;
    }
    let live = true;
    setBusy(true);
    const t = setTimeout(() => {
      void suggestAddresses(q)
        .then((rows) => {
          if (!live) return;
          deadEnd.current = rows.length === 0 ? q.toLowerCase() : null;
          setOptions(rows);
          setActive(0);
          setOpen(rows.length > 0);
          setSearched(true);
        })
        .finally(() => live && setBusy(false));
    }, DEBOUNCE_MS);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [query, settled]);

  useEffect(() => {
    function onDocClick(e: MouseEvent): void {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function choose(option: AddressSuggestion): Promise<void> {
    setOpen(false);
    setBusy(true);
    const seq = ++pickSeq.current;
    const resolved = await resolveAddress(option.id);
    setBusy(false);
    if (seq !== pickSeq.current || !resolved) return;
    setQuery(resolved.formatted);
    onPick(resolved);
  }

  // manual entry always resolves — the point is a bonus, not a requirement.
  // merged off the ref so fast edits can't build on a stale snapshot
  async function commitManual(patch: Partial<Manual>): Promise<void> {
    const next = { ...manualRef.current, ...patch };
    manualRef.current = next;
    setManual(next);

    const seq = ++pickSeq.current;
    if (next.suburb.trim() === "") {
      onPick(null);
      return;
    }
    const resolved = await resolveManual(next);
    // a later edit already answered, so this reply is stale
    if (seq !== pickSeq.current || !resolved) return;
    onPick(resolved);
  }

  function startByHand(): void {
    setByHand(true);
    setOpen(false);
    pickSeq.current++;
    onPick(null);
    // carry whatever was typed into the street line so nothing is retyped
    const carried =
      manualRef.current.street === "" && query.trim() !== ""
        ? { ...manualRef.current, street: query.trim() }
        : manualRef.current;
    manualRef.current = carried;
    setManual(carried);
  }

  function onKeyDown(e: React.KeyboardEvent): void {
    if (!open || options.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = options[active];
      if (pick) void choose(pick);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  if (byHand)
    return (
      <ManualFields
        id={id}
        value={manual}
        place={place}
        invalid={invalid}
        onChange={(patch) => void commitManual(patch)}
        onSearch={() => {
          setByHand(false);
          manualRef.current = EMPTY_MANUAL;
          setManual(EMPTY_MANUAL);
          pickSeq.current++;
          onPick(null);
        }}
      />
    );

  const noMatches = searched && !busy && !settled && options.length === 0 && query.trim().length >= MIN_CHARS;

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Input
          id={id}
          value={query}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-invalid={invalid}
          aria-label="Street address"
          placeholder="Start typing an address"
          onChange={(e) => {
            setQuery(e.target.value);
            // editing after a pick clears it — coordinates must match what's shown
            if (place) onPick(null);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => options.length > 0 && setOpen(true)}
          className="pr-9"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : settled ? (
            <Check className="size-4 text-verified" />
          ) : (
            <MapPin className="size-4" />
          )}
        </span>
      </div>

      {settled ? (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Shown publicly as <span className="font-medium">{publicLocation(place.formatted)}</span> —
          your exact address stays private
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {noMatches ? "No match for that. " : ""}
          <button
            type="button"
            onClick={startByHand}
            className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-2"
          >
            <PencilLine className="size-3" />
            Enter it manually
          </button>
        </p>
      )}

      {open && options.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border bg-popover p-1 shadow-md"
        >
          {options.map((o, i) => (
            <li key={o.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => void choose(o)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                  i === active && "bg-accent",
                )}
              >
                <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{o.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ManualFields({
  id,
  value,
  place,
  invalid,
  onChange,
  onSearch,
}: {
  id: string;
  value: Manual;
  place: PlaceRef | null;
  invalid?: boolean;
  onChange: (patch: Partial<Manual>) => void;
  onSearch: () => void;
}) {
  const set = (patch: Partial<Manual>) => onChange(patch);

  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          Street address
        </Label>
        <Input
          id={id}
          value={value.street}
          autoComplete="off"
          placeholder="6 Timmins St"
          onChange={(e) => set({ street: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 grid gap-2">
          <Label htmlFor={`${id}-suburb`} className="text-xs text-muted-foreground">
            Suburb
          </Label>
          <Input
            id={`${id}-suburb`}
            value={value.suburb}
            autoComplete="off"
            placeholder="Mayfield"
            aria-invalid={invalid}
            onChange={(e) => set({ suburb: e.target.value })}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`${id}-state`} className="text-xs text-muted-foreground">
            State
          </Label>
          <select
            id={`${id}-state`}
            value={value.state}
            onChange={(e) => set({ state: e.target.value })}
            className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`${id}-postcode`} className="text-xs text-muted-foreground">
            Postcode
          </Label>
          <Input
            id={`${id}-postcode`}
            value={value.postcode}
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
            placeholder="2304"
            onChange={(e) => set({ postcode: e.target.value.replace(/\D/g, "") })}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {place && place.lat !== 0 ? (
          <>
            Matched <span className="font-medium">{publicLocation(place.formatted)}</span> to a map point
            — buyers see the suburb only.
          </>
        ) : place ? (
          <>
            Saved as <span className="font-medium">{publicLocation(place.formatted)}</span>. We don't have
            a map point for this suburb, so distance to campus won't show.
          </>
        ) : (
          "Suburb is the one field we need."
        )}{" "}
        <button
          type="button"
          onClick={onSearch}
          className="font-medium text-foreground underline underline-offset-2"
        >
          Search instead
        </button>
      </p>
    </div>
  );
}
