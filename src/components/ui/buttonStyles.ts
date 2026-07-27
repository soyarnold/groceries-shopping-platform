import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:opacity-90 border border-transparent",
  secondary:
    "bg-surface text-foreground border border-border hover:bg-surface-muted",
  ghost:
    "bg-transparent text-foreground border border-transparent hover:bg-surface-muted",
  danger:
    "bg-danger text-danger-foreground border border-transparent hover:opacity-90",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-5 py-3 text-base gap-2",
};

export type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

/** Styled anchor that matches Button visuals (use with next/link via className or asChild patterns). */
export function buttonClassName(args?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}): string {
  return cn(
    "inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium transition",
    variantClass[args?.variant ?? "primary"],
    sizeClass[args?.size ?? "md"],
    args?.className,
  );
}
