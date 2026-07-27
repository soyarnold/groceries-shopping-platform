import { describe, expect, it } from "vitest";
import type { UserIdentity } from "../auth";
import {
  getOrgIdFromIdentity,
  getOrgRoleFromIdentity,
  isStoreAdminRole,
  isStoreStaffRole,
} from "../org";

function identity(partial: Record<string, unknown>): UserIdentity {
  return {
    tokenIdentifier: "clerk|user_1",
    subject: "user_1",
    issuer: "https://example.clerk.accounts.dev",
    ...partial,
  } as UserIdentity;
}

describe("org identity helpers", () => {
  it("reads org_id claim", () => {
    expect(getOrgIdFromIdentity(identity({ org_id: "org_123" }))).toBe(
      "org_123",
    );
  });

  it("reads orgId camelCase claim", () => {
    expect(getOrgIdFromIdentity(identity({ orgId: "org_456" }))).toBe(
      "org_456",
    );
  });

  it("returns null without org", () => {
    expect(getOrgIdFromIdentity(identity({}))).toBeNull();
  });

  it("classifies staff and admin roles", () => {
    expect(isStoreStaffRole("org:member")).toBe(true);
    expect(isStoreStaffRole("org:admin")).toBe(true);
    expect(isStoreAdminRole("org:member")).toBe(false);
    expect(isStoreAdminRole("org:admin")).toBe(true);
    expect(getOrgRoleFromIdentity(identity({ org_role: "org:admin" }))).toBe(
      "org:admin",
    );
  });

  it("reads org from session-token o claim", () => {
    expect(
      getOrgIdFromIdentity(identity({ o: { id: "org_789", rol: "admin" } })),
    ).toBe("org_789");
    expect(
      getOrgRoleFromIdentity(identity({ o: { id: "org_789", rol: "admin" } })),
    ).toBe("admin");
    expect(isStoreAdminRole("admin")).toBe(true);
  });

  it("reads dotted o.id claim form", () => {
    expect(getOrgIdFromIdentity(identity({ "o.id": "org_dot" }))).toBe(
      "org_dot",
    );
  });
});
