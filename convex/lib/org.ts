import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { getIdentity, type UserIdentity } from "./auth";

type Ctx = QueryCtx | MutationCtx;

/** Read Clerk org id from Convex identity (JWT custom claims). */
export function getOrgIdFromIdentity(identity: UserIdentity): string | null {
  const record = identity as UserIdentity & {
    org_id?: unknown;
    orgId?: unknown;
  };
  const value = record.org_id ?? record.orgId;
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Read Clerk org role from Convex identity. */
export function getOrgRoleFromIdentity(identity: UserIdentity): string | null {
  const record = identity as UserIdentity & {
    org_role?: unknown;
    orgRole?: unknown;
  };
  const value = record.org_role ?? record.orgRole;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function isStoreStaffRole(role: string | null): boolean {
  if (!role) {
    return false;
  }
  return (
    role === "org:admin" ||
    role === "admin" ||
    role === "org:member" ||
    role === "member"
  );
}

export function isStoreAdminRole(role: string | null): boolean {
  if (!role) {
    return false;
  }
  return role === "org:admin" || role === "admin";
}

export async function requireActiveOrgId(ctx: Ctx): Promise<string> {
  const identity = await getIdentity(ctx);
  const orgId = getOrgIdFromIdentity(identity);
  if (!orgId) {
    throw new Error("No active organization selected");
  }
  if (!isStoreStaffRole(getOrgRoleFromIdentity(identity))) {
    throw new Error("Unauthorized: store staff access required");
  }
  return orgId;
}

export async function requireStoreAdmin(ctx: Ctx): Promise<string> {
  const identity = await getIdentity(ctx);
  const orgId = getOrgIdFromIdentity(identity);
  if (!orgId) {
    throw new Error("No active organization selected");
  }
  if (!isStoreAdminRole(getOrgRoleFromIdentity(identity))) {
    throw new Error("Unauthorized: store admin access required");
  }
  return orgId;
}

export async function requireOrgMatches(
  ctx: Ctx,
  orgId: string,
): Promise<UserIdentity> {
  const identity = await getIdentity(ctx);
  const activeOrgId = getOrgIdFromIdentity(identity);
  if (activeOrgId !== orgId) {
    throw new Error("Unauthorized: organization mismatch");
  }
  if (!isStoreStaffRole(getOrgRoleFromIdentity(identity))) {
    throw new Error("Unauthorized: store staff access required");
  }
  return identity;
}

export async function getStoreByOrgId(
  ctx: Ctx,
  orgId: string,
): Promise<Doc<"stores"> | null> {
  return await ctx.db
    .query("stores")
    .withIndex("by_org", (q) => q.eq("orgId", orgId))
    .unique();
}

export async function getStoreBySlug(
  ctx: Ctx,
  slug: string,
): Promise<Doc<"stores"> | null> {
  return await ctx.db
    .query("stores")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
}
