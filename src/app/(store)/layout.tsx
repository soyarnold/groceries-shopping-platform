"use client";

import {
  OrganizationSwitcher,
  SignInButton,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import Link from "next/link";
import type { ReactNode } from "react";

export default function StoreLayout({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#f6f3ee] text-[#1c1917]">
      <header className="border-b border-stone-300/70 bg-[#f6f3ee]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="font-serif text-2xl tracking-tight">
            Grocer
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-4 text-sm">
            <Link href="/cart" className="hover:underline">
              Cart
            </Link>
            <Link href="/favorites" className="hover:underline">
              Favorites
            </Link>
            <Link href="/orders" className="hover:underline">
              Orders
            </Link>
            <Link href="/membership" className="hover:underline">
              Membership
            </Link>
            <Link href="/admin" className="hover:underline">
              Admin
            </Link>
            {isSignedIn ? (
              <>
                <OrganizationSwitcher
                  hidePersonal
                  afterSelectOrganizationUrl="/admin"
                  afterCreateOrganizationUrl="/admin"
                />
                <UserButton />
              </>
            ) : (
              <SignInButton mode="modal" />
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
