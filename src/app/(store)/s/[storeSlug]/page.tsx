"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
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
    return <p className="text-muted-foreground">Loading store…</p>;
  }

  if (store === null || !store.active) {
    return (
      <div className="flex flex-col gap-3">
        <SectionHeading as="h1" title="Store not found" />
        <Link href="/" className="text-primary underline">
          Back to stores
        </Link>
      </div>
    );
  }

  const list = search.trim() ? searchResults : products;

  return (
    <div className="flex flex-col gap-8">
      <SectionHeading
        as="h1"
        eyebrow="Store"
        title={store.name}
        description={store.description}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-foreground">
          Search
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products"
            className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5 text-foreground placeholder:text-muted-foreground"
          />
        </label>
        <Link
          href={`/s/${store.slug}/search`}
          className="text-sm font-medium text-primary underline sm:mb-2.5"
        >
          Search page
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={!categorySlug ? "primary" : "secondary"}
          onClick={() => setCategorySlug(undefined)}
        >
          All
        </Button>
        {(categories ?? []).map((category) => (
          <Button
            key={category._id}
            size="sm"
            variant={categorySlug === category.slug ? "primary" : "secondary"}
            onClick={() => setCategorySlug(category.slug)}
          >
            {category.name}
          </Button>
        ))}
      </div>

      {list === undefined ? (
        <p className="text-muted-foreground">Loading products…</p>
      ) : list.length === 0 ? (
        <p className="text-muted-foreground">No products found.</p>
      ) : (
        <ul className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3")}>
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
