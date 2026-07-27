"use client";

import { useAuth } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { buttonClassName } from "@/components/ui/buttonStyles";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
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
        <SectionHeading as="h1" title="Cart" />
        <p className="text-muted-foreground">Sign in to view your cart.</p>
      </div>
    );
  }

  if (cart === undefined) {
    return <p className="text-muted-foreground">Loading cart…</p>;
  }

  if (cart === null || cart.lines.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <SectionHeading
          as="h1"
          title="Cart"
          description="Your cart is empty."
        />
        <Link href="/" className={buttonClassName({ variant: "secondary" })}>
          Browse stores
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeading
        as="h1"
        title="Cart"
        description={`${cart.itemCount} items · ${formatPriceCents(cart.subtotalCents)}`}
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {cart.byOrg.map((group) => (
        <section key={group.orgId} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
              {group.storeName}
            </h2>
            <Link
              href={`/checkout/${group.orgId}`}
              className={buttonClassName({ size: "sm" })}
            >
              Checkout this store
            </Link>
          </div>
          <Card padded={false}>
            <ul className="divide-y divide-border">
              {group.lines.map((line) => (
                <li
                  key={line._id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <Link
                      href={`/s/${line.storeSlug}/p/${line.productSlug}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {line.productName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatPriceCents(line.unitPriceCents)} / {line.unit}
                      {!line.active ? " · unavailable" : ""}
                      {line.stock !== null ? ` · stock ${line.stock}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconButton
                      label="Decrease quantity"
                      onClick={() => {
                        setError(null);
                        void setQuantity({
                          cartItemId: line._id,
                          quantity: line.quantity - 1,
                        }).catch((err: unknown) =>
                          setError(
                            err instanceof Error
                              ? err.message
                              : "Update failed",
                          ),
                        );
                      }}
                    >
                      −
                    </IconButton>
                    <span className="w-8 text-center text-sm font-medium">
                      {line.quantity}
                    </span>
                    <IconButton
                      label="Increase quantity"
                      onClick={() => {
                        setError(null);
                        void setQuantity({
                          cartItemId: line._id,
                          quantity: line.quantity + 1,
                        }).catch((err: unknown) =>
                          setError(
                            err instanceof Error
                              ? err.message
                              : "Update failed",
                          ),
                        );
                      }}
                    >
                      +
                    </IconButton>
                    <span className="ml-2 min-w-16 text-right text-sm font-semibold">
                      {formatPriceCents(line.lineTotalCents)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
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
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          <p className="text-sm text-muted-foreground">
            Store subtotal {formatPriceCents(group.subtotalCents)}
          </p>
        </section>
      ))}
    </div>
  );
}
