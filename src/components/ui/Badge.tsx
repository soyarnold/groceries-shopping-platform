import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "primary" | "accent" | "success" | "danger";

const toneClass: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-muted-foreground",
  primary: "bg-primary/12 text-primary",
  accent: "bg-accent/15 text-accent",
  success: "bg-success/12 text-success",
  danger: "bg-danger/12 text-danger",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: BadgeTone;
};

export function Badge({
  children,
  tone = "neutral",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-sm)] px-2 py-0.5 text-xs font-semibold tracking-wide uppercase",
        toneClass[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
