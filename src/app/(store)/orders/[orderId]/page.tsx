"use client";

import { useConvexAuth, useQuery } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { formatPriceCents } from "../../../../../convex/lib/catalog";

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const { isAuthenticated } = useConvexAuth();
  const detail = useQuery(
    api.orders.getMine,
    isAuthenticated ? { orderId: params.orderId as Id<"orders"> } : "skip",
  );

  if (detail === undefined) {
    return <p className="text-stone-500">Loading order…</p>;
  }

  if (detail === null) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-4xl">Order not found</h1>
        <Link href="/orders" className="underline">
          Back to orders
        </Link>
      </div>
    );
  }

  const { order, items } = detail;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/orders" className="text-sm underline">
        Back to orders
      </Link>
      <div>
        <h1 className="font-serif text-4xl">{order.storeName ?? "Order"}</h1>
        <p className="mt-2 text-stone-600">
          Status: {order.status} · {formatPriceCents(order.totalCents)}
        </p>
      </div>
      <ul className="divide-y divide-stone-200 border border-stone-200 bg-white/80">
        {items.map((item) => (
          <li
            key={item._id}
            className="flex items-center justify-between px-4 py-3 text-sm"
          >
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>{formatPriceCents(item.lineTotalCents)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
