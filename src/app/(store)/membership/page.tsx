"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "../../../../convex/_generated/api";

function MembershipContent() {
  const searchParams = useSearchParams();
  const checkoutState = searchParams.get("checkout");
  const ensureUser = useMutation(api.users.ensure);
  const membership = useQuery(api.membership.getMine);
  const startCheckout = useAction(api.stripeMembership.startCheckout);
  const openPortal = useAction(api.stripeMembership.createBillingPortal);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null);

  useEffect(() => {
    void ensureUser({});
  }, [ensureUser]);

  async function onSubscribe() {
    setLoading("checkout");
    setError(null);
    try {
      const result = await startCheckout({});
      window.location.href = result.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setLoading(null);
    }
  }

  async function onManage() {
    setLoading("portal");
    setError(null);
    try {
      const result = await openPortal({});
      window.location.href = result.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open portal");
      setLoading(null);
    }
  }

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <h1 className="font-serif text-4xl">Membership</h1>
      <p className="text-stone-600">
        Platform Plus unlocks member pricing on stores that offer it. Favorites
        and orders work on a free account.
      </p>

      {checkoutState === "success" ? (
        <p className="border border-stone-300 bg-white/80 px-3 py-2 text-sm">
          Checkout complete. Membership updates when Stripe confirms the
          subscription (usually within a few seconds).
        </p>
      ) : null}
      {checkoutState === "canceled" ? (
        <p className="text-sm text-stone-600">Checkout canceled — no charge.</p>
      ) : null}

      {membership === undefined ? (
        <p className="text-sm text-stone-500">Loading…</p>
      ) : membership === null ? (
        <p className="text-sm text-stone-500">Sign in to manage membership.</p>
      ) : (
        <div className="flex flex-col gap-3 border border-stone-300 bg-white/80 p-4">
          <p className="text-sm uppercase tracking-wide text-stone-500">
            Status
          </p>
          <p className="font-serif text-2xl">{membership.label}</p>
          {membership.membershipEndsAt ? (
            <p className="text-sm text-stone-600">
              Current period ends{" "}
              {new Date(membership.membershipEndsAt).toLocaleDateString()}
            </p>
          ) : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <div className="mt-2 flex flex-wrap gap-3">
            {!membership.isActive ? (
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => void onSubscribe()}
                className="border border-stone-900 bg-stone-900 px-4 py-2 text-white disabled:opacity-50"
              >
                {loading === "checkout" ? "Redirecting…" : "Subscribe to Plus"}
              </button>
            ) : null}
            {membership.stripeCustomerId ? (
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => void onManage()}
                className="border border-stone-400 px-4 py-2 disabled:opacity-50"
              >
                {loading === "portal" ? "Opening…" : "Manage billing"}
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MembershipPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-3">
          <h1 className="font-serif text-4xl">Membership</h1>
          <p className="text-sm text-stone-500">Loading…</p>
        </div>
      }
    >
      <MembershipContent />
    </Suspense>
  );
}
