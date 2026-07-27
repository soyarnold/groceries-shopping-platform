import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  padded?: boolean;
  interactive?: boolean;
};

export function Card({
  children,
  className,
  padded = true,
  interactive = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-border bg-surface shadow-[0_1px_0_color-mix(in_srgb,var(--foreground)_4%,transparent)]",
        padded && "p-4 sm:p-5",
        interactive &&
          "transition hover:border-primary/40 hover:bg-surface-muted/40",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
