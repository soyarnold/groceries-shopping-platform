"use client";

import {
  OrganizationSwitcher,
  SignInButton,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import { useConvexAuth, useQuery } from "convex/react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Footer } from "@/components/ui/Footer";
import { Header } from "@/components/ui/Header";
import { api } from "../../../convex/_generated/api";

export default function StoreLayout({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const { isAuthenticated } = useConvexAuth();
  const cartCount = useQuery(api.cart.countMine, isAuthenticated ? {} : "skip");

  const cartBadge =
    cartCount !== undefined && cartCount > 0 ? `(${cartCount})` : undefined;

  return (
    <div className="flex min-h-full flex-1 flex-col text-foreground">
      <Header
        links={[
          { href: "/cart", label: "Cart", badge: cartBadge },
          { href: "/favorites", label: "Favorites" },
          { href: "/orders", label: "Orders" },
          { href: "/membership", label: "Membership" },
          { href: "/admin", label: "Admin" },
        ]}
        actions={
          isSignedIn ? (
            <>
              <OrganizationSwitcher
                hidePersonal
                afterSelectOrganizationUrl="/admin"
                afterCreateOrganizationUrl="/admin"
              />
              <UserButton />
            </>
          ) : (
            <SignInButton mode="modal">
              <Button size="sm">Sign in</Button>
            </SignInButton>
          )
        }
      />
      <main className="flex flex-1 flex-col py-8 sm:py-10">
        <Container className="flex flex-1 flex-col gap-8">{children}</Container>
      </main>
      <Footer />
    </div>
  );
}
