"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
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
    return <p className="text-muted-foreground">Loading product…</p>;
  }

  if (product === null) {
    return (
      <div className="flex flex-col gap-3">
        <SectionHeading as="h1" title="Product not found" />
        <Link
          href={`/s/${params.storeSlug}`}
          className="text-primary underline"
        >
          Back to store
        </Link>
      </div>
    );
  }

  const outOfStock = product.quantity !== null && product.quantity < 1;

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <Link
        href={`/s/${params.storeSlug}`}
        className="text-sm font-medium text-primary underline"
      >
        Back to store
      </Link>

      <div className="flex flex-wrap gap-2">
        <Badge>{product.categoryName}</Badge>
        {outOfStock ? <Badge tone="danger">Out of stock</Badge> : null}
      </div>

      <SectionHeading
        as="h1"
        title={product.name}
        description={product.description || "No description."}
      />

      <p className="text-3xl font-semibold text-foreground">
        {formatPriceCents(product.displayPriceCents)}
        <span className="ml-2 text-base font-normal text-muted-foreground">
          / {product.unit}
        </span>
      </p>

      {product.quantity !== null && !outOfStock ? (
        <p className="text-sm text-muted-foreground">
          {product.quantity} in stock
        </p>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}

      {isSignedIn ? (
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={outOfStock}
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
          </Button>
          <Button
            variant="secondary"
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
          </Button>
        </div>
      ) : (
        <Card>
          <p className="text-sm text-muted-foreground">
            <SignInButton mode="modal">
              <button
                type="button"
                className="font-medium text-primary underline"
              >
                Sign in
              </button>
            </SignInButton>{" "}
            to add to cart or favorites.
          </p>
        </Card>
      )}
    </div>
  );
}
