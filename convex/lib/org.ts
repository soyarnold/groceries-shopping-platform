import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { getIdentity, getIdentityOrNull, type UserIdentity } from "./auth";

type Ctx = QueryCtx | MutationCtx;

type IdentityWithOrg = UserIdentity & {
  org_id?: unknown;
  orgId?: unknown;
  org_role?: unknown;
  orgRole?: unknown;
  o?: {
    id?: unknown;
    rol?: unknown;
    role?: unknown;
  };
  "o.id"?: unknown;
  "o.rol"?: unknown;
};

function asNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Read active Clerk org id from Convex identity.
 * Supports JWT-template claims (`org_id`) and session-token claim `o.id`.
 */
export function getOrgIdFromIdentity(identity: UserIdentity): string | null {
  const record = identity as IdentityWithOrg;
  return (
    asNonEmptyString(record.org_id) ??
    asNonEmptyString(record.orgId) ??
    asNonEmptyString(record["o.id"]) ??
    (record.o && typeof record.o === "object"
      ? asNonEmptyString(record.o.id)
      : null)
  );
}

/**
 * Read Clerk org role from Convex identity.
 * Session tokens use `o.rol` as `admin` (no `org:` prefix); JWT templates
 * often use `org_role` as `org:admin`.
 */
export function getOrgRoleFromIdentity(identity: UserIdentity): string | null {
  const record = identity as IdentityWithOrg;
  return (
    asNonEmptyString(record.org_role) ??
    asNonEmptyString(record.orgRole) ??
    asNonEmptyString(record["o.rol"]) ??
    (record.o && typeof record.o === "object"
      ? (asNonEmptyString(record.o.rol) ?? asNonEmptyString(record.o.role))
      : null)
  );
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
    throw new Error(
      "No active organization in Convex auth — select a store org and refresh (Clerk JWT must include org claims)",
    );
  }
  if (!isStoreStaffRole(getOrgRoleFromIdentity(identity))) {
    throw new Error("Unauthorized: store staff access required");
  }
  return orgId;
}

/**
 * Soft variant for reactive admin queries — return null while Clerk/Convex
 * auth is still settling instead of throwing "Not authenticated".
 */
export async function getActiveOrgIdOrNull(ctx: Ctx): Promise<string | null> {
  const identity = await getIdentityOrNull(ctx);
  if (!identity) {
    return null;
  }
  const orgId = getOrgIdFromIdentity(identity);
  if (!orgId) {
    return null;
  }
  if (!isStoreStaffRole(getOrgRoleFromIdentity(identity))) {
    return null;
  }
  return orgId;
}

export async function requireStoreAdmin(ctx: Ctx): Promise<string> {
  const identity = await getIdentity(ctx);
  const orgId = getOrgIdFromIdentity(identity);
  if (!orgId) {
    throw new Error(
      "No active organization in Convex auth — select a store org and refresh (Clerk JWT must include org claims)",
    );
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
