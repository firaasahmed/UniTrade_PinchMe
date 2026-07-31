import { useState, type ReactNode } from "react";
import type { Listing } from "@/types/Listing";
import type { Draft } from "@/utils/listing-draft";
import { toCents } from "@/utils/listing-draft";
import { formatListingPrice, formatDate, formatPrice } from "@/utils/format";
import { categoryIcon, kindAccent } from "@/utils/categories";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, MapPin, BedDouble, Bath, Package, Sofa, CalendarDays, Handshake, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

function PreviewImage({ src, icon: Icon }: { src: string; icon: typeof Package }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
        <Icon className="size-10" />
      </div>
    );
  }
  return <img src={src} alt="preview" className="size-full object-cover" onError={() => setFailed(true)} />;
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Package;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-2 text-muted-foreground">
      <dt className="flex shrink-0 items-center gap-1">
        <Icon className="size-3.5" />
        {label}
      </dt>
      <dd className="min-w-0 flex-1 break-words text-right font-medium text-foreground">{children}</dd>
    </div>
  );
}

export function ListingPreview({ draft, sellerName }: { draft: Draft; sellerName: string }) {
  const cents = toCents(draft.priceDollars) ?? 0;
  const bondCents = toCents(draft.bondDollars) ?? 0;
  const rateUnit = draft.kind === "service" ? "hr" : draft.kind === "accommodation" ? "week" : undefined;
  const priceText = formatListingPrice({ priceCents: cents, rateUnit } as Listing);
  const accent = kindAccent(draft.kind);
  const Icon = draft.category ? categoryIcon(draft.category) : Package;
  const primary = draft.images.find((s) => s.trim() !== "") ?? "";

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="aspect-[4/3] w-full overflow-hidden">
        <PreviewImage src={primary} icon={Icon} />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2">
          {draft.category ? (
            <Badge variant="secondary" className={cn("gap-1 border-transparent", accent.badge)}>
              <Icon className="size-3" />
              {draft.category}
            </Badge>
          ) : (
            <Badge variant="outline">{accent.label}</Badge>
          )}
        </div>
        <h3 className="mt-2 line-clamp-2 font-heading font-semibold leading-tight">
          {draft.title.trim() || "Your title appears here"}
        </h3>
        <p className="mt-1 text-xl font-semibold">{cents > 0 ? priceText : "—"}</p>

        {draft.kind === "accommodation" ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {draft.bedrooms && (
              <span className="flex items-center gap-1">
                <BedDouble className="size-3.5" />
                {draft.bedrooms} bed
              </span>
            )}
            {draft.bathrooms && (
              <span className="flex items-center gap-1">
                <Bath className="size-3.5" />
                {draft.bathrooms} bath
              </span>
            )}
            {draft.furnished && (
              <span className="flex items-center gap-1">
                <Sofa className="size-3.5" />
                Furnished
              </span>
            )}
          </div>
        ) : (
          draft.condition && <p className="mt-2 text-xs text-muted-foreground">{draft.condition}</p>
        )}

        {draft.description.trim() && (
          <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{draft.description}</p>
        )}

        {draft.kind === "accommodation" && (bondCents > 0 || draft.availableFrom || draft.leaseTerm) && (
          <dl className="mt-3 space-y-1 text-xs">
            {bondCents > 0 && (
              <Fact icon={Wallet} label="Bond">
                {formatPrice(bondCents)}
              </Fact>
            )}
            {draft.availableFrom && (
              <Fact icon={CalendarDays} label="Available">
                {formatDate(draft.availableFrom)}
              </Fact>
            )}
            {draft.leaseTerm.trim() && (
              <Fact icon={CalendarDays} label="Lease">
                {draft.leaseTerm}
              </Fact>
            )}
          </dl>
        )}

        {draft.meetup.trim() && (
          <dl className="mt-1 text-xs">
            <Fact icon={Handshake} label={draft.kind === "accommodation" ? "Inspections" : "Meetup"}>
              {draft.meetup}
            </Fact>
          </dl>
        )}

        <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {draft.location.trim() || "Location"}
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-verified" />
            {sellerName}
          </span>
        </div>
      </div>
    </div>
  );
}
