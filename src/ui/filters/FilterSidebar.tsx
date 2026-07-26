import { useState } from "react";
import type { Filters, Facets } from "@/utils/listing-filters";
import { activeFilterCount } from "@/utils/listing-filters";
import { formatPrice } from "@/utils/format";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ChevronDown, RotateCcw } from "lucide-react";

const ANY = "__any__";

export function FilterSidebar({
  filters,
  facets,
  onChange,
  onReset,
}: {
  filters: Filters;
  facets: Facets;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
}) {
  // collapsed by default — open a section to refine
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const [isConditionOpen, setIsConditionOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  const min = filters.minCents ?? facets.priceMin;
  const max = filters.maxCents ?? facets.priceMax;
  const hasPriceSpread = facets.priceMax > facets.priceMin;

  return (
    <div className="space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
      {/* Header: Filter & Refine */}
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="font-heading text-base font-bold text-foreground">Filter & Refine</h2>
        {activeFilterCount(filters) > 0 && (
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground" onClick={onReset}>
            <RotateCcw className="size-3.5" />
            Reset All
          </Button>
        )}
      </div>

      {/* Category Filter Accordion */}
      {facets.categories.length > 0 && (
        <CollapsibleGroup
          title="Category"
          isOpen={isCategoryOpen}
          onToggle={() => setIsCategoryOpen(!isCategoryOpen)}
        >
          <OptionItem
            label="All Categories"
            selected={!filters.category}
            onClick={() => onChange({ category: "" })}
          />
          {facets.categories.map((cat) => (
            <OptionItem
              key={cat}
              label={cat}
              selected={filters.category === cat}
              onClick={() => onChange({ category: cat })}
            />
          ))}
        </CollapsibleGroup>
      )}

      {/* Price Filter Accordion */}
      {hasPriceSpread && (
        <CollapsibleGroup
          title="Price Range"
          isOpen={isPriceOpen}
          onToggle={() => setIsPriceOpen(!isPriceOpen)}
        >
          <div className="mt-1 space-y-3">
            <Slider
              min={facets.priceMin}
              max={facets.priceMax}
              step={100}
              value={[min, max]}
              onValueChange={(vals) => {
                const lo = vals[0] ?? facets.priceMin;
                const hi = vals[1] ?? facets.priceMax;
                onChange({
                  minCents: lo <= facets.priceMin ? null : lo,
                  maxCents: hi >= facets.priceMax ? null : hi,
                });
              }}
            />
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">$</span>
                <Input
                  type="number"
                  placeholder="Min"
                  className="h-8 pl-6 text-xs"
                  value={filters.minCents ? Math.round(filters.minCents / 100) : ""}
                  onChange={(e) => {
                    const val = e.target.value ? parseFloat(e.target.value) * 100 : null;
                    onChange({ minCents: val });
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground">-</span>
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">$</span>
                <Input
                  type="number"
                  placeholder="Max"
                  className="h-8 pl-6 text-xs"
                  value={filters.maxCents ? Math.round(filters.maxCents / 100) : ""}
                  onChange={(e) => {
                    const val = e.target.value ? parseFloat(e.target.value) * 100 : null;
                    onChange({ maxCents: val });
                  }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Min: {formatPrice(facets.priceMin)}</span>
              <span>Max: {formatPrice(facets.priceMax)}</span>
            </div>
          </div>
        </CollapsibleGroup>
      )}

      {/* Condition Filter Accordion */}
      {facets.conditions.length > 0 && (
        <CollapsibleGroup
          title="Condition"
          isOpen={isConditionOpen}
          onToggle={() => setIsConditionOpen(!isConditionOpen)}
        >
          <OptionItem
            label="All Conditions"
            selected={!filters.condition}
            onClick={() => onChange({ condition: "" })}
          />
          {facets.conditions.map((cond) => (
            <OptionItem
              key={cond}
              label={cond}
              selected={filters.condition === cond}
              onClick={() => onChange({ condition: cond })}
            />
          ))}
        </CollapsibleGroup>
      )}

      {/* Location Filter Accordion */}
      {facets.cities.length > 1 && (
        <CollapsibleGroup
          title="Location"
          isOpen={isLocationOpen}
          onToggle={() => setIsLocationOpen(!isLocationOpen)}
        >
          <Select
            value={filters.city || ANY}
            onValueChange={(v) => onChange({ city: v === ANY ? "" : v })}
          >
            <SelectTrigger className="h-9 w-full text-xs">
              <SelectValue placeholder="Any location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any location</SelectItem>
              {facets.cities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CollapsibleGroup>
      )}

      {/* Desktop Bottom Reset Button */}
      {activeFilterCount(filters) > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full gap-2 text-xs font-semibold"
          onClick={onReset}
        >
          <RotateCcw className="size-3.5" />
          Reset All Filters
        </Button>
      )}
    </div>
  );
}

function CollapsibleGroup({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border/60 pb-3 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-1 text-left text-sm font-semibold text-foreground transition-colors hover:text-primary"
      >
        <span>{title}</span>
        <ChevronDown
          className={cn("size-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>
      {isOpen && <div className="mt-2 space-y-1">{children}</div>}
    </div>
  );
}

function OptionItem({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
        selected
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <span>{label}</span>
      {selected && <span className="size-1.5 rounded-full bg-primary" />}
    </button>
  );
}
