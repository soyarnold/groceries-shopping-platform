import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";
import {
  ensureCurrentUser,
  getCurrentUser,
  getCurrentUserOrNull,
} from "./lib/auth";
import { resolvePriceCents } from "./lib/membership";
import {
  assertAdminTransition,
  computeOrderTotals,
  type OrderStatus,
} from "./lib/orders";
import { requireActiveOrgId } from "./lib/org";

const orderStatusValidator = v.union(
  v.literal("pending_payment"),
  v.literal("paid"),
  v.literal("preparing"),
  v.literal("ready"),
  v.literal("completed"),
  v.literal("canceled"),
  v.literal("refunded"),
);

const orderValidator = v.object({
  _id: v.id("orders"),
  _creationTime: v.number(),
  orgId: v.string(),
  userId: v.id("users"),
  status: orderStatusValidator,
  subtotalCents: v.number(),
  totalCents: v.number(),
  currency: v.string(),
  stripeCheckoutSessionId: v.optional(v.string()),
  stripePaymentIntentId: v.optional(v.string()),
  memberPricingApplied: v.boolean(),
  storeName: v.optional(v.string()),
  storeSlug: v.optional(v.string()),
});

const orderItemValidator = v.object({
  _id: v.id("orderItems"),
  _creationTime: v.number(),
  orderId: v.id("orders"),
  productId: v.id("products"),
  name: v.string(),
  unit: v.string(),
  quantity: v.number(),
  unitPriceCents: v.number(),
  lineTotalCents: v.number(),
});

