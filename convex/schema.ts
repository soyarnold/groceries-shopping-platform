import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const membershipStatus = v.union(
  v.literal("none"),
  v.literal("active"),
  v.literal("past_due"),
  v.literal("canceled"),
);

const orderStatus = v.union(
  v.literal("pending_payment"),
  v.literal("paid"),
  v.literal("preparing"),
  v.literal("ready"),
  v.literal("completed"),
  v.literal("canceled"),
  v.literal("refunded"),
);

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    clerkUserId: v.string(),
    email: v.string(),
    name: v.string(),
    stripeCustomerId: v.optional(v.string()),
    membershipStatus: membershipStatus,
    membershipEndsAt: v.optional(v.number()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_clerk_user", ["clerkUserId"])
    .index("by_email", ["email"])
    .index("by_stripe_customer", ["stripeCustomerId"]),

  stores: defineTable({
    orgId: v.string(),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
    stripeAccountHint: v.optional(v.string()),
  })
    .index("by_org", ["orgId"])
    .index("by_slug", ["slug"])
    .index("by_active", ["active"]),

  categories: defineTable({
    orgId: v.string(),
    name: v.string(),
    slug: v.string(),
    sortOrder: v.number(),
    active: v.boolean(),
  })
    .index("by_org", ["orgId"])
    .index("by_org_and_slug", ["orgId", "slug"])
    .index("by_org_and_active", ["orgId", "active"]),

  products: defineTable({
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
  })
    .index("by_org", ["orgId"])
    .index("by_org_and_slug", ["orgId", "slug"])
    .index("by_org_and_category", ["orgId", "categoryId"])
    .index("by_org_and_active", ["orgId", "active"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["orgId", "active"],
    }),

  inventory: defineTable({
    orgId: v.string(),
    productId: v.id("products"),
    quantity: v.number(),
    lowStockThreshold: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_product", ["productId"])
    .index("by_org_and_product", ["orgId", "productId"]),

  cartItems: defineTable({
    userId: v.id("users"),
    orgId: v.string(),
    productId: v.id("products"),
    quantity: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_org", ["userId", "orgId"])
    .index("by_user_org_product", ["userId", "orgId", "productId"]),

  favorites: defineTable({
    userId: v.id("users"),
    orgId: v.string(),
    productId: v.id("products"),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_org", ["userId", "orgId"])
    .index("by_user_org_product", ["userId", "orgId", "productId"]),

  orders: defineTable({
    orgId: v.string(),
    userId: v.id("users"),
    status: orderStatus,
    subtotalCents: v.number(),
    totalCents: v.number(),
    currency: v.string(),
    stripeCheckoutSessionId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    memberPricingApplied: v.boolean(),
  })
    .index("by_org", ["orgId"])
    .index("by_user", ["userId"])
    .index("by_org_and_status", ["orgId", "status"])
    .index("by_checkout_session", ["stripeCheckoutSessionId"]),

  orderItems: defineTable({
    orderId: v.id("orders"),
    productId: v.id("products"),
    name: v.string(),
    unit: v.string(),
    quantity: v.number(),
    unitPriceCents: v.number(),
    lineTotalCents: v.number(),
  }).index("by_order", ["orderId"]),

  membershipEvents: defineTable({
    userId: v.id("users"),
    stripeEventId: v.string(),
    type: v.string(),
    membershipStatus: membershipStatus,
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_stripe_event", ["stripeEventId"]),
});
