"use client";

import { useAction } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "../../../../../convex/_generated/api";

export default function CheckoutPage() {
  const params = useParams<{ orgId: string }>();
  const startCheckout = useAction(api.stripeCheckout.startForOrg);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onCheckout() {
    setLoading(true);
    setError(null);
    try {
      const result = await startCheckout({ orgId: params.orgId });
      window.location.href = result.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setLoading(false);
    }
  }

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <Link href="/cart" className="text-sm underline">
        Back to cart
      </Link>
      <h1 className="font-serif text-4xl">Checkout</h1>
      <p className="text-stone-600">
        You&apos;ll pay securely with Stripe for this store&apos;s cart items.
      </p>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="button"
        disabled={loading}
        onClick={() => void onCheckout()}
        className="border border-stone-900 bg-stone-900 px-4 py-3 text-white disabled:opacity-50"
      >
        {loading ? "Redirecting…" : "Pay with Stripe"}
      </button>
    </div>
  );
}
