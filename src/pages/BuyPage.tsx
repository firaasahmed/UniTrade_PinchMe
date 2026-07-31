import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getListings } from "@/api/listings-api";
import { FilterSidebar } from "@/ui/filters/FilterSidebar";
import { SortDropdown } from "@/ui/filters/SortDropdown";
import { MobileFilters } from "@/ui/browse/MobileFilters";
import { ProviderNav } from "@/ui/browse/ProviderNav";
import { deriveProviders } from "@/utils/providers";
import { ResultsList, type LoadState } from "@/ui/browse/ResultsList";
import {
  EMPTY_FILTERS,
  deriveFacets,
  applyFilters,
  type Filters,
  type KindFilter,
} from "@/utils/listing-filters";
import { categoryKind, isListingKind } from "@/utils/categories";

function asKindFilter(v: string | null): KindFilter | undefined {
  if (v === "all") return "all";
  return isListingKind(v) ? v : undefined;
}

// everything, unscoped — the per-kind pages are the same screen with one filter pinned
export function BuyPage() {
  const [params] = useSearchParams();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [filters, setFilters] = useState<Filters>(() => ({
    ...EMPTY_FILTERS,
    q: params.get("q") ?? "",
    category: params.get("category") ?? "",
    kind: asKindFilter(params.get("kind")) ?? "all",
  }));

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
  const kindParam = params.get("kind");
  useEffect(() => {
    setFilters((f) => ({ ...f, q, category: categoryParam, kind: asKindFilter(kindParam) ?? f.kind }));
  }, [q, categoryParam, kindParam]);

  const patch = (p: Partial<Filters>) => setFilters((f) => ({ ...f, ...p }));
  const reset = () => setFilters((f) => ({ ...EMPTY_FILTERS, q: f.q, kind: f.kind, sort: f.sort }));

  const all = state.status === "loaded" ? state.listings : [];
  const facets = useMemo(() => deriveFacets(all), [all]);
  const results = useMemo(() => applyFilters(all, filters), [all, filters]);
  const providers = useMemo(
    () => deriveProviders(all.filter((l) => categoryKind(l.category) === "accommodation")),
    [all],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 border-b pb-4">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Browse Marketplace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything students are selling, hiring out and renting across Australian campuses.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <FilterSidebar filters={filters} facets={facets} onChange={patch} onReset={reset} />
          </div>
        </aside>

        <div className="min-w-0">
          {filters.kind === "accommodation" && (
            <div className="mb-6">
              <ProviderNav providers={providers} filters={filters} onChange={patch} />
            </div>
          )}

          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              {state.status === "loaded" ? `${results.length} result${results.length === 1 ? "" : "s"}` : " "}
            </p>
            <div className="flex items-center gap-2">
              <MobileFilters filters={filters} facets={facets} onChange={patch} onReset={reset} />
              <SortDropdown value={filters.sort} onChange={(sort) => patch({ sort })} />
            </div>
          </div>

          <ResultsList
            state={state}
            results={results}
            services={filters.kind === "service"}
            kind={filters.kind === "accommodation" ? "accommodation" : filters.kind === "service" ? "service" : "item"}
            onReset={reset}
          />
        </div>
      </div>
    </div>
  );
}
