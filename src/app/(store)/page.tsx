"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useEffect } from "react";
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
    <div className="flex flex-col gap-8">
      <section className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
          Multi-store groceries
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">
          Shop neighborhood stores in one place.
        </h1>
        <p className="mt-4 text-lg text-stone-600">
          Browse catalogs, save favorites, and check out per store. Membership
          unlocks member pricing across the platform.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-stone-500">
          Stores
        </h2>
        {stores === undefined ? (
          <p className="mt-4 text-stone-500">Loading stores…</p>
        ) : stores.length === 0 ? (
          <p className="mt-4 text-stone-600">
            No stores yet. Create an organization and bootstrap it from{" "}
            <Link href="/admin" className="underline">
              Admin
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {stores.map((store) => (
              <li key={store._id}>
                <Link
                  href={`/s/${store.slug}`}
                  className="block border border-stone-300 bg-white/70 px-4 py-5 transition hover:border-stone-500"
                >
                  <span className="font-serif text-2xl">{store.name}</span>
                  {store.description ? (
                    <span className="mt-2 block text-sm text-stone-600">
                      {store.description}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
