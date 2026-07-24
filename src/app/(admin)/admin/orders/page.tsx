"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import { formatPriceCents } from "../../../../../convex/lib/catalog";

const NEXT_STATUS: Record<string, string | undefined> = {
  paid: "preparing",
  preparing: "ready",
  ready: "completed",
};

export default function AdminOrdersPage() {
  const orders = useQuery(api.orders.listForActiveStore);
  const updateStatus = useMutation(api.orders.updateStatus);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Orders</h1>
        <p className="mt-2 text-stone-600">
          Fulfill paid orders for the active store organization.
        </p>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {orders === undefined ? (
        <p className="text-stone-500">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-stone-600">No orders yet.</p>
      ) : (
        <ul className="divide-y divide-stone-200 border border-stone-200 bg-white">
          {orders.map((order) => {
            const next = NEXT_STATUS[order.status];
            return (
              <li
                key={order._id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <Link
                    href={`/admin/orders/${order._id}`}
                    className="font-medium hover:underline"
                  >
                    {order.status} · {formatPriceCents(order.totalCents)}
                  </Link>
                  <p className="text-xs text-stone-500">
                    {new Date(order._creationTime).toLocaleString()}
                  </p>
                </div>
                {next ? (
                  <button
                    type="button"
                    className="border border-stone-900 bg-stone-900 px-3 py-1 text-sm text-white"
                    onClick={() => {
                      setError(null);
                      void updateStatus({
                        orderId: order._id,
                        status: next as "preparing" | "ready" | "completed",
                      }).catch((err: unknown) =>
                        setError(
                          err instanceof Error ? err.message : "Update failed",
                        ),
                      );
                    }}
                  >
                    Mark {next}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
