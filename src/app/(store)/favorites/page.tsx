"use client";

import { useAuth } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { formatPriceCents } from "../../../../convex/lib/catalog";

export default function FavoritesPage() {
  const { isSignedIn } = useAuth();
  const { isAuthenticated } = useConvexAuth();
  const favorites = useQuery(
    api.favorites.listMine,
    isAuthenticated ? {} : "skip",
  );
  const remove = useMutation(api.favorites.remove);
  const addToCart = useMutation(api.cart.add);
  const [error, setError] = useState<string | null>(null);

  if (!isSignedIn) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-4xl">Favorites</h1>
        <p className="text-stone-600">Sign in to save favorites.</p>
      </div>
    );
  }

  if (favorites === undefined) {
    return <p className="text-stone-500">Loading favorites…</p>;
  }

  if (favorites === null || favorites.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-4xl">Favorites</h1>
        <p className="text-stone-600">No favorites yet.</p>
        <Link href="/" className="underline">
          Browse stores
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-4xl">Favorites</h1>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <ul className="divide-y divide-stone-200 border border-stone-200 bg-white/80">
        {favorites.map((favorite) => (
          <li
            key={favorite._id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <div>
              <p className="text-xs uppercase tracking-wide text-stone-500">
                {favorite.storeName}
              </p>
              <Link
                href={`/s/${favorite.storeSlug}/p/${favorite.productSlug}`}
                className="font-medium hover:underline"
              >
                {favorite.productName}
              </Link>
              <p className="text-xs text-stone-500">
                {formatPriceCents(favorite.displayPriceCents)} / {favorite.unit}
                {!favorite.active ? " · unavailable" : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="border border-stone-900 bg-stone-900 px-3 py-1 text-sm text-white disabled:opacity-40"
                disabled={!favorite.active}
                onClick={() => {
                  setError(null);
                  void addToCart({ productId: favorite.productId }).catch(
                    (err: unknown) =>
                      setError(
                        err instanceof Error ? err.message : "Add failed",
                      ),
                  );
                }}
              >
                Add to cart
              </button>
              <button
                type="button"
                className="border border-stone-300 px-3 py-1 text-sm"
                onClick={() => {
                  setError(null);
                  void remove({ favoriteId: favorite._id }).catch(
                    (err: unknown) =>
                      setError(
                        err instanceof Error ? err.message : "Remove failed",
                      ),
                  );
                }}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
