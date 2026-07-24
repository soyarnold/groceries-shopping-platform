import { describe, expect, it } from "vitest";
import {
  assertAdminTransition,
  canAdminTransition,
  computeOrderTotals,
} from "../orders";

describe("order helpers", () => {
  it("computes totals", () => {
    expect(
      computeOrderTotals([
        { unitPriceCents: 100, quantity: 2 },
        { unitPriceCents: 50, quantity: 1 },
      ]),
    ).toEqual({ subtotalCents: 250, totalCents: 250 });
  });

  it("allows valid admin transitions", () => {
    expect(canAdminTransition("paid", "preparing")).toBe(true);
    expect(canAdminTransition("preparing", "ready")).toBe(true);
    expect(canAdminTransition("ready", "completed")).toBe(true);
    expect(canAdminTransition("completed", "paid")).toBe(false);
    expect(() => assertAdminTransition("pending_payment", "paid")).toThrow();
  });
});
