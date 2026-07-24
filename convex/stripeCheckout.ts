"use node";

import { v } from "convex/values";
import Stripe from "stripe";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";

function requireStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY on Convex deployment");
  }
  return new Stripe(key);
}

function appBaseUrl(): string {
  const url = process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    throw new Error("Missing APP_BASE_URL on Convex deployment");
  }
  return url.replace(/\/$/, "");
}

type CreatedCheckoutOrder = {
  orderId: Id<"orders">;
  totalCents: number;
  currency: string;
  lineItems: Array<{
    name: string;
    quantity: number;
    unitAmountCents: number;
  }>;
};

export const startForOrg = action({
  args: { orgId: v.string() },
  returns: v.object({
    url: v.string(),
    orderId: v.id("orders"),
    sessionId: v.string(),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    url: string;
    orderId: Id<"orders">;
    sessionId: string;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const created = (await ctx.runMutation(api.orders.createFromCart, {
      orgId: args.orgId,
    })) as CreatedCheckoutOrder;

    const stripe = requireStripe();
    const base = appBaseUrl();

    // Payment mode only — membership subscriptions use a separate Checkout flow.
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${base}/orders/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/cart`,
      line_items: created.lineItems.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: created.currency,
          unit_amount: item.unitAmountCents,
          product_data: { name: item.name },
        },
      })),
      // Webhook fulfillment looks up the order by session id; metadata is backup.
      metadata: {
        orderId: created.orderId,
        orgId: args.orgId,
        clerkUserId: identity.subject,
      },
      client_reference_id: created.orderId,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    // Persist session id so `checkout.session.completed` can find this order.
    await ctx.runMutation(internal.orders.attachCheckoutSession, {
      orderId: created.orderId,
      stripeCheckoutSessionId: session.id,
    });

    return {
      url: session.url,
      orderId: created.orderId,
      sessionId: session.id,
    };
  },
});
