import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ensureCurrentUser } from "./lib/auth";
import {
  getOrgIdFromIdentity,
  getOrgRoleFromIdentity,
  getStoreByOrgId,
  getStoreBySlug,
  requireActiveOrgId,
} from "./lib/org";
import { slugify } from "./lib/slug";

const storeValidator = v.object({
  _id: v.id("stores"),
  _creationTime: v.number(),
  orgId: v.string(),
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  active: v.boolean(),
  stripeAccountHint: v.optional(v.string()),
});

export const listActive = query({
  args: {},
  returns: v.array(storeValidator),
  handler: async (ctx) => {
    const stores = await ctx.db
      .query("stores")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    return stores.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(storeValidator, v.null()),
  handler: async (ctx, args) => {
    return await getStoreBySlug(ctx, args.slug);
  },
});

export const getMine = query({
  args: {},
  returns: v.union(storeValidator, v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const orgId = getOrgIdFromIdentity(identity);
    if (!orgId) {
      return null;
    }

    return await getStoreByOrgId(ctx, orgId);
  },
});

/** Helps debug Clerk org ↔ Convex JWT claim wiring on the admin dashboard. */
export const getAuthContext = query({
  args: {},
  returns: v.union(
    v.object({
      orgId: v.union(v.string(), v.null()),
      orgRole: v.union(v.string(), v.null()),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    return {
      orgId: getOrgIdFromIdentity(identity),
      orgRole: getOrgRoleFromIdentity(identity),
    };
  },
});

export const ensureFromActiveOrg = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.id("stores"),
  handler: async (ctx, args) => {
    await ensureCurrentUser(ctx);
    const orgId = await requireActiveOrgId(ctx);

    const existing = await getStoreByOrgId(ctx, orgId);
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        description: args.description,
        active: true,
      });
      return existing._id;
    }

    let slug = slugify(args.name);
    if (!slug) {
      slug = `store-${orgId.slice(-6).toLowerCase()}`;
    }

    const slugTaken = await getStoreBySlug(ctx, slug);
    if (slugTaken && slugTaken.orgId !== orgId) {
      slug = `${slug}-${orgId.slice(-4).toLowerCase()}`;
    }

    return await ctx.db.insert("stores", {
      orgId,
      name: args.name,
      slug,
      description: args.description,
      active: true,
    });
  },
});
