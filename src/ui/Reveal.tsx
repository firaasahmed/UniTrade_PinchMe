import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Fades content up the first time it scrolls into view.
 * Respects prefers-reduced-motion (content just appears).
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  /** stagger in ms, for grids of cards */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      // fire slightly before the element fully enters, so it never feels late
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delay && shown ? { animationDelay: `${delay}ms` } : undefined}
      className={cn(
        shown
          ? "animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards duration-700"
          : "opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
