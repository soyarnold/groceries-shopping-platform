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

/**
 * Stripe → Next.js → Convex bridge.
 *
 * Stripe cannot call Convex mutations directly with verified signatures, so this
 * route verifies the Stripe webhook, then calls `orders.completeCheckoutSession`
 * with `STRIPE_WEBHOOK_BRIDGE_SECRET` (shared with the Convex deployment).
 *
 * Local: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
 * and set `STRIPE_WEBHOOK_SECRET` to the printed `whsec_…` value.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  // From Stripe Dashboard / `stripe listen` — proves the request is from Stripe.
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  // Shared with Convex; authorizes our verified webhook to mark orders paid.
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

  // Phase 4: one-time Checkout payments. Subscription events land in phase 5.
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    // Ignore subscription mode sessions (membership) — different fulfillment path.
    if (session.mode === "payment") {
      const client = new ConvexHttpClient(convexUrl);
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
  }

  // Always 200 after a valid signature so Stripe does not retry forever.
  return NextResponse.json({ received: true });
}
