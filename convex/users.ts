import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ensureCurrentUser, getCurrentUser } from "./lib/auth";

export const ensure = mutation({
  args: {},
  returns: v.id("users"),
  handler: async (ctx) => {
    return await ensureCurrentUser(ctx);
  },
});

export const me = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      tokenIdentifier: v.string(),
      clerkUserId: v.string(),
      email: v.string(),
      name: v.string(),
      stripeCustomerId: v.optional(v.string()),
      membershipStatus: v.union(
        v.literal("none"),
        v.literal("active"),
        v.literal("past_due"),
        v.literal("canceled"),
      ),
      membershipEndsAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
  },
});

export const requireMe = query({
  args: {},
  returns: v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    tokenIdentifier: v.string(),
    clerkUserId: v.string(),
    email: v.string(),
    name: v.string(),
    stripeCustomerId: v.optional(v.string()),
    membershipStatus: v.union(
      v.literal("none"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
    ),
    membershipEndsAt: v.optional(v.number()),
  }),
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});
