import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { ensureCurrentUser } from "./lib/auth";
import { nextUniqueSlug } from "./lib/catalog";
import { getStoreByOrgId, requireActiveOrgId } from "./lib/org";
import { DEMO_SEED_CATALOG, summarizeSeedCatalog } from "./lib/seedCatalog";

/**
 * Seed demo categories/products/inventory for the active Clerk org's store.
 * Idempotent by default: skips if the store already has products.
 * Pass `force: true` to add the demo set again (unique slugs appended).
 */
export const seedDemoCatalog = mutation({
  args: {
    force: v.optional(v.boolean()),
  },
  returns: v.object({
    skipped: v.boolean(),
    categoryCount: v.number(),
    productCount: v.number(),
    withMemberPrice: v.number(),
  }),
  handler: async (ctx, args) => {
    await ensureCurrentUser(ctx);
    // Same staff gate as catalog CRUD — org creator is typically org:admin.
    const orgId = await requireActiveOrgId(ctx);

    const store = await getStoreByOrgId(ctx, orgId);
    if (!store) {
      throw new Error("Create the store record from Admin before seeding");
    }

    const summary = summarizeSeedCatalog(DEMO_SEED_CATALOG);

    const existingProducts = await ctx.db
      .query("products")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    if (existingProducts.length > 0 && !args.force) {
      return {
        skipped: true,
        categoryCount: 0,
        productCount: 0,
        withMemberPrice: 0,
      };
    }

    const existingCategories = await ctx.db
      .query("categories")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();
    const categorySlugs = new Set(existingCategories.map((c) => c.slug));
    const productSlugs = new Set(existingProducts.map((p) => p.slug));

    let categoryCount = 0;
    let productCount = 0;
    let withMemberPrice = 0;

    for (const category of DEMO_SEED_CATALOG) {
      const categorySlug = nextUniqueSlug(category.name, categorySlugs);
      categorySlugs.add(categorySlug);

      const categoryId = await ctx.db.insert("categories", {
        orgId,
        name: category.name,
        slug: categorySlug,
        sortOrder: category.sortOrder,
        active: true,
      });
      categoryCount += 1;

      for (const product of category.products) {
        const productSlug = nextUniqueSlug(product.name, productSlugs);
        productSlugs.add(productSlug);

        const productId = await ctx.db.insert("products", {
          orgId,
          categoryId,
          name: product.name,
          slug: productSlug,
          description: product.description,
          priceCents: product.priceCents,
          memberPriceCents: product.memberPriceCents,
          unit: product.unit,
          active: true,
        });

        await ctx.db.insert("inventory", {
          orgId,
          productId,
          quantity: product.quantity,
          lowStockThreshold: product.lowStockThreshold,
        });

        productCount += 1;
        if (product.memberPriceCents !== undefined) {
          withMemberPrice += 1;
        }
      }
    }

    if (
      categoryCount !== summary.categoryCount ||
      productCount !== summary.productCount
    ) {
      throw new Error("Seed write counts drifted from catalog summary");
    }

    return {
      skipped: false,
      categoryCount,
      productCount,
      withMemberPrice,
    };
  },
});
