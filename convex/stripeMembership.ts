"use node";

import { v } from "convex/values";
import Stripe from "stripe";
import { api } from "./_generated/api";
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

function membershipPriceId(): string {
  const priceId = process.env.STRIPE_MEMBERSHIP_PRICE_ID;
  if (!priceId) {
    throw new Error("Missing STRIPE_MEMBERSHIP_PRICE_ID on Convex deployment");
  }
  return priceId;
}

/**
 * Start Stripe Checkout in subscription mode for the platform Plus plan.
 * Creates (or reuses) a Stripe Customer and stores the id on the Convex user.
 */
export const startCheckout = action({
  args: {},
  returns: v.object({
    url: v.string(),
    sessionId: v.string(),
  }),
  handler: async (
    ctx,
  ): Promise<{
    url: string;
    sessionId: string;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.runQuery(api.users.me, {});
    if (!user) {
      await ctx.runMutation(api.users.ensure, {});
    }
    const ensured = await ctx.runQuery(api.users.me, {});
    if (!ensured) {
      throw new Error("User not found");
    }
    if (ensured.membershipStatus === "active") {
      throw new Error("Membership is already active");
    }

    const stripe = requireStripe();
    const base = appBaseUrl();
    const priceId = membershipPriceId();

    let customerId = ensured.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: ensured.email || identity.email || undefined,
        name: ensured.name || identity.name || undefined,
        metadata: {
          clerkUserId: identity.subject,
          convexUserId: ensured._id,
        },
      });
      customerId = customer.id;
      await ctx.runMutation(api.membership.attachStripeCustomer, {
        stripeCustomerId: customerId,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/membership?checkout=success`,
      cancel_url: `${base}/membership?checkout=canceled`,
      metadata: {
        clerkUserId: identity.subject,
        convexUserId: ensured._id,
        purpose: "platform_membership",
      },
      subscription_data: {
        metadata: {
          clerkUserId: identity.subject,
          convexUserId: ensured._id,
          purpose: "platform_membership",
        },
      },
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    return { url: session.url, sessionId: session.id };
  },
});

/** Open Stripe Customer Billing Portal to manage/cancel the subscription. */
export const createBillingPortal = action({
  args: {},
  returns: v.object({ url: v.string() }),
  handler: async (ctx): Promise<{ url: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.runQuery(api.users.me, {});
    if (!user?.stripeCustomerId) {
      throw new Error("No Stripe customer on this account yet");
    }

    const stripe = requireStripe();
    const base = appBaseUrl();
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${base}/membership`,
    });

    return { url: portal.url };
  },
});
