import { describe, expect, it } from "vitest";
import {
  assertOptionalMemberPrice,
  assertPositivePriceCents,
  formatPriceCents,
  isLowStock,
  nextUniqueSlug,
} from "../catalog";

describe("catalog helpers", () => {
  it("validates positive prices", () => {
    expect(assertPositivePriceCents(199, "priceCents")).toBe(199);
    expect(() => assertPositivePriceCents(0, "priceCents")).toThrow();
    expect(() => assertPositivePriceCents(-1, "priceCents")).toThrow();
  });

  it("validates member price against regular price", () => {
    expect(assertOptionalMemberPrice(500, 400)).toBe(400);
    expect(assertOptionalMemberPrice(500, undefined)).toBeUndefined();
    expect(() => assertOptionalMemberPrice(500, 600)).toThrow();
  });

  it("generates unique slugs", () => {
    expect(nextUniqueSlug("Apples", new Set())).toBe("apples");
    expect(nextUniqueSlug("Apples", new Set(["apples"]))).toBe("apples-2");
    expect(nextUniqueSlug("Apples", new Set(["apples", "apples-2"]))).toBe(
      "apples-3",
    );
  });

  it("formats money and detects low stock", () => {
    expect(formatPriceCents(199)).toBe("$1.99");
    expect(isLowStock(3, 5)).toBe(true);
    expect(isLowStock(6, 5)).toBe(false);
  });
});
