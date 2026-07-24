import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertNonNegativeInt, nextUniqueSlug } from "./lib/catalog";
import { requireActiveOrgId } from "./lib/org";
import { slugify } from "./lib/slug";

const categoryValidator = v.object({
  _id: v.id("categories"),
  _creationTime: v.number(),
  orgId: v.string(),
  name: v.string(),
  slug: v.string(),
  sortOrder: v.number(),
  active: v.boolean(),
});

export const listMine = query({
  args: {},
  returns: v.array(categoryValidator),
  handler: async (ctx) => {
    const orgId = await requireActiveOrgId(ctx);
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();
    return categories.sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
    );
  },
});

export const listActiveByStoreSlug = query({
  args: { storeSlug: v.string() },
  returns: v.array(categoryValidator),
  handler: async (ctx, args) => {
    const store = await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", args.storeSlug))
      .unique();
    if (!store || !store.active) {
      return [];
    }

    const categories = await ctx.db
      .query("categories")
      .withIndex("by_org_and_active", (q) =>
        q.eq("orgId", store.orgId).eq("active", true),
      )
      .collect();
    return categories.sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
    );
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    sortOrder: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  returns: v.id("categories"),
  handler: async (ctx, args) => {
    const orgId = await requireActiveOrgId(ctx);
    const name = args.name.trim();
    if (!name) {
      throw new Error("Category name is required");
    }

    const existing = await ctx.db
      .query("categories")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();
    const slug = nextUniqueSlug(name, new Set(existing.map((c) => c.slug)));
    const sortOrder = assertNonNegativeInt(
      args.sortOrder ?? existing.length,
      "sortOrder",
    );

    return await ctx.db.insert("categories", {
      orgId,
      name,
      slug,
      sortOrder,
      active: args.active ?? true,
    });
  },
});

export const update = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const orgId = await requireActiveOrgId(ctx);
    const category = await ctx.db.get(args.categoryId);
    if (!category || category.orgId !== orgId) {
      throw new Error("Category not found");
    }

    const patch: {
      name?: string;
      slug?: string;
      sortOrder?: number;
      active?: boolean;
    } = {};

    if (args.name !== undefined) {
      const name = args.name.trim();
      if (!name) {
        throw new Error("Category name is required");
      }
      patch.name = name;
      const desired = slugify(name) || category.slug;
      if (desired !== category.slug) {
        const siblings = await ctx.db
          .query("categories")
          .withIndex("by_org", (q) => q.eq("orgId", orgId))
          .collect();
        patch.slug = nextUniqueSlug(
          name,
          new Set(
            siblings.filter((c) => c._id !== category._id).map((c) => c.slug),
          ),
        );
      }
    }
    if (args.sortOrder !== undefined) {
      patch.sortOrder = assertNonNegativeInt(args.sortOrder, "sortOrder");
    }
    if (args.active !== undefined) {
      patch.active = args.active;
    }

    await ctx.db.patch(args.categoryId, patch);
    return null;
  },
});
