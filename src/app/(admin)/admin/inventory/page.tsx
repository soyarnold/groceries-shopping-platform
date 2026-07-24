"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../../convex/_generated/api";

export default function AdminInventoryPage() {
  const rows = useQuery(api.inventory.listMine);
  const setQuantity = useMutation(api.inventory.setQuantity);
  const adjustQuantity = useMutation(api.inventory.adjustQuantity);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold">Inventory</h1>
        <p className="mt-2 text-stone-600">
          Adjust stock levels for products in the active store.
        </p>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {rows === undefined ? (
        <p className="text-stone-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-stone-600">
          No inventory rows yet. Create a product first.
        </p>
      ) : (
        <ul className="divide-y divide-stone-200 border border-stone-200 bg-white">
          {rows.map((row) => {
            const draft = drafts[row._id] ?? String(row.quantity);
            return (
              <li
                key={row._id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{row.productName}</p>
                  <p className="text-xs text-stone-500">
                    qty {row.quantity}
                    {row.lowStock ? " · low stock" : ""} · threshold{" "}
                    {row.lowStockThreshold}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="border border-stone-300 px-2 py-1 text-sm"
                    onClick={() => {
                      setError(null);
                      void adjustQuantity({
                        productId: row.productId,
                        delta: -1,
                      }).catch((err: unknown) =>
                        setError(
                          err instanceof Error ? err.message : "Adjust failed",
                        ),
                      );
                    }}
                  >
                    −1
                  </button>
                  <button
                    type="button"
                    className="border border-stone-300 px-2 py-1 text-sm"
                    onClick={() => {
                      setError(null);
                      void adjustQuantity({
                        productId: row.productId,
                        delta: 1,
                      }).catch((err: unknown) =>
                        setError(
                          err instanceof Error ? err.message : "Adjust failed",
                        ),
                      );
                    }}
                  >
                    +1
                  </button>
                  <input
                    value={draft}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [row._id]: e.target.value,
                      }))
                    }
                    className="w-20 border border-stone-300 px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    className="border border-stone-900 bg-stone-900 px-3 py-1 text-sm text-white"
                    onClick={() => {
                      setError(null);
                      void setQuantity({
                        productId: row.productId,
                        quantity: Number.parseInt(draft, 10),
                      })
                        .then(() =>
                          setDrafts((prev) => {
                            const next = { ...prev };
                            delete next[row._id];
                            return next;
                          }),
                        )
                        .catch((err: unknown) =>
                          setError(
                            err instanceof Error ? err.message : "Set failed",
                          ),
                        );
                    }}
                  >
                    Set
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
