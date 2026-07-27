import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type NavItem = {
  href: string;
  label: string;
  badge?: ReactNode;
};

type NavigationProps = {
  links: NavItem[];
  className?: string;
  linkClassName?: string;
};

export function Navigation({
  links,
  className,
  linkClassName,
}: NavigationProps) {
  return (
    <nav
      className={cn("flex flex-wrap items-center gap-1 sm:gap-2", className)}
      aria-label="Primary"
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-[var(--radius-md)] px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-surface-muted hover:text-foreground",
            linkClassName,
          )}
        >
          {link.label}
          {link.badge ? (
            <span className="ml-1.5 text-primary">{link.badge}</span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
