import Link from "next/link";
import { Container } from "@/components/ui/Container";

type FooterProps = {
  brandLabel?: string;
};

export function Footer({ brandLabel = "Grocer" }: FooterProps) {
  return (
    <footer className="mt-auto border-t border-border bg-surface-muted/50">
      <Container className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
            {brandLabel}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Fresh picks from neighborhood stores.
          </p>
        </div>
        <nav
          className="flex flex-wrap gap-4 text-sm text-muted-foreground"
          aria-label="Footer"
        >
          <Link href="/" className="hover:text-foreground">
            Stores
          </Link>
          <Link href="/membership" className="hover:text-foreground">
            Membership
          </Link>
          <Link href="/admin" className="hover:text-foreground">
            Store admin
          </Link>
        </nav>
      </Container>
    </footer>
  );
}
