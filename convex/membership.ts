import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ensureCurrentUser, getCurrentUserOrNull } from "./lib/auth";
import {
  type MembershipStatus,
  membershipLabel,
  membershipStatusFromStripe,
} from "./lib/membership";

const membershipStatusValidator = v.union(
  v.literal("none"),
  v.literal("active"),
  v.literal("past_due"),
  v.literal("canceled"),
);

export const getMine = query({
  args: {},
  returns: v.union(
    v.object({
      membershipStatus: membershipStatusValidator,
      membershipEndsAt: v.optional(v.number()),
      stripeCustomerId: v.optional(v.string()),
      label: v.string(),
      isActive: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const user = await getCurrentUserOrNull(ctx);
    if (!user) {
      return null;
    }
    return {
      membershipStatus: user.membershipStatus,
      membershipEndsAt: user.membershipEndsAt,
      stripeCustomerId: user.stripeCustomerId,
      label: membershipLabel(user.membershipStatus),
      isActive: user.membershipStatus === "active",
    };
  },
});

/** Persist Stripe Customer id created during membership Checkout. */
export const attachStripeCustomer = mutation({
  args: { stripeCustomerId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await ensureCurrentUser(ctx);
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    if (
      user.stripeCustomerId &&
      user.stripeCustomerId !== args.stripeCustomerId
    ) {
      throw new Error("User already linked to a different Stripe customer");
    }
    if (!user.stripeCustomerId) {
      await ctx.db.patch(userId, { stripeCustomerId: args.stripeCustomerId });
    }
    return null;
  },
});

/**
 * Called by the Next.js Stripe webhook after signature verification.
 * Updates platform membership from a Stripe Subscription (or Checkout session).
 */
export const applyStripeSubscriptionEvent = mutation({
  args: {
    webhookKey: v.string(),
    stripeEventId: v.string(),
    type: v.string(),
    stripeCustomerId: v.string(),
    stripeSubscriptionStatus: v.string(),
    membershipEndsAt: v.optional(v.number()),
    clerkUserId: v.optional(v.string()),
  },
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx, args) => {
    const expected = process.env.STRIPE_WEBHOOK_BRIDGE_SECRET;
    if (!expected || args.webhookKey !== expected) {
      throw new Error("Unauthorized webhook");
    }

    // Idempotent: Stripe may retry the same event.
    const existingEvent = await ctx.db
      .query("membershipEvents")
      .withIndex("by_stripe_event", (q) =>
        q.eq("stripeEventId", args.stripeEventId),
      )
      .unique();
    if (existingEvent) {
      return existingEvent.userId;
    }

    let user = await ctx.db
      .query("users")
      .withIndex("by_stripe_customer", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId),
      )
      .unique();

    if (!user && args.clerkUserId) {
      const clerkUserId = args.clerkUserId;
      user = await ctx.db
        .query("users")
        .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
        .unique();
      if (user && !user.stripeCustomerId) {
        await ctx.db.patch(user._id, {
          stripeCustomerId: args.stripeCustomerId,
        });
      }
    }

    if (!user) {
      return null;
    }

    const membershipStatus: MembershipStatus = membershipStatusFromStripe(
      args.stripeSubscriptionStatus,
    );

    await ctx.db.patch(user._id, {
      membershipStatus,
      membershipEndsAt: args.membershipEndsAt,
      stripeCustomerId: user.stripeCustomerId ?? args.stripeCustomerId,
    });

    await ctx.db.insert("membershipEvents", {
      userId: user._id,
      stripeEventId: args.stripeEventId,
      type: args.type,
      membershipStatus,
      createdAt: Date.now(),
    });

    return user._id;
  },
});
