import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getListings } from "@/api/listings-api";
import { FilterSidebar } from "@/ui/filters/FilterSidebar";
import { SortDropdown } from "@/ui/filters/SortDropdown";
import { CategoryCard } from "@/ui/browse/CategoryCard";
import { MobileFilters } from "@/ui/browse/MobileFilters";
import { ProviderNav } from "@/ui/browse/ProviderNav";
import { deriveProviders } from "@/utils/providers";
import { ResultsList, type LoadState } from "@/ui/browse/ResultsList";
import {
  EMPTY_FILTERS,
  deriveFacets,
  applyFilters,
  type Filters,
} from "@/utils/listing-filters";
import { categoryKind, categoryIcon, type ListingKind } from "@/utils/categories";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Tag, LayoutGrid } from "lucide-react";

type Copy = { title: string; blurb: string; sell: string };

const COPY: Record<ListingKind, Copy> = {
  item: {
    title: "Items",
    blurb: "Desks, laptops, textbooks and everything else students leave behind.",
    sell: "Sell an item",
  },
  service: {
    title: "Services",
    blurb: "Tutoring, moving help and repairs, priced by the hour by students.",
    sell: "Offer a service",
  },
  accommodation: {
    title: "Accommodation",
    blurb: "Rooms, studios and share houses near campus. Book a viewing before you commit.",
    sell: "List a room",
  },
};

// /items, /services, /accommodation — one kind at a time, each with its own
// transaction rules. BuyPage is the same idea across everything at once
export function BrowsePage({ kind }: { kind: ListingKind }) {
  const [params] = useSearchParams();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [filters, setFilters] = useState<Filters>(() => ({
    ...EMPTY_FILTERS,
    q: params.get("q") ?? "",
    category: params.get("category") ?? "",
    kind,
  }));

  const copy = COPY[kind];

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    getListings()
      .then((listings) => active && setState({ status: "loaded", listings }))
      .catch((e: unknown) =>
        active && setState({ status: "error", message: e instanceof Error ? e.message : "failed" }),
      );
    return () => {
      active = false;
    };
  }, []);

  const q = params.get("q") ?? "";
  const categoryParam = params.get("category") ?? "";
  useEffect(() => {
    setFilters((f) => ({ ...f, q, category: categoryParam, kind }));
  }, [q, categoryParam, kind]);

  const patch = (p: Partial<Filters>) => setFilters((f) => ({ ...f, ...p }));
  const reset = () => setFilters((f) => ({ ...EMPTY_FILTERS, q: f.q, kind, sort: f.sort }));

  const all = state.status === "loaded" ? state.listings : [];
  const scoped = useMemo(() => all.filter((l) => categoryKind(l.category) === kind), [all, kind]);
  const facets = useMemo(() => deriveFacets(scoped), [scoped]);
  const results = useMemo(() => applyFilters(all, filters), [all, filters]);
  const providers = useMemo(
    () => (kind === "accommodation" ? deriveProviders(scoped) : null),
    [scoped, kind],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* stacked on phones — sharing the row squeezes the provider cards to nothing */}
      <div className="mb-5 flex flex-col items-start gap-3 border-b pb-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        {providers ? (
          <div className="w-full min-w-0 sm:flex-1">
            <ProviderNav providers={providers} filters={filters} onChange={patch} />
          </div>
        ) : (
          <div>
            <h1 className="font-heading text-2xl font-bold sm:text-3xl">{copy.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{copy.blurb}</p>
          </div>
        )}
        <Button asChild variant="outline">
          <Link to={`/sell/new?kind=${kind}`}>
            <Tag className="size-4" />
            {copy.sell}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <FilterSidebar filters={filters} facets={facets} onChange={patch} onReset={reset} />
          </div>
        </aside>

        <div className="min-w-0">
          {kind === "item" && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground shadow-xs">
                  <GraduationCap className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-sm font-bold text-foreground">
                      Official Student Deals & Brand Discounts
                    </h3>
                    <Badge variant="secondary" className="bg-primary/15 text-[10px] font-bold text-primary">
                      Verified Student Perks
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Can't find a used listing? Explore official student discounts from partners like{" "}
                    <span className="font-semibold text-foreground">Apple</span>,{" "}
                    <span className="font-semibold text-foreground">Lenovo</span> &{" "}
                    <span className="font-semibold text-foreground">Dell</span>.
                  </p>
                </div>
              </div>

              <Button asChild size="sm" className="font-bold shadow-xs">
                <Link to="/deals">
                  <GraduationCap className="size-4 mr-1.5" />
                  View Student Deals
                </Link>
              </Button>
            </div>
          )}

          {/* category shortcuts so the items page can jump straight to laptops */}
          {kind === "item" && facets.categories.length > 1 && (
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <CategoryCard
                label="All items"
                icon={LayoutGrid}
                active={filters.category === ""}
                onClick={() => patch({ category: "" })}
              />
              {facets.categories.map((c) => (
                <CategoryCard
                  key={c}
                  label={c}
                  icon={categoryIcon(c)}
                  active={filters.category === c}
                  onClick={() => patch({ category: filters.category === c ? "" : c })}
                />
              ))}
            </div>
          )}

          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {state.status === "loaded" ? `${results.length} result${results.length === 1 ? "" : "s"}` : " "}
            </p>
            <div className="flex items-center gap-2">
              <MobileFilters filters={filters} facets={facets} onChange={patch} onReset={reset} />
              <SortDropdown value={filters.sort} onChange={(sort) => patch({ sort })} />
            </div>
          </div>

          <ResultsList state={state} results={results} services={kind === "service"} kind={kind} onReset={reset} />
        </div>
      </div>
    </div>
  );
}
