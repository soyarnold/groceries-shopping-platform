import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getCurrentUserOrNull } from "./lib/auth";
import {
  assertOptionalMemberPrice,
  assertPositivePriceCents,
  nextUniqueSlug,
} from "./lib/catalog";
import { resolvePriceCents } from "./lib/membership";
import { requireActiveOrgId } from "./lib/org";
import { slugify } from "./lib/slug";

const productValidator = v.object({
  _id: v.id("products"),
  _creationTime: v.number(),
  orgId: v.string(),
  categoryId: v.id("categories"),
  name: v.string(),
  slug: v.string(),
  description: v.string(),
  priceCents: v.number(),
  memberPriceCents: v.optional(v.number()),
  imageStorageId: v.optional(v.id("_storage")),
  unit: v.string(),
  active: v.boolean(),
});

const productPublicValidator = v.object({
  _id: v.id("products"),
  _creationTime: v.number(),
  orgId: v.string(),
  categoryId: v.id("categories"),
  categorySlug: v.string(),
  categoryName: v.string(),
  name: v.string(),
  slug: v.string(),
  description: v.string(),
  priceCents: v.number(),
  memberPriceCents: v.optional(v.number()),
  displayPriceCents: v.number(),
  unit: v.string(),
  active: v.boolean(),
  quantity: v.union(v.number(), v.null()),
});

