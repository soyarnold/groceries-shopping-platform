"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { formatPriceCents } from "../../../../../convex/lib/catalog";

export default function AdminProductsPage() {
  const products = useQuery(api.products.listMine);
  const categories = useQuery(api.categories.listMine);
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);

  const [categoryId, setCategoryId] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("each");
  const [priceDollars, setPriceDollars] = useState("1.99");
  const [memberDollars, setMemberDollars] = useState("");
  const [initialQuantity, setInitialQuantity] = useState("10");
  const [error, setError] = useState<string | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!categoryId) {
      setError("Pick a category");
      return;
    }
    try {
      const priceCents = Math.round(Number.parseFloat(priceDollars) * 100);
      const memberPriceCents = memberDollars
        ? Math.round(Number.parseFloat(memberDollars) * 100)
        : undefined;
      await createProduct({
        categoryId: categoryId as Id<"categories">,
        name,
        description,
        unit,
        priceCents,
        memberPriceCents,
        initialQuantity: Number.parseInt(initialQuantity, 10),
      });
      setName("");
      setDescription("");
      setMemberDollars("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    }
  }

  const activeCategories = (categories ?? []).filter((c) => c.active);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold">Products</h1>
        <p className="mt-2 text-stone-600">
          Create catalog items for the active store org.
        </p>
      </div>

      <form
        onSubmit={(e) => void onCreate(e)}
        className="grid max-w-2xl gap-3 border border-stone-200 bg-white p-4"
      >
        <label className="flex flex-col gap-1 text-sm">
          Category
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border border-stone-300 px-3 py-2"
            required
          >
            <option value="">Select…</option>
            {activeCategories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-stone-300 px-3 py-2"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-stone-300 px-3 py-2"
            rows={2}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            Unit
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="border border-stone-300 px-3 py-2"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Price ($)
            <input
              value={priceDollars}
              onChange={(e) => setPriceDollars(e.target.value)}
              className="border border-stone-300 px-3 py-2"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Member price ($)
            <input
              value={memberDollars}
              onChange={(e) => setMemberDollars(e.target.value)}
              className="border border-stone-300 px-3 py-2"
              placeholder="optional"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          Initial quantity
          <input
            value={initialQuantity}
            onChange={(e) => setInitialQuantity(e.target.value)}
            className="border border-stone-300 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="justify-self-start border border-stone-900 bg-stone-900 px-4 py-2 text-white"
        >
          Add product
        </button>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </form>

      {products === undefined ? (
        <p className="text-stone-500">Loading…</p>
      ) : products.length === 0 ? (
        <p className="text-stone-600">No products yet.</p>
      ) : (
        <ul className="divide-y divide-stone-200 border border-stone-200 bg-white">
          {products.map((product) => (
            <li
              key={product._id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-xs text-stone-500">
                  /{product.slug} · {formatPriceCents(product.priceCents)} /{" "}
                  {product.unit}
                  {product.memberPriceCents !== undefined
                    ? ` · member ${formatPriceCents(product.memberPriceCents)}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  void updateProduct({
                    productId: product._id,
                    active: !product.active,
                  })
                }
                className="border border-stone-300 px-3 py-1 text-sm"
              >
                {product.active ? "Deactivate" : "Activate"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
