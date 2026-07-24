"use client";

import { useAuth } from "@clerk/nextjs";
import { useConvexAuth, useQuery } from "convex/react";
import Link from "next/link";
import { api } from "../../../../convex/_generated/api";
import { formatPriceCents } from "../../../../convex/lib/catalog";

export default function OrdersPage() {
  const { isSignedIn } = useAuth();
  const { isAuthenticated } = useConvexAuth();
  const orders = useQuery(api.orders.listMine, isAuthenticated ? {} : "skip");

  if (!isSignedIn) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-4xl">Orders</h1>
        <p className="text-stone-600">Sign in to view orders.</p>
      </div>
    );
  }

  if (orders === undefined) {
    return <p className="text-stone-500">Loading orders…</p>;
  }

  if (orders === null || orders.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-4xl">Orders</h1>
        <p className="text-stone-600">No orders yet.</p>
        <Link href="/" className="underline">
          Browse stores
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-4xl">Orders</h1>
      <ul className="divide-y divide-stone-200 border border-stone-200 bg-white/80">
        {orders.map((order) => (
          <li key={order._id} className="px-4 py-3">
            <Link
              href={`/orders/${order._id}`}
              className="flex flex-wrap items-center justify-between gap-2 hover:underline"
            >
              <div>
                <p className="font-medium">
                  {order.storeName ?? "Store"} · {order.status}
                </p>
                <p className="text-xs text-stone-500">
                  {new Date(order._creationTime).toLocaleString()}
                </p>
              </div>
              <p className="font-medium">
                {formatPriceCents(order.totalCents)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