export const listMine = query({
  args: {},
  returns: v.array(productValidator),
  handler: async (ctx) => {
    const orgId = await requireActiveOrgId(ctx);
    const products = await ctx.db
      .query("products")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();
    return products.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const listActiveByStoreSlug = query({
  args: {
    storeSlug: v.string(),
    categorySlug: v.optional(v.string()),
  },
  returns: v.array(productPublicValidator),
  handler: async (ctx, args) => {
    const store = await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", args.storeSlug))
      .unique();
    if (!store || !store.active) {
      return [];
    }

    const user = await getCurrentUserOrNull(ctx);
    const membershipStatus = user?.membershipStatus ?? "none";

    let filteredCategoryId: Id<"categories"> | null = null;
    if (args.categorySlug !== undefined) {
      const categorySlug = args.categorySlug;
      const category = await ctx.db
        .query("categories")
        .withIndex("by_org_and_slug", (q) =>
          q.eq("orgId", store.orgId).eq("slug", categorySlug),
        )
        .unique();
      if (!category || !category.active) {
        return [];
      }
      filteredCategoryId = category._id;
    }

    const products = filteredCategoryId
      ? await ctx.db
          .query("products")
          .withIndex("by_org_and_category", (q) =>
            q.eq("orgId", store.orgId).eq("categoryId", filteredCategoryId),
          )
          .collect()
      : await ctx.db
          .query("products")
          .withIndex("by_org_and_active", (q) =>
            q.eq("orgId", store.orgId).eq("active", true),
          )
          .collect();

    const enriched = [];
    for (const product of products) {
      if (!product.active) {
        continue;
      }
      const category = await ctx.db.get(product.categoryId);
      if (!category || !category.active) {
        continue;
      }
      const inventory = await ctx.db
        .query("inventory")
        .withIndex("by_org_and_product", (q) =>
          q.eq("orgId", store.orgId).eq("productId", product._id),
        )
        .unique();
      enriched.push({
        ...product,
        categorySlug: category.slug,
        categoryName: category.name,
        displayPriceCents: resolvePriceCents({
          priceCents: product.priceCents,
          memberPriceCents: product.memberPriceCents,
          membershipStatus,
        }),
        quantity: inventory?.quantity ?? null,
      });
    }

    return enriched.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const searchByStoreSlug = query({
  args: {
    storeSlug: v.string(),
    query: v.string(),
  },
  returns: v.array(productPublicValidator),
  handler: async (ctx, args) => {
    const store = await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", args.storeSlug))
      .unique();
    if (!store || !store.active) {
      return [];
    }

    const term = args.query.trim();
    if (!term) {
      return [];
    }

    const user = await getCurrentUserOrNull(ctx);
    const membershipStatus = user?.membershipStatus ?? "none";

    const products = await ctx.db
      .query("products")
      .withSearchIndex("search_name", (q) =>
        q.search("name", term).eq("orgId", store.orgId).eq("active", true),
      )
      .take(50);

    const enriched = [];
    for (const product of products) {
      const category = await ctx.db.get(product.categoryId);
      if (!category || !category.active) {
        continue;
      }
      const inventory = await ctx.db
        .query("inventory")
        .withIndex("by_org_and_product", (q) =>
          q.eq("orgId", store.orgId).eq("productId", product._id),
        )
        .unique();
      enriched.push({
        ...product,
        categorySlug: category.slug,
        categoryName: category.name,
        displayPriceCents: resolvePriceCents({
          priceCents: product.priceCents,
          memberPriceCents: product.memberPriceCents,
          membershipStatus,
        }),
        quantity: inventory?.quantity ?? null,
      });
    }
    return enriched;
  },
});

export const getByStoreAndSlug = query({
  args: {
    storeSlug: v.string(),
    productSlug: v.string(),
  },
  returns: v.union(productPublicValidator, v.null()),
  handler: async (ctx, args) => {
    const store = await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", args.storeSlug))
      .unique();
    if (!store || !store.active) {
      return null;
    }

    const product = await ctx.db
      .query("products")
      .withIndex("by_org_and_slug", (q) =>
        q.eq("orgId", store.orgId).eq("slug", args.productSlug),
      )
      .unique();
    if (!product || !product.active) {
      return null;
    }

    const category = await ctx.db.get(product.categoryId);
    if (!category || !category.active) {
      return null;
    }

    const user = await getCurrentUserOrNull(ctx);
    const inventory = await ctx.db
      .query("inventory")
      .withIndex("by_org_and_product", (q) =>
        q.eq("orgId", store.orgId).eq("productId", product._id),
      )
      .unique();

    return {
      ...product,
      categorySlug: category.slug,
      categoryName: category.name,
      displayPriceCents: resolvePriceCents({
        priceCents: product.priceCents,
        memberPriceCents: product.memberPriceCents,
        membershipStatus: user?.membershipStatus ?? "none",
      }),
      quantity: inventory?.quantity ?? null,
    };
  },
});

export const create = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.string(),
    description: v.string(),
    priceCents: v.number(),
    memberPriceCents: v.optional(v.number()),
    unit: v.string(),
    active: v.optional(v.boolean()),
    initialQuantity: v.optional(v.number()),
    lowStockThreshold: v.optional(v.number()),
  },
  returns: v.id("products"),
  handler: async (ctx, args) => {
    const orgId = await requireActiveOrgId(ctx);
    const category = await ctx.db.get(args.categoryId);
    if (!category || category.orgId !== orgId) {
      throw new Error("Category not found");
    }

    const name = args.name.trim();
    const unit = args.unit.trim();
    if (!name || !unit) {
      throw new Error("Name and unit are required");
    }

    const priceCents = assertPositivePriceCents(args.priceCents, "priceCents");
    const memberPriceCents = assertOptionalMemberPrice(
      priceCents,
      args.memberPriceCents,
    );

    const existing = await ctx.db
      .query("products")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();
    const slug = nextUniqueSlug(name, new Set(existing.map((p) => p.slug)));

    const productId = await ctx.db.insert("products", {
      orgId,
      categoryId: args.categoryId,
      name,
      slug,
      description: args.description.trim(),
      priceCents,
      memberPriceCents,
      unit,
      active: args.active ?? true,
    });

    const quantity = args.initialQuantity ?? 0;
    if (quantity < 0 || !Number.isInteger(quantity)) {
      throw new Error("initialQuantity must be a non-negative integer");
    }
    const lowStockThreshold = args.lowStockThreshold ?? 5;
    if (lowStockThreshold < 0 || !Number.isInteger(lowStockThreshold)) {
      throw new Error("lowStockThreshold must be a non-negative integer");
    }

    await ctx.db.insert("inventory", {
      orgId,
      productId,
      quantity,
      lowStockThreshold,
    });

    return productId;
  },
});

export const update = mutation({
  args: {
    productId: v.id("products"),
    categoryId: v.optional(v.id("categories")),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    priceCents: v.optional(v.number()),
    memberPriceCents: v.optional(v.union(v.number(), v.null())),
    unit: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const orgId = await requireActiveOrgId(ctx);
    const product = await ctx.db.get(args.productId);
    if (!product || product.orgId !== orgId) {
      throw new Error("Product not found");
    }

    const patch: {
      categoryId?: typeof product.categoryId;
      name?: string;
      slug?: string;
      description?: string;
      priceCents?: number;
      memberPriceCents?: number | undefined;
      unit?: string;
      active?: boolean;
    } = {};

    if (args.categoryId !== undefined) {
      const category = await ctx.db.get(args.categoryId);
      if (!category || category.orgId !== orgId) {
        throw new Error("Category not found");
      }
      patch.categoryId = args.categoryId;
    }

    if (args.name !== undefined) {
      const name = args.name.trim();
      if (!name) {
        throw new Error("Name is required");
      }
      patch.name = name;
      const desired = slugify(name) || product.slug;
      if (desired !== product.slug) {
        const siblings = await ctx.db
          .query("products")
          .withIndex("by_org", (q) => q.eq("orgId", orgId))
          .collect();
        patch.slug = nextUniqueSlug(
          name,
          new Set(
            siblings.filter((p) => p._id !== product._id).map((p) => p.slug),
          ),
        );
      }
    }

    if (args.description !== undefined) {
      patch.description = args.description.trim();
    }
    if (args.unit !== undefined) {
      const unit = args.unit.trim();
      if (!unit) {
        throw new Error("Unit is required");
      }
      patch.unit = unit;
    }
    if (args.active !== undefined) {
      patch.active = args.active;
    }

    const nextPrice =
      args.priceCents !== undefined
        ? assertPositivePriceCents(args.priceCents, "priceCents")
        : product.priceCents;
    if (args.priceCents !== undefined) {
      patch.priceCents = nextPrice;
    }

    if (args.memberPriceCents !== undefined) {
      if (args.memberPriceCents === null) {
        const { _id, _creationTime, memberPriceCents: _, ...rest } = product;
        await ctx.db.replace(_id, {
          ...rest,
          ...patch,
          priceCents: nextPrice,
        });
        return null;
      }
      patch.memberPriceCents = assertOptionalMemberPrice(
        nextPrice,
        args.memberPriceCents,
      );
    } else if (
      args.priceCents !== undefined &&
      product.memberPriceCents !== undefined
    ) {
      patch.memberPriceCents = assertOptionalMemberPrice(
        nextPrice,
        product.memberPriceCents,
      );
    }

    await ctx.db.patch(args.productId, patch);
    return null;
  },
});
