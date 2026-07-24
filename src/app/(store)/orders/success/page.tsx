"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { api } from "../../../../../convex/_generated/api";

function SuccessInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const router = useRouter();
  const orderId = useQuery(
    api.orders.getByCheckoutSession,
    sessionId ? { stripeCheckoutSessionId: sessionId } : "skip",
  );

  useEffect(() => {
    if (orderId) {
      router.replace(`/orders/${orderId}`);
    }
  }, [orderId, router]);

  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-serif text-4xl">Payment received</h1>
      <p className="text-stone-600">
        {orderId
          ? "Redirecting to your order…"
          : "Confirming your order. If this takes a moment, open Orders shortly."}
      </p>
      <Link href="/orders" className="underline">
        View orders
      </Link>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<p className="text-stone-500">Loading…</p>}>
      <SuccessInner />
    </Suspense>
  );
}
