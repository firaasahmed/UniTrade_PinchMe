import { cn } from "@/lib/utils";

// wordmark only — bold, unit-main sizing
export function UniTradeLogo({
  className,
  showWordmark = true,
  onDark = false,
}: {
  className?: string;
  showWordmark?: boolean;
  onDark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      {showWordmark && (
        <span
          className={cn(
            "font-heading text-[1.75rem] leading-none font-extrabold tracking-tight",
            onDark ? "text-white" : "text-foreground",
          )}
        >
          UniTrade
        </span>
      )}
    </span>
  );
}
