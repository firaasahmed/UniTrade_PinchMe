import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, ExternalLink, CheckCircle2 } from "lucide-react";

type DiscountItem = {
  id: string;
  brand: string;
  discount: string;
  title: string;
  code: string;
  url: string;
  bgGradient: string;
  badgeBg: string;
  logo: string;
};

const DISCOUNTS: DiscountItem[] = [
  {
    id: "apple",
    brand: "Apple Education",
    discount: "20% OFF",
    title: "MacBook Air & iPad",
    code: "UNITRADE",
    url: "https://www.apple.com/au-edu/shop",
    bgGradient: "from-slate-900 via-slate-800 to-slate-900 text-white border-slate-700",
    badgeBg: "bg-amber-400 text-slate-950 font-bold",
    logo: "",
  },
  {
    id: "lenovo",
    brand: "Lenovo Student",
    discount: "15% OFF",
    title: "ThinkPad & Yoga",
    code: "UNITRADE",
    url: "https://www.lenovo.com/au/en/education/",
    bgGradient: "from-red-950 via-slate-900 to-slate-900 text-white border-red-900/60",
    badgeBg: "bg-red-500 text-white font-bold",
    logo: "L",
  },
  {
    id: "dell",
    brand: "Dell Student",
    discount: "15% OFF",
    title: "XPS & Displays",
    code: "UNITRADE",
    url: "https://www.dell.com/en-au/shop/dell-advantage/cp/students",
    bgGradient: "from-blue-950 via-slate-900 to-slate-900 text-white border-blue-900/60",
    badgeBg: "bg-blue-500 text-white font-bold",
    logo: "D",
  },
];

export function AffiliateStudentDiscounts({ onReset }: { onReset?: () => void }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function handleClaim(item: DiscountItem) {
    setCopiedId(item.id);
    void navigator.clipboard.writeText(item.code).catch(() => { });
    toast.success(`${item.brand} Student Discount Code (${item.code}) Copied!`, {
      description: `Opening ${item.brand} Education Store...`,
    });
    setTimeout(() => {
      window.open(item.url, "_blank", "noopener,noreferrer");
      setCopiedId(null);
    }, 800);
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-4 shadow-sm sm:p-5">
      {/* Minimal Header & Search Reset Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <GraduationCap className="size-4" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-bold text-foreground sm:text-base">
              No items found? Get Official Student Discounts
            </h3>
            <p className="text-xs text-muted-foreground">
              Save up to 20% on brand new tech with UniTrade student affiliate links.
            </p>
          </div>
        </div>
        {onReset && (
          <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs font-medium">
            Clear filters
          </Button>
        )}
      </div>

      {/* Minimal 3-card grid right at the top */}
      <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {DISCOUNTS.map((item) => (
          <div
            key={item.id}
            className={`flex flex-col justify-between rounded-xl border ${item.bgGradient} bg-gradient-to-br p-3.5 shadow-sm transition-transform hover:-translate-y-0.5`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-7 items-center justify-center rounded-lg bg-white/10 font-bold text-sm">
                  {item.logo}
                </div>
                <Badge className={`${item.badgeBg} border-none text-[11px] px-2 py-0.5`}>
                  {item.discount}
                </Badge>
              </div>

              <h4 className="mt-2.5 font-heading text-sm font-bold text-white">
                {item.brand}
              </h4>
              <p className="text-xs text-white/80">{item.title}</p>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between rounded-md bg-black/40 px-2.5 py-1 text-[11px]">
                <span className="text-white/60">Code:</span>
                <span className="font-mono font-bold text-amber-300">{item.code}</span>
              </div>

              <Button
                onClick={() => handleClaim(item)}
                size="sm"
                className="h-8 w-full bg-white text-slate-950 hover:bg-white/90 font-bold text-xs shadow-xs"
              >
                {copiedId === item.id ? (
                  <>
                    <CheckCircle2 className="mr-1 size-3.5 text-emerald-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-1 size-3.5" />
                    Claim Discount
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
