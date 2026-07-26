import type { Filters } from "@/utils/listing-filters";
import type { Providers } from "@/utils/providers";
import { CategoryCard } from "@/ui/browse/CategoryCard";
import { GraduationCap, Building2, LayoutGrid } from "lucide-react";

export function ProviderNav({
  providers,
  filters,
  onChange,
}: {
  providers: Providers;
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
}) {
  if (providers.uniCount === 0 && providers.agencies.length === 0) return null;
  const uniActive = filters.sellerOrg === "university";
  const allActive = !uniActive && !filters.sellerId;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <CategoryCard
        label="All accommodation"
        icon={LayoutGrid}
        active={allActive}
        onClick={() => onChange({ sellerOrg: "", sellerId: "" })}
      />

      {providers.uniCount > 0 && (
        <CategoryCard
          label="University housing"
          sub={`${providers.uniCount} room${providers.uniCount === 1 ? "" : "s"}`}
          icon={GraduationCap}
          active={uniActive}
          onClick={() => onChange(uniActive ? { sellerOrg: "" } : { sellerOrg: "university", sellerId: "" })}
        />
      )}

      {providers.agencies.map((a) => {
        const active = filters.sellerId === a.id;
        return (
          <CategoryCard
            key={a.id}
            label={a.name}
            sub={`Agency · ${a.count} listing${a.count === 1 ? "" : "s"}`}
            icon={Building2}
            active={active}
            onClick={() => onChange(active ? { sellerId: "" } : { sellerId: a.id, sellerOrg: "" })}
          />
        );
      })}
    </div>
  );
}
