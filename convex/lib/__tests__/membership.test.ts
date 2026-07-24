import { describe, expect, it } from "vitest";
import {
  isMembershipActive,
  membershipLabel,
  membershipStatusFromStripe,
  resolvePriceCents,
} from "../membership";

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

describe("Stripe subscription status mapping", () => {
  it("maps active and trialing to active", () => {
    expect(membershipStatusFromStripe("active")).toBe("active");
    expect(membershipStatusFromStripe("trialing")).toBe("active");
  });

  it("maps past_due and unpaid", () => {
    expect(membershipStatusFromStripe("past_due")).toBe("past_due");
    expect(membershipStatusFromStripe("unpaid")).toBe("past_due");
  });

  it("maps canceled states", () => {
    expect(membershipStatusFromStripe("canceled")).toBe("canceled");
    expect(membershipStatusFromStripe("incomplete_expired")).toBe("canceled");
  });

  it("maps incomplete / paused / unknown to none", () => {
    expect(membershipStatusFromStripe("incomplete")).toBe("none");
    expect(membershipStatusFromStripe("paused")).toBe("none");
    expect(membershipStatusFromStripe("weird")).toBe("none");
  });

  it("labels statuses for UI", () => {
    expect(membershipLabel("active")).toBe("Plus active");
    expect(membershipLabel("none")).toBe("Free account");
  });
});
