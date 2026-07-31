import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PinchLogo } from "@/ui/brand/PinchLogo";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

const LISTINGS = [
  {
    title: "Campus room",
    image: "/listings/room-furnished.jpg",
    price: "$320/wk",
    rotate: "-rotate-3",
  },
  {
    title: "Study laptop",
    image: "/listings/laptop-1.jpg",
    price: "$520",
    rotate: "rotate-2",
    featured: true,
  },
  {
    title: "Maths tutoring",
    image: "/listings/tutoring-1.jpg",
    price: "$40/hr",
    rotate: "rotate-3",
  },
] as const;

/**
 * Hero demo: one listing from each marketplace kind + a light Pinch pay chip.
 */
export function PinchHeroPanel() {
  const [lit, setLit] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLit(true);
      return;
    }
    const t = window.setTimeout(() => setLit(true), 900);
    return () => window.clearTimeout(t);
  }, []);

  const featured = LISTINGS[1]!;

  return (
    <div className="relative mx-auto w-full max-w-lg animate-in fade-in zoom-in-95 duration-1000 lg:max-w-none">
      <div className="flex items-end justify-center gap-3 sm:gap-4">
        {LISTINGS.map((item, i) => (
          <MiniListing
            key={item.title}
            item={item}
            featured={"featured" in item && item.featured === true}
            delay={i * 90}
          />
        ))}
      </div>

      <div
        className={cn(
          "mx-auto mt-5 flex max-w-sm items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 text-foreground shadow-xl shadow-black/25 transition-all duration-500",
          lit ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        )}
      >
        <img
          src={featured.image}
          alt=""
          className="size-12 shrink-0 rounded-xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{featured.title}</p>
          <p className="text-xs text-muted-foreground">Agreed · pay once</p>
        </div>
        <Button asChild size="sm" className="shrink-0 rounded-xl font-semibold">
          <Link to="/register">
            <Lock className="size-3.5" />
            {featured.price}
          </Link>
        </Button>
      </div>

      <div
        className={cn(
          "mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-primary-foreground/55 transition-opacity duration-500",
          lit ? "opacity-100" : "opacity-0",
        )}
      >
        <span>via</span>
        <span className="rounded-md bg-primary-foreground px-1 py-0.5">
          <PinchLogo height={12} />
        </span>
      </div>
    </div>
  );
}

function MiniListing({
  item,
  featured,
  delay,
}: {
  item: (typeof LISTINGS)[number];
  featured: boolean;
  delay: number;
}) {
  return (
    <div
      className={cn(
        "w-[30%] max-w-[9.5rem] animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700",
        item.rotate,
        featured && "z-10 w-[34%] max-w-[11rem] -translate-y-2",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={cn(
          "overflow-hidden rounded-2xl border bg-card text-foreground shadow-lg shadow-black/30 transition-transform duration-300 hover:-translate-y-1",
          featured ? "border-gold/50 ring-2 ring-gold/30" : "border-border/50",
        )}
      >
        <div className={cn("overflow-hidden bg-muted", featured ? "aspect-[4/5]" : "aspect-square")}>
          <img src={item.image} alt={item.title} className="size-full object-cover" />
        </div>
        <div className="px-2 py-2 sm:px-2.5">
          <p className="truncate text-[11px] font-semibold sm:text-xs">{item.title}</p>
          <p className="font-heading text-sm font-bold text-primary">{item.price}</p>
        </div>
      </div>
    </div>
  );
}
