import { describe, expect, it } from "vitest";
import { isMembershipActive, resolvePriceCents } from "../membership";

describe("membership pricing", () => {
  it("treats only active as membership", () => {
    expect(isMembershipActive("active")).toBe(true);
    expect(isMembershipActive("none")).toBe(false);
    expect(isMembershipActive("past_due")).toBe(false);
    expect(isMembershipActive("canceled")).toBe(false);
  });

  it("uses member price when active", () => {
    expect(
      resolvePriceCents({
        priceCents: 500,
        memberPriceCents: 400,
        membershipStatus: "active",
      }),
    ).toBe(400);
  });

  it("falls back to regular price without member price", () => {
    expect(
      resolvePriceCents({
        priceCents: 500,
        membershipStatus: "active",
      }),
    ).toBe(500);
  });

  it("ignores member price when not active", () => {
    expect(
      resolvePriceCents({
        priceCents: 500,
        memberPriceCents: 400,
        membershipStatus: "none",
      }),
    ).toBe(500);
  });
});
