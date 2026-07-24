import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  ensureCurrentUser,
  getCurrentUser,
  getCurrentUserOrNull,
} from "./lib/auth";
import { resolvePriceCents } from "./lib/membership";

const favoriteValidator = v.object({
  _id: v.id("favorites"),
  _creationTime: v.number(),
  userId: v.id("users"),
  orgId: v.string(),
  productId: v.id("products"),
  productName: v.string(),
  productSlug: v.string(),
  unit: v.string(),
  storeSlug: v.string(),
  storeName: v.string(),
  displayPriceCents: v.number(),
  active: v.boolean(),
});

export const listMine = query({
  args: {},
  returns: v.union(v.array(favoriteValidator), v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const user = await getCurrentUserOrNull(ctx);
    if (!user) {
      return null;
    }
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const enriched = [];
    for (const favorite of favorites) {
      const product = await ctx.db.get(favorite.productId);
      const store = await ctx.db
        .query("stores")
        .withIndex("by_org", (q) => q.eq("orgId", favorite.orgId))
        .unique();
      if (!product || !store) {
        continue;
      }
      enriched.push({
        ...favorite,
        productName: product.name,
        productSlug: product.slug,
        unit: product.unit,
        storeSlug: store.slug,
        storeName: store.name,
        displayPriceCents: resolvePriceCents({
          priceCents: product.priceCents,
          memberPriceCents: product.memberPriceCents,
          membershipStatus: user.membershipStatus,
        }),
        active: product.active && store.active,
      });
    }

    return enriched.sort(
      (a, b) =>
        a.storeName.localeCompare(b.storeName) ||
        a.productName.localeCompare(b.productName),
    );
  },
});

export const isFavorited = query({
  args: { productId: v.id("products") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) {
      return false;
    }
    const product = await ctx.db.get(args.productId);
    if (!product) {
      return false;
    }
    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_user_org_product", (q) =>
        q
          .eq("userId", user._id)
          .eq("orgId", product.orgId)
          .eq("productId", product._id),
      )
      .unique();
    return favorite !== null;
  },
});

export const toggle = mutation({
  args: { productId: v.id("products") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const userId = await ensureCurrentUser(ctx);
    const product = await ctx.db.get(args.productId);
    if (!product || !product.active) {
      throw new Error("Product not found");
    }

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_org_product", (q) =>
        q
          .eq("userId", userId)
          .eq("orgId", product.orgId)
          .eq("productId", product._id),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }

    await ctx.db.insert("favorites", {
      userId,
      orgId: product.orgId,
      productId: product._id,
    });
    return true;
  },
});

export const remove = mutation({
  args: { favoriteId: v.id("favorites") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const favorite = await ctx.db.get(args.favoriteId);
    if (!favorite || favorite.userId !== user._id) {
      throw new Error("Favorite not found");
    }
    await ctx.db.delete(args.favoriteId);
    return null;
  },
});
