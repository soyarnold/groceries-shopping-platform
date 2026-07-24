"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { api } from "../../../../../../convex/_generated/api";

export default function StoreSearchPage() {
  const params = useParams<{ storeSlug: string }>();
  const searchParams = useSearchParams();
  const storeSlug = params.storeSlug;
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const store = useQuery(api.stores.getBySlug, { slug: storeSlug });
  const results = useQuery(
    api.products.searchByStoreSlug,
    query.trim().length > 0 ? { storeSlug, query: query.trim() } : "skip",
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/s/${storeSlug}`} className="text-sm underline">
          Back to store
        </Link>
        <h1 className="mt-2 font-serif text-4xl">
          Search {store?.name ?? "store"}
        </h1>
      </div>
      <label className="flex max-w-xl flex-col gap-1 text-sm">
        Query
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. milk, apples"
          className="border border-stone-300 bg-white px-3 py-2"
        />
      </label>
      {query.trim().length === 0 ? (
        <p className="text-stone-600">Type to search products.</p>
      ) : results === undefined ? (
        <p className="text-stone-500">Searching…</p>
      ) : results.length === 0 ? (
        <p className="text-stone-600">No matches.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((product) => (
            <li key={product._id}>
              <ProductCard
                storeSlug={storeSlug}
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
