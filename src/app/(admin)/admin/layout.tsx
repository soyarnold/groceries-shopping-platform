"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClassName } from "@/components/ui/buttonStyles";
import { Container } from "@/components/ui/Container";
import { Header } from "@/components/ui/Header";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col text-foreground">
      <Header
        brandHref="/admin"
        brandLabel="Grocer"
        brandSubLabel="Store admin"
        links={[
          { href: "/admin/products", label: "Products" },
          { href: "/admin/categories", label: "Categories" },
          { href: "/admin/inventory", label: "Inventory" },
          { href: "/admin/orders", label: "Orders" },
          { href: "/admin/customers", label: "Customers" },
        ]}
        actions={
          <>
            <Link
              href="/"
              className={buttonClassName({ variant: "ghost", size: "sm" })}
            >
              Storefront
            </Link>
            <OrganizationSwitcher
              hidePersonal
              afterSelectOrganizationUrl="/admin"
              afterCreateOrganizationUrl="/admin"
            />
            <UserButton />
          </>
        }
      />
      <main className="flex flex-1 flex-col py-8 sm:py-10">
        <Container className="flex flex-1 flex-col gap-8">{children}</Container>
      </main>
    </div>
  );
}
