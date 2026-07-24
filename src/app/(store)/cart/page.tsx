"use client";

import { useAuth } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { formatPriceCents } from "../../../../convex/lib/catalog";

export default function CartPage() {
  const { isSignedIn } = useAuth();
  const { isAuthenticated } = useConvexAuth();
  const cart = useQuery(api.cart.getMine, isAuthenticated ? {} : "skip");
  const setQuantity = useMutation(api.cart.setQuantity);
  const remove = useMutation(api.cart.remove);
  const [error, setError] = useState<string | null>(null);

  if (!isSignedIn) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-4xl">Cart</h1>
        <p className="text-stone-600">Sign in to view your cart.</p>
      </div>
    );
  }

  if (cart === undefined) {
    return <p className="text-stone-500">Loading cart…</p>;
  }

  if (cart === null || cart.lines.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-4xl">Cart</h1>
        <p className="text-stone-600">Your cart is empty.</p>
        <Link href="/" className="underline">
          Browse stores
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-4xl">Cart</h1>
        <p className="mt-2 text-stone-600">
          {cart.itemCount} items · {formatPriceCents(cart.subtotalCents)}
        </p>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {cart.byOrg.map((group) => (
        <section key={group.orgId} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-serif text-2xl">{group.storeName}</h2>
            <Link
              href={`/checkout/${group.orgId}`}
              className="text-sm underline"
            >
              Checkout this store (phase 4)
            </Link>
          </div>
          <ul className="divide-y divide-stone-200 border border-stone-200 bg-white/80">
            {group.lines.map((line) => (
              <li
                key={line._id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <Link
                    href={`/s/${line.storeSlug}/p/${line.productSlug}`}
                    className="font-medium hover:underline"
                  >
                    {line.productName}
                  </Link>
                  <p className="text-xs text-stone-500">
                    {formatPriceCents(line.unitPriceCents)} / {line.unit}
                    {!line.active ? " · unavailable" : ""}
                    {line.stock !== null ? ` · stock ${line.stock}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="border border-stone-300 px-2 py-1 text-sm"
                    onClick={() => {
                      setError(null);
                      void setQuantity({
                        cartItemId: line._id,
                        quantity: line.quantity - 1,
                      }).catch((err: unknown) =>
                        setError(
                          err instanceof Error ? err.message : "Update failed",
                        ),
                      );
                    }}
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    className="border border-stone-300 px-2 py-1 text-sm"
                    onClick={() => {
                      setError(null);
                      void setQuantity({
                        cartItemId: line._id,
                        quantity: line.quantity + 1,
                      }).catch((err: unknown) =>
                        setError(
                          err instanceof Error ? err.message : "Update failed",
                        ),
                      );
                    }}
                  >
                    +
                  </button>
                  <span className="ml-2 text-sm font-medium">
                    {formatPriceCents(line.lineTotalCents)}
                  </span>
                  <button
                    type="button"
                    className="border border-stone-300 px-2 py-1 text-sm"
                    onClick={() => {
                      setError(null);
                      void remove({ cartItemId: line._id }).catch(
                        (err: unknown) =>
                          setError(
                            err instanceof Error
                              ? err.message
                              : "Remove failed",
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
          <p className="text-sm text-stone-600">
            Store subtotal {formatPriceCents(group.subtotalCents)}
          </p>
        </section>
      ))}
    </div>
  );
}
