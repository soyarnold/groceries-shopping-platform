import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { api } from "../../../../../convex/_generated/api";

// Stripe webhooks need the Node runtime for signature verification (raw body + crypto).
export const runtime = "nodejs";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  return new Stripe(key);
}

function customerIdOf(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): string | undefined {
  if (!customer) {
    return undefined;
  }
  return typeof customer === "string" ? customer : customer.id;
}

function membershipEndsAtMs(
  subscription: Stripe.Subscription,
): number | undefined {
  // Stripe API moved period bounds onto subscription items.
  const fromItem = subscription.items.data[0]?.current_period_end;
  if (fromItem) {
    return fromItem * 1000;
  }
  if (subscription.cancel_at) {
    return subscription.cancel_at * 1000;
  }
  if (subscription.ended_at) {
    return subscription.ended_at * 1000;
  }
  return undefined;
}

async function applySubscription(
  client: ConvexHttpClient,
  bridgeSecret: string,
  event: Stripe.Event,
  subscription: Stripe.Subscription,
  clerkUserIdFallback?: string,
) {
  const stripeCustomerId = customerIdOf(subscription.customer);
  if (!stripeCustomerId) {
    return;
  }

  await client.mutation(api.membership.applyStripeSubscriptionEvent, {
    webhookKey: bridgeSecret,
    stripeEventId: event.id,
    type: event.type,
    stripeCustomerId,
    stripeSubscriptionStatus: subscription.status,
    membershipEndsAt: membershipEndsAtMs(subscription),
    clerkUserId: subscription.metadata.clerkUserId ?? clerkUserIdFallback,
  });
}

/**
 * Stripe → Next.js → Convex bridge.
 *
 * Stripe cannot call Convex mutations directly with verified signatures, so this
 * route verifies the Stripe webhook, then calls Convex with
 * `STRIPE_WEBHOOK_BRIDGE_SECRET` (shared with the Convex deployment).
 *
 * Local: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
 * and set `STRIPE_WEBHOOK_SECRET` to the printed `whsec_…` value.
 *
 * Events:
 * - checkout.session.completed (mode=payment) → order paid
 * - checkout.session.completed (mode=subscription) + subscription.* → membership
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  // From Stripe Dashboard / `stripe listen` — proves the request is from Stripe.
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  // Shared with Convex; authorizes our verified webhook to mutate Convex.
  const bridgeSecret = process.env.STRIPE_WEBHOOK_BRIDGE_SECRET;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!signature || !webhookSecret || !bridgeSecret || !convexUrl) {
    return NextResponse.json(
      { error: "Webhook is not configured" },
      { status: 500 },
    );
  }

  // Must use the raw body; parsing JSON first breaks signature verification.
  const body = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const client = new ConvexHttpClient(convexUrl);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.mode === "payment") {
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;

      await client.mutation(api.orders.completeCheckoutSession, {
        webhookKey: bridgeSecret,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
      });
    }

    // Membership Checkout: sync from the created subscription (also covered by
    // customer.subscription.* events; this catches the first success promptly).
    if (session.mode === "subscription" && session.subscription) {
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await applySubscription(
        client,
        bridgeSecret,
        event,
        subscription,
        session.metadata?.clerkUserId,
      );
    }
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    await applySubscription(client, bridgeSecret, event, subscription);
  }

  // Always 200 after a valid signature so Stripe does not retry forever.
  return NextResponse.json({ received: true });
}
