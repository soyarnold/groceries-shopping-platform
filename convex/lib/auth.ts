import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

export type UserIdentity = NonNullable<
  Awaited<ReturnType<QueryCtx["auth"]["getUserIdentity"]>>
>;

export async function getIdentity(ctx: Ctx): Promise<UserIdentity> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
}

export async function getIdentityOrNull(
  ctx: Ctx,
): Promise<UserIdentity | null> {
  return await ctx.auth.getUserIdentity();
}

export async function getCurrentUser(ctx: Ctx): Promise<Doc<"users">> {
  const identity = await getIdentity(ctx);
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function getCurrentUserOrNull(
  ctx: Ctx,
): Promise<Doc<"users"> | null> {
  const identity = await getIdentityOrNull(ctx);
  if (!identity) {
    return null;
  }

  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

export async function ensureCurrentUser(
  ctx: MutationCtx,
): Promise<Id<"users">> {
  const identity = await getIdentity(ctx);
  const existing = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      email: identity.email ?? existing.email,
      name: identity.name ?? existing.name,
      clerkUserId: identity.subject,
    });
    return existing._id;
  }

  return await ctx.db.insert("users", {
    tokenIdentifier: identity.tokenIdentifier,
    clerkUserId: identity.subject,
    email: identity.email ?? "",
    name: identity.name ?? "Shopper",
    membershipStatus: "none",
  });
}
