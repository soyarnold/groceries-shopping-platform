"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-stone-100 text-stone-900">
      <header className="border-b border-stone-300 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-lg font-semibold">
              Store Admin
            </Link>
            <Link href="/" className="text-sm text-stone-500 hover:underline">
              Storefront
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <OrganizationSwitcher
              hidePersonal
              afterSelectOrganizationUrl="/admin"
              afterCreateOrganizationUrl="/admin"
            />
            <UserButton />
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-6xl gap-4 overflow-x-auto px-4 pb-3 text-sm sm:px-6">
          <Link href="/admin/products" className="hover:underline">
            Products
          </Link>
          <Link href="/admin/categories" className="hover:underline">
            Categories
          </Link>
          <Link href="/admin/inventory" className="hover:underline">
            Inventory
          </Link>
          <Link href="/admin/orders" className="hover:underline">
            Orders
          </Link>
          <Link href="/admin/customers" className="hover:underline">
            Customers
          </Link>
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
