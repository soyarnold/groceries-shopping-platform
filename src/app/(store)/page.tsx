"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useEffect } from "react";
import { buttonClassName } from "@/components/ui/buttonStyles";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { api } from "../../../convex/_generated/api";

export default function HomePage() {
  const { isAuthenticated } = useConvexAuth();
  const stores = useQuery(api.stores.listActive);
  const ensureUser = useMutation(api.users.ensure);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    void ensureUser();
  }, [ensureUser, isAuthenticated]);

  return (
    <div className="flex flex-col gap-10">
      <section className="hero-panel relative overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface px-6 py-10 sm:px-10 sm:py-14">
        <div className="relative max-w-2xl">
          <SectionHeading
            as="h1"
            eyebrow="Neighborhood groceries"
            title="Shop local stores in one place"
            description="Browse catalogs, save favorites, and check out per store. Plus membership unlocks member pricing across the platform."
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#stores" className={buttonClassName({ size: "lg" })}>
              Browse stores
            </a>
            <Link
              href="/membership"
              className={buttonClassName({ variant: "secondary", size: "lg" })}
            >
              See Plus benefits
            </Link>
          </div>
        </div>
      </section>

      <section id="stores" className="flex flex-col gap-5">
        <SectionHeading
          as="h2"
          eyebrow="Stores"
          title="Pick a market"
          description="Each store has its own catalog, cart checkout, and hours of inventory."
        />
        {stores === undefined ? (
          <p className="text-muted-foreground">Loading stores…</p>
        ) : stores.length === 0 ? (
          <Card>
            <p className="text-muted-foreground">
              No stores yet. Create an organization and bootstrap it from{" "}
              <Link
                href="/admin"
                className="font-medium text-primary underline"
              >
                Admin
              </Link>
              .
            </p>
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {stores.map((store) => (
              <li key={store._id}>
                <Link href={`/s/${store.slug}`} className="block no-underline">
                  <Card interactive>
                    <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-foreground">
                      {store.name}
                    </p>
                    {store.description ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {store.description}
                      </p>
                    ) : null}
                    <p className="mt-4 text-sm font-medium text-primary">
                      Shop this store →
                    </p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
