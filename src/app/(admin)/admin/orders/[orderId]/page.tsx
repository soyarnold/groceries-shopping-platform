"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { formatPriceCents } from "../../../../../../convex/lib/catalog";

export default function AdminOrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const detail = useQuery(api.orders.getForActiveStore, {
    orderId: params.orderId as Id<"orders">,
  });

  if (detail === undefined) {
    return <p className="text-stone-500">Loading…</p>;
  }

  if (detail === null) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold">Order not found</h1>
        <Link href="/admin/orders" className="underline">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/orders" className="text-sm underline">
        Back to orders
      </Link>
      <div>
        <h1 className="text-3xl font-semibold">{detail.order.status}</h1>
        <p className="mt-2 text-stone-600">
          {detail.customerName} · {detail.customerEmail}
        </p>
        <p className="text-stone-600">
          Total {formatPriceCents(detail.order.totalCents)}
        </p>
      </div>
      <ul className="divide-y divide-stone-200 border border-stone-200 bg-white">
        {detail.items.map((item) => (
          <li key={item._id} className="flex justify-between px-4 py-3 text-sm">
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
