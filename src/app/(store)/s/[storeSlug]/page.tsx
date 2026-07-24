"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { api } from "../../../../../convex/_generated/api";

export default function StoreBrowsePage() {
  const params = useParams<{ storeSlug: string }>();
  const storeSlug = params.storeSlug;
  const [categorySlug, setCategorySlug] = useState<string | undefined>();
  const [search, setSearch] = useState("");

  const store = useQuery(api.stores.getBySlug, { slug: storeSlug });
  const categories = useQuery(api.categories.listActiveByStoreSlug, {
    storeSlug,
  });
  const products = useQuery(api.products.listActiveByStoreSlug, {
    storeSlug,
    categorySlug,
  });
  const searchResults = useQuery(
    api.products.searchByStoreSlug,
    search.trim().length > 0 ? { storeSlug, query: search.trim() } : "skip",
  );

  if (store === undefined) {
    return <p className="text-stone-500">Loading store…</p>;
  }

  if (store === null || !store.active) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-4xl">Store not found</h1>
        <Link href="/" className="underline">
          Back to stores
        </Link>
      </div>
    );
  }

  const list = search.trim() ? searchResults : products;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm uppercase tracking-wide text-stone-500">Store</p>
        <h1 className="font-serif text-4xl">{store.name}</h1>
        {store.description ? (
          <p className="mt-2 max-w-2xl text-stone-600">{store.description}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Search
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products"
            className="border border-stone-300 bg-white px-3 py-2"
          />
        </label>
        <Link
          href={`/s/${store.slug}/search`}
          className="text-sm underline sm:mb-2"
        >
          Search page
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategorySlug(undefined)}
          className={`border px-3 py-1 text-sm ${
            !categorySlug
              ? "border-stone-900 bg-stone-900 text-white"
              : "border-stone-300 bg-white"
          }`}
        >
          All
        </button>
        {(categories ?? []).map((category) => (
          <button
            key={category._id}
            type="button"
            onClick={() => setCategorySlug(category.slug)}
            className={`border px-3 py-1 text-sm ${
              categorySlug === category.slug
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-300 bg-white"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {list === undefined ? (
        <p className="text-stone-500">Loading products…</p>
      ) : list.length === 0 ? (
        <p className="text-stone-600">No products found.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((product) => (
            <li key={product._id}>
              <ProductCard
                storeSlug={store.slug}
                name={product.name}
                slug={product.slug}
                unit={product.unit}
                displayPriceCents={product.displayPriceCents}
                priceCents={product.priceCents}
                memberPriceCents={product.memberPriceCents}
                quantity={product.quantity}
                categoryName={product.categoryName}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