export const listMine = query({
  args: {},
  returns: v.union(v.array(orderValidator), v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const user = await getCurrentUserOrNull(ctx);
    if (!user) {
      return null;
    }
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const enriched = [];
    for (const order of orders) {
      const store = await ctx.db
        .query("stores")
        .withIndex("by_org", (q) => q.eq("orgId", order.orgId))
        .unique();
      enriched.push({
        ...order,
        storeName: store?.name,
        storeSlug: store?.slug,
      });
    }

    return enriched.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getMine = query({
  args: { orderId: v.id("orders") },
  returns: v.union(
    v.object({
      order: orderValidator,
      items: v.array(orderItemValidator),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrNull(ctx);
    if (!user) {
      return null;
    }
    const order = await ctx.db.get(args.orderId);
    if (!order || order.userId !== user._id) {
      return null;
    }
    const store = await ctx.db
      .query("stores")
      .withIndex("by_org", (q) => q.eq("orgId", order.orgId))
      .unique();
    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", order._id))
      .collect();
    return {
      order: {
        ...order,
        storeName: store?.name,
        storeSlug: store?.slug,
      },
      items,
    };
  },
});

export const listForActiveStore = query({
  args: {},
  returns: v.array(orderValidator),
  handler: async (ctx) => {
    const orgId = await requireActiveOrgId(ctx);
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();
    return orders.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getForActiveStore = query({
  args: { orderId: v.id("orders") },
  returns: v.union(
    v.object({
      order: orderValidator,
      items: v.array(orderItemValidator),
      customerEmail: v.string(),
      customerName: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const orgId = await requireActiveOrgId(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order || order.orgId !== orgId) {
      return null;
    }
    const user = await ctx.db.get(order.userId);
    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", order._id))
      .collect();
    return {
      order,
      items,
      customerEmail: user?.email ?? "",
      customerName: user?.name ?? "",
    };
  },
});

export const updateStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: orderStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const orgId = await requireActiveOrgId(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order || order.orgId !== orgId) {
      throw new Error("Order not found");
    }
    assertAdminTransition(
      order.status as OrderStatus,
      args.status as OrderStatus,
    );
    await ctx.db.patch(args.orderId, { status: args.status });
    return null;
  },
});

/** Create a pending order from the caller's cart for one store org. */
export const createFromCart = mutation({
  args: { orgId: v.string() },
  returns: v.object({
    orderId: v.id("orders"),
    totalCents: v.number(),
    currency: v.string(),
    lineItems: v.array(
      v.object({
        name: v.string(),
        quantity: v.number(),
        unitAmountCents: v.number(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const userId = await ensureCurrentUser(ctx);
    const user = await getCurrentUser(ctx);

    const store = await ctx.db
      .query("stores")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .unique();
    if (!store || !store.active) {
      throw new Error("Store not available");
    }

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user_and_org", (q) =>
        q.eq("userId", userId).eq("orgId", args.orgId),
      )
      .collect();
    if (cartItems.length === 0) {
      throw new Error("Cart is empty for this store");
    }

    const priced = [];
    for (const item of cartItems) {
      const product = await ctx.db.get(item.productId);
      if (!product || !product.active || product.orgId !== args.orgId) {
        throw new Error("Cart contains an unavailable product");
      }
      const inventory = await ctx.db
        .query("inventory")
        .withIndex("by_org_and_product", (q) =>
          q.eq("orgId", args.orgId).eq("productId", product._id),
        )
        .unique();
      if (inventory && inventory.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }
      const unitPriceCents = resolvePriceCents({
        priceCents: product.priceCents,
        memberPriceCents: product.memberPriceCents,
        membershipStatus: user.membershipStatus,
      });
      priced.push({
        product,
        quantity: item.quantity,
        unitPriceCents,
        lineTotalCents: unitPriceCents * item.quantity,
      });
    }

    const { subtotalCents, totalCents } = computeOrderTotals(
      priced.map((p) => ({
        unitPriceCents: p.unitPriceCents,
        quantity: p.quantity,
      })),
    );

    const memberPricingApplied = priced.some(
      (p) =>
        p.product.memberPriceCents !== undefined &&
        p.unitPriceCents === p.product.memberPriceCents,
    );

    const orderId = await ctx.db.insert("orders", {
      orgId: args.orgId,
      userId,
      status: "pending_payment",
      subtotalCents,
      totalCents,
      currency: "usd",
      memberPricingApplied,
    });

    for (const line of priced) {
      await ctx.db.insert("orderItems", {
        orderId,
        productId: line.product._id,
        name: line.product.name,
        unit: line.product.unit,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
        lineTotalCents: line.lineTotalCents,
      });
    }

    return {
      orderId,
      totalCents,
      currency: "usd",
      lineItems: priced.map((p) => ({
        name: `${p.product.name} (${p.product.unit})`,
        quantity: p.quantity,
        unitAmountCents: p.unitPriceCents,
      })),
    };
  },
});

/** Store Stripe session id on the pending order so the webhook can resolve it. */
export const attachCheckoutSession = internalMutation({
  args: {
    orderId: v.id("orders"),
    stripeCheckoutSessionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    await ctx.db.patch(args.orderId, {
      stripeCheckoutSessionId: args.stripeCheckoutSessionId,
    });
    return null;
  },
});

export const markPaidFromCheckoutSession = internalMutation({
  args: {
    stripeCheckoutSessionId: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
  },
  returns: v.union(v.id("orders"), v.null()),
  handler: async (ctx, args) => {
    return await markOrderPaid(ctx, args);
  },
});

export const getByCheckoutSession = query({
  args: { stripeCheckoutSessionId: v.string() },
  returns: v.union(v.id("orders"), v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrNull(ctx);
    if (!user) {
      return null;
    }
    const order = await ctx.db
      .query("orders")
      .withIndex("by_checkout_session", (q) =>
        q.eq("stripeCheckoutSessionId", args.stripeCheckoutSessionId),
      )
      .unique();
    if (!order || order.userId !== user._id) {
      return null;
    }
    return order._id;
  },
});

/**
 * Public entry used only by `/api/stripe/webhook` after Stripe signature checks.
 * Auth is the shared `STRIPE_WEBHOOK_BRIDGE_SECRET` (Next.js + Convex env), not Clerk.
 */
export const completeCheckoutSession = mutation({
  args: {
    webhookKey: v.string(),
    stripeCheckoutSessionId: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
  },
  returns: v.union(v.id("orders"), v.null()),
  handler: async (ctx, args) => {
    const expected = process.env.STRIPE_WEBHOOK_BRIDGE_SECRET;
    if (!expected || args.webhookKey !== expected) {
      throw new Error("Unauthorized webhook");
    }
    return await markOrderPaid(ctx, {
      stripeCheckoutSessionId: args.stripeCheckoutSessionId,
      stripePaymentIntentId: args.stripePaymentIntentId,
    });
  },
});

/**
 * Fulfill a paid Checkout session: mark order paid, decrement stock, clear cart.
 * Idempotent — Stripe may deliver the same event more than once.
 */
async function markOrderPaid(
  ctx: {
    db: MutationCtx["db"];
  },
  args: {
    stripeCheckoutSessionId: string;
    stripePaymentIntentId?: string;
  },
): Promise<Id<"orders"> | null> {
  const order = await ctx.db
    .query("orders")
    .withIndex("by_checkout_session", (q) =>
      q.eq("stripeCheckoutSessionId", args.stripeCheckoutSessionId),
    )
    .unique();
  if (!order) {
    // Session may arrive before attachCheckoutSession finishes, or be unknown.
    return null;
  }
  // Already fulfilled (retry / duplicate webhook) — do not touch inventory again.
  if (order.status !== "pending_payment") {
    return order._id;
  }

  await ctx.db.patch(order._id, {
    status: "paid",
    stripePaymentIntentId: args.stripePaymentIntentId,
  });

  const items = await ctx.db
    .query("orderItems")
    .withIndex("by_order", (q) => q.eq("orderId", order._id))
    .collect();

  for (const item of items) {
    const inventory = await ctx.db
      .query("inventory")
      .withIndex("by_org_and_product", (q) =>
        q.eq("orgId", order.orgId).eq("productId", item.productId),
      )
      .unique();
    if (!inventory) {
      continue;
    }
    const nextQty = inventory.quantity - item.quantity;
    if (nextQty < 0) {
      throw new Error(`Inventory went negative for ${item.name}`);
    }
    await ctx.db.patch(inventory._id, { quantity: nextQty });
  }

  // Clear only this store's cart lines for the buyer.
  const cartItems = await ctx.db
    .query("cartItems")
    .withIndex("by_user_and_org", (q) =>
      q.eq("userId", order.userId).eq("orgId", order.orgId),
    )
    .collect();
  for (const cartItem of cartItems) {
    await ctx.db.delete(cartItem._id);
  }

  return order._id;
}
