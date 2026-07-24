"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../../convex/_generated/api";

export default function AdminCategoriesPage() {
  const categories = useQuery(api.categories.listMine);
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createCategory({ name });
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold">Categories</h1>
        <p className="mt-2 text-stone-600">
          Organize products for your active store organization.
        </p>
      </div>

      <form onSubmit={(e) => void onCreate(e)} className="flex max-w-md gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          className="flex-1 border border-stone-300 bg-white px-3 py-2"
          required
        />
        <button
          type="submit"
          className="border border-stone-900 bg-stone-900 px-4 py-2 text-white"
        >
          Add
        </button>
      </form>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {categories === undefined ? (
        <p className="text-stone-500">Loading…</p>
      ) : categories.length === 0 ? (
        <p className="text-stone-600">No categories yet.</p>
      ) : (
        <ul className="divide-y divide-stone-200 border border-stone-200 bg-white">
          {categories.map((category) => (
            <li
              key={category._id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="font-medium">{category.name}</p>
                <p className="text-xs text-stone-500">
                  /{category.slug} · sort {category.sortOrder}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  void updateCategory({
                    categoryId: category._id,
                    active: !category.active,
                  })
                }
                className="border border-stone-300 px-3 py-1 text-sm"
              >
                {category.active ? "Deactivate" : "Activate"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
