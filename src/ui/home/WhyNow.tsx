import { useEffect, useRef, useState } from "react";
import { PinchLogo } from "@/ui/brand/PinchLogo";
import { cn } from "@/lib/utils";
import {
  Banknote,
  MessageCircleWarning,
  ShieldCheck,
  Users,
} from "lucide-react";

type Beat = {
  title: string;
  body: string;
  icon: typeof Users;
  highlight?: boolean;
};

const BEATS: Beat[] = [
  {
    title: "Campus noticeboards",
    body: "Paper ads, cash, and whoever walks past.",
    icon: Users,
  },
  {
    title: "Open platforms",
    body: "Strangers, bond scams, no paper trail.",
    icon: MessageCircleWarning,
  },
  {
    title: "Cash meetups",
    body: "The money was always the riskiest part.",
    icon: Banknote,
  },
  {
    title: "Verified + Pinch",
    body: "Uni emails, agreed deals, card payments that stick.",
    icon: ShieldCheck,
    highlight: true,
  },
];

/**
 * Dark “why now” timeline — UniTrade’s shift from risky campus trade to Pinch-backed safety.
 */
export function WhyNow() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActive(BEATS.length);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        BEATS.forEach((_, i) => {
          window.setTimeout(() => setActive(i + 1), 350 + i * 420);
        });
        observer.disconnect();
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-gradient-to-b from-nav-from to-nav-to text-primary-foreground"
    >
      <div className="pointer-events-none absolute left-1/4 top-0 size-72 -translate-x-1/2 rounded-full bg-gold/15 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 size-80 rounded-full bg-verified/15 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          Why now
        </p>
        <h2 className="mx-auto mt-3 max-w-3xl font-heading text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
          Every semester creates the same market.{" "}
          <span className="text-gold">It just never had infrastructure.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-primary-foreground/70 sm:text-base">
          Thousands of international students leave selling exactly what the next
          intake needs. That trade still happens on open platforms and in cash.
          UniTrade puts it behind verified accounts and Pinch.
        </p>

        <div className="relative mx-auto mt-14 max-w-4xl">
          <div
            aria-hidden
            className="pointer-events-none absolute top-5 right-[12.5%] left-[12.5%] hidden h-px bg-primary-foreground/20 sm:block"
          >
            <div
              className="h-full origin-left bg-gradient-to-r from-primary-foreground/40 via-gold to-gold transition-transform duration-1000 ease-out"
              style={{ transform: `scaleX(${Math.min(active / BEATS.length, 1)})` }}
            />
          </div>

          <ol className="grid gap-8 sm:grid-cols-4 sm:gap-4">
            {BEATS.map((beat, i) => {
              const lit = active > i;
              const Icon = beat.icon;
              const isLast = Boolean(beat.highlight);

              return (
                <li
                  key={beat.title}
                  className={cn(
                    "relative flex flex-col items-center text-center transition-all duration-500",
                    lit ? "translate-y-0 opacity-100" : "translate-y-3 opacity-40",
                  )}
                >
                  <div
                    className={cn(
                      "relative z-10 flex size-10 items-center justify-center rounded-full border transition-all duration-500",
                      isLast && lit
                        ? "scale-110 border-gold bg-gold text-gold-foreground shadow-[0_0_28px_rgb(234,179,8,0.45)]"
                        : lit
                          ? "border-primary-foreground/40 bg-nav-to text-primary-foreground"
                          : "border-primary-foreground/20 bg-nav-to/80 text-primary-foreground/50",
                    )}
                  >
                    <Icon className="size-4" />
                  </div>

                  <h3
                    className={cn(
                      "mt-4 font-heading text-sm font-bold sm:text-[0.95rem]",
                      isLast && lit && "text-gold underline decoration-gold/50 underline-offset-4",
                    )}
                  >
                    {beat.title}
                  </h3>
                  <p className="mt-1.5 max-w-[11rem] text-xs leading-relaxed text-primary-foreground/60 sm:text-[0.8rem]">
                    {beat.body}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>

        <blockquote className="mx-auto mt-16 max-w-3xl font-heading text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
          UniTrade is where the deal lives: verified students, agreed in chat,{" "}
          <span className="text-gold">paid through Pinch.</span>
        </blockquote>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-primary-foreground/65">
          <span>Campus trade with a payment trail. Powered by</span>
          <span className="rounded-md bg-primary-foreground px-1.5 py-0.5">
            <PinchLogo height={15} />
          </span>
        </div>
      </div>
    </section>
  );
}
