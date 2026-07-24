import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  ensureCurrentUser,
  getCurrentUser,
  getCurrentUserOrNull,
} from "./lib/auth";
import {
  assertCartQuantity,
  clampCartQuantityToStock,
  sumLineCents,
} from "./lib/cart";
import { resolvePriceCents } from "./lib/membership";

const cartLineValidator = v.object({
  _id: v.id("cartItems"),
  _creationTime: v.number(),
  userId: v.id("users"),
  orgId: v.string(),
  productId: v.id("products"),
  quantity: v.number(),
  productName: v.string(),
  productSlug: v.string(),
  unit: v.string(),
  storeSlug: v.string(),
  storeName: v.string(),
  unitPriceCents: v.number(),
  lineTotalCents: v.number(),
  stock: v.union(v.number(), v.null()),
  active: v.boolean(),
});

const cartSummaryValidator = v.object({
  lines: v.array(cartLineValidator),
  itemCount: v.number(),
  subtotalCents: v.number(),
  byOrg: v.array(
    v.object({
      orgId: v.string(),
      storeSlug: v.string(),
      storeName: v.string(),
      itemCount: v.number(),
      subtotalCents: v.number(),
      lines: v.array(cartLineValidator),
    }),
  ),
});

export const getMine = query({
  args: {},
  returns: v.union(cartSummaryValidator, v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const user = await getCurrentUserOrNull(ctx);
    if (!user) {
      return null;
    }
    const membershipStatus = user.membershipStatus;

    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const lines = [];
    for (const item of items) {
      const product = await ctx.db.get(item.productId);
      const store = await ctx.db
        .query("stores")
        .withIndex("by_org", (q) => q.eq("orgId", item.orgId))
        .unique();
      if (!product || !store) {
        continue;
      }
      const inventory = await ctx.db
        .query("inventory")
        .withIndex("by_org_and_product", (q) =>
          q.eq("orgId", item.orgId).eq("productId", item.productId),
        )
        .unique();
      const unitPriceCents = resolvePriceCents({
        priceCents: product.priceCents,
        memberPriceCents: product.memberPriceCents,
        membershipStatus,
      });
      lines.push({
        ...item,
        productName: product.name,
        productSlug: product.slug,
        unit: product.unit,
        storeSlug: store.slug,
        storeName: store.name,
        unitPriceCents,
        lineTotalCents: unitPriceCents * item.quantity,
        stock: inventory?.quantity ?? null,
        active: product.active && store.active,
      });
    }

    lines.sort(
      (a, b) =>
        a.storeName.localeCompare(b.storeName) ||
        a.productName.localeCompare(b.productName),
    );

    const byOrgMap = new Map<
      string,
      {
        orgId: string;
        storeSlug: string;
        storeName: string;
        itemCount: number;
        subtotalCents: number;
        lines: typeof lines;
      }
    >();

    for (const line of lines) {
      const existing = byOrgMap.get(line.orgId);
      if (existing) {
        existing.lines.push(line);
        existing.itemCount += line.quantity;
        existing.subtotalCents += line.lineTotalCents;
      } else {
        byOrgMap.set(line.orgId, {
          orgId: line.orgId,
          storeSlug: line.storeSlug,
          storeName: line.storeName,
          itemCount: line.quantity,
          subtotalCents: line.lineTotalCents,
          lines: [line],
        });
      }
    }

    return {
      lines,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotalCents: sumLineCents(lines),
      byOrg: [...byOrgMap.values()].sort((a, b) =>
        a.storeName.localeCompare(b.storeName),
      ),
    };
  },
});

export const countMine = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return 0;
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) {
      return 0;
    }
    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },
});

export const add = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.optional(v.number()),
  },
  returns: v.id("cartItems"),
  handler: async (ctx, args) => {
    const userId = await ensureCurrentUser(ctx);
    const product = await ctx.db.get(args.productId);
    if (!product || !product.active) {
      throw new Error("Product not found");
    }
    const store = await ctx.db
      .query("stores")
      .withIndex("by_org", (q) => q.eq("orgId", product.orgId))
      .unique();
    if (!store || !store.active) {
      throw new Error("Store not available");
    }

    const addQty = assertCartQuantity(args.quantity ?? 1);
    const inventory = await ctx.db
      .query("inventory")
      .withIndex("by_org_and_product", (q) =>
        q.eq("orgId", product.orgId).eq("productId", product._id),
      )
      .unique();

    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_user_org_product", (q) =>
        q
          .eq("userId", userId)
          .eq("orgId", product.orgId)
          .eq("productId", product._id),
      )
      .unique();

    const nextQty = clampCartQuantityToStock(
      (existing?.quantity ?? 0) + addQty,
      inventory?.quantity,
    );

    if (existing) {
      await ctx.db.patch(existing._id, { quantity: nextQty });
      return existing._id;
    }

    return await ctx.db.insert("cartItems", {
      userId,
      orgId: product.orgId,
      productId: product._id,
      quantity: nextQty,
    });
  },
});

export const setQuantity = mutation({
  args: {
    cartItemId: v.id("cartItems"),
    quantity: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const item = await ctx.db.get(args.cartItemId);
    if (!item || item.userId !== user._id) {
      throw new Error("Cart item not found");
    }

    if (args.quantity === 0) {
      await ctx.db.delete(args.cartItemId);
      return null;
    }

    const inventory = await ctx.db
      .query("inventory")
      .withIndex("by_org_and_product", (q) =>
        q.eq("orgId", item.orgId).eq("productId", item.productId),
      )
      .unique();
    const quantity = clampCartQuantityToStock(
      args.quantity,
      inventory?.quantity,
    );
    await ctx.db.patch(args.cartItemId, { quantity });
    return null;
  },
});

export const remove = mutation({
  args: { cartItemId: v.id("cartItems") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const item = await ctx.db.get(args.cartItemId);
    if (!item || item.userId !== user._id) {
      throw new Error("Cart item not found");
    }
    await ctx.db.delete(args.cartItemId);
    return null;
  },
});

export const clearOrg = mutation({
  args: { orgId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_user_and_org", (q) =>
        q.eq("userId", user._id).eq("orgId", args.orgId),
      )
      .collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    return null;
  },
});
