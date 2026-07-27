import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { type NavItem, Navigation } from "@/components/ui/Navigation";
import { cn } from "@/lib/cn";

type HeaderProps = {
  brandHref?: string;
  brandLabel?: string;
  brandSubLabel?: string;
  links?: NavItem[];
  actions?: ReactNode;
  className?: string;
};

export function Header({
  brandHref = "/",
  brandLabel = "Grocer",
  brandSubLabel,
  links = [],
  actions,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/80 bg-surface/90 backdrop-blur-md",
        className,
      )}
    >
      <Container className="flex min-h-[var(--header-height)] flex-wrap items-center justify-between gap-x-4 gap-y-3 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-4 lg:gap-8">
          <Link href={brandHref} className="min-w-0 shrink-0 no-underline">
            <span className="block font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-foreground">
              {brandLabel}
            </span>
            {brandSubLabel ? (
              <span className="block text-xs font-medium text-muted-foreground">
                {brandSubLabel}
              </span>
            ) : null}
          </Link>
          {links.length > 0 ? <Navigation links={links} /> : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {actions}
          </div>
        ) : null}
      </Container>
    </header>
  );
}
