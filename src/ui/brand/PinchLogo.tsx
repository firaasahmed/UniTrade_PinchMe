import { cn } from "@/lib/utils";

/** Official Pinch wordmark — coral icon + navy "pinch" text */
export function PinchLogo({
  className,
  height = 20,
}: {
  className?: string;
  /** rendered height in px; width scales with the asset */
  height?: number;
}) {
  return (
    <img
      src="/pinch-logo.png"
      alt="Pinch"
      height={height}
      className={cn("inline-block w-auto object-contain object-left", className)}
      style={{ height }}
    />
  );
}

export function PinchSecureLine({
  className,
  label = "Payments processed securely by",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <p className={cn("flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground", className)}>
      <span>{label}</span>
      <PinchLogo height={16} />
    </p>
  );
}
