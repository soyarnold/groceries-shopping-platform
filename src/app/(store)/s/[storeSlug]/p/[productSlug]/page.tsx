"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "../../../../../../../convex/_generated/api";
import { formatPriceCents } from "../../../../../../../convex/lib/catalog";

export default function ProductDetailPage() {
  const params = useParams<{ storeSlug: string; productSlug: string }>();
  const product = useQuery(api.products.getByStoreAndSlug, {
    storeSlug: params.storeSlug,
    productSlug: params.productSlug,
  });

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
      <p className="text-sm text-stone-500">Add to cart arrives in phase 3.</p>
    </div>
  );
}
