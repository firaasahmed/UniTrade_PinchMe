import type { Filters, Facets } from "@/utils/listing-filters";
import { activeFilterCount } from "@/utils/listing-filters";
import { FilterSidebar } from "@/ui/filters/FilterSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";

// the sidebar again, in a drawer, for viewports too narrow to show it
export function MobileFilters({
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
  const count = activeFilterCount(filters);
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 lg:hidden">
          <SlidersHorizontal className="size-4" />
          Filters{count > 0 ? ` (${count})` : ""}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter & Refine</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-8">
          <FilterSidebar filters={filters} facets={facets} onChange={onChange} onReset={onReset} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
