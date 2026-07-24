"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "../../../../../../../convex/_generated/api";
import { formatPriceCents } from "../../../../../../../convex/lib/catalog";

export default function ProductDetailPage() {
  const params = useParams<{ storeSlug: string; productSlug: string }>();
  const { isSignedIn } = useAuth();
  const { isAuthenticated } = useConvexAuth();
  const product = useQuery(api.products.getByStoreAndSlug, {
    storeSlug: params.storeSlug,
    productSlug: params.productSlug,
  });
  const favorited = useQuery(
    api.favorites.isFavorited,
    isAuthenticated && product ? { productId: product._id } : "skip",
  );
  const addToCart = useMutation(api.cart.add);
  const toggleFavorite = useMutation(api.favorites.toggle);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (product === undefined) {
    return <p className="text-stone-500">Loading product…</p>;
  }

  if (product === null) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-4xl">Product not found</h1>
        <Link href={`/s/${params.storeSlug}`} className="underline">
          Back to store
        </Link>
      </div>
    );
  }

  const outOfStock = product.quantity !== null && product.quantity < 1;

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Link href={`/s/${params.storeSlug}`} className="text-sm underline">
        Back to store
      </Link>
      <p className="text-xs uppercase tracking-wide text-stone-500">
        {product.categoryName}
      </p>
      <h1 className="font-serif text-5xl">{product.name}</h1>
      <p className="text-stone-600">
        {product.description || "No description."}
      </p>
      <p className="text-2xl font-medium">
        {formatPriceCents(product.displayPriceCents)}
        <span className="ml-2 text-base font-normal text-stone-500">
          / {product.unit}
        </span>
      </p>
      {product.quantity !== null ? (
        <p className="text-sm text-stone-500">
          {product.quantity > 0
            ? `${product.quantity} in stock`
            : "Out of stock"}
        </p>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-800">{message}</p> : null}

      {isSignedIn ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={outOfStock}
            className="border border-stone-900 bg-stone-900 px-4 py-2 text-white disabled:opacity-40"
            onClick={() => {
              setError(null);
              setMessage(null);
              void addToCart({ productId: product._id })
                .then(() => setMessage("Added to cart"))
                .catch((err: unknown) =>
                  setError(err instanceof Error ? err.message : "Add failed"),
                );
            }}
          >
            Add to cart
          </button>
          <button
            type="button"
            className="border border-stone-300 px-4 py-2"
            onClick={() => {
              setError(null);
              setMessage(null);
              void toggleFavorite({ productId: product._id })
                .then((on) =>
                  setMessage(
                    on ? "Saved to favorites" : "Removed from favorites",
                  ),
                )
                .catch((err: unknown) =>
                  setError(
                    err instanceof Error ? err.message : "Favorite failed",
                  ),
                );
            }}
          >
            {favorited ? "Unfavorite" : "Favorite"}
          </button>
        </div>
      ) : (
        <p className="text-sm text-stone-600">
          <SignInButton mode="modal">
            <button type="button" className="underline">
              Sign in
            </button>
          </SignInButton>{" "}
          to add to cart or favorites.
        </p>
      )}
    </div>
  );
}
