import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertNonNegativeInt, isLowStock } from "./lib/catalog";
import { requireActiveOrgId } from "./lib/org";

const inventoryRowValidator = v.object({
  _id: v.id("inventory"),
  _creationTime: v.number(),
  orgId: v.string(),
  productId: v.id("products"),
  productName: v.string(),
  productSlug: v.string(),
  quantity: v.number(),
  lowStockThreshold: v.number(),
  lowStock: v.boolean(),
});

export const listMine = query({
  args: {},
  returns: v.array(inventoryRowValidator),
  handler: async (ctx) => {
    const orgId = await requireActiveOrgId(ctx);
    const rows = await ctx.db
      .query("inventory")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    const enriched = [];
    for (const row of rows) {
      const product = await ctx.db.get(row.productId);
      if (!product) {
        continue;
      }
      enriched.push({
        ...row,
        productName: product.name,
        productSlug: product.slug,
        lowStock: isLowStock(row.quantity, row.lowStockThreshold),
      });
    }

    return enriched.sort((a, b) => a.productName.localeCompare(b.productName));
  },
});

export const setQuantity = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    lowStockThreshold: v.optional(v.number()),
  },
  returns: v.id("inventory"),
  handler: async (ctx, args) => {
    const orgId = await requireActiveOrgId(ctx);
    const product = await ctx.db.get(args.productId);
    if (!product || product.orgId !== orgId) {
      throw new Error("Product not found");
    }

    const quantity = assertNonNegativeInt(args.quantity, "quantity");
    const existing = await ctx.db
      .query("inventory")
      .withIndex("by_org_and_product", (q) =>
        q.eq("orgId", orgId).eq("productId", args.productId),
      )
      .unique();

    if (existing) {
      const patch: {
        quantity: number;
        lowStockThreshold?: number;
      } = { quantity };
      if (args.lowStockThreshold !== undefined) {
        patch.lowStockThreshold = assertNonNegativeInt(
          args.lowStockThreshold,
          "lowStockThreshold",
        );
      }
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("inventory", {
      orgId,
      productId: args.productId,
      quantity,
      lowStockThreshold: assertNonNegativeInt(
        args.lowStockThreshold ?? 5,
        "lowStockThreshold",
      ),
    });
  },
});

export const adjustQuantity = mutation({
  args: {
    productId: v.id("products"),
    delta: v.number(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const orgId = await requireActiveOrgId(ctx);
    const product = await ctx.db.get(args.productId);
    if (!product || product.orgId !== orgId) {
      throw new Error("Product not found");
    }
    if (!Number.isInteger(args.delta)) {
      throw new Error("delta must be an integer");
    }

    const existing = await ctx.db
      .query("inventory")
      .withIndex("by_org_and_product", (q) =>
        q.eq("orgId", orgId).eq("productId", args.productId),
      )
      .unique();

    const current = existing?.quantity ?? 0;
    const next = current + args.delta;
    if (next < 0) {
      throw new Error("Insufficient inventory");
    }

    if (existing) {
      await ctx.db.patch(existing._id, { quantity: next });
    } else {
      await ctx.db.insert("inventory", {
        orgId,
        productId: args.productId,
        quantity: next,
        lowStockThreshold: 5,
      });
    }

    return next;
  },
});
